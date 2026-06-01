<?php
/**
 * Product synchronisation with the FashionFit API.
 *
 * @package FashionFit
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class FashionFit_Sync {
	private const MAX_STRING_LEN             = 255;
	private const MAX_VARIANTS_PER_PRODUCT   = 120;
	private const MAX_ATTRIBUTES_PER_PRODUCT = 64;
	private const MAX_ATTR_OPTIONS           = 80;
	private const MAX_TAGS                   = 64;
	private const MAX_GALLERY_IMAGES         = 32;
	private const MAX_DESCRIPTION_LEN        = 5000;
	private const MAX_SHORT_DESCRIPTION_LEN  = 1500;

	public function register_hooks() {
		add_action( 'save_post_product', array( $this, 'on_product_saved' ), 20, 1 );
		add_action( 'woocommerce_trash_product', array( $this, 'on_product_trashed' ), 10, 1 );
		add_action( FashionFit::CRON_HOOK, array( $this, 'run_full_sync' ) );
	}

	/* ---------------------------------------------------------------------
	 * Hook callbacks
	 * ------------------------------------------------------------------- */

	public function on_product_saved( $post_id ) {
		if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || wp_is_post_revision( $post_id ) ) {
			return;
		}
		if ( ! FashionFit::is_connected() || ! function_exists( 'wc_get_product' ) ) {
			return;
		}
		if ( 'publish' !== get_post_status( $post_id ) ) {
			return;
		}

		$enabled = get_post_meta( $post_id, '_fashionfit_enabled', true );
		if ( 'no' === $enabled ) {
			$this->deactivate_product( $post_id );
			return;
		}

		$product = wc_get_product( $post_id );
		if ( ! $product ) {
			return;
		}

		$this->push_products( array( $this->build_payload( $product ) ) );
	}

	public function on_product_trashed( $post_id ) {
		if ( FashionFit::is_connected() ) {
			$this->deactivate_product( $post_id );
		}
	}

	/* ---------------------------------------------------------------------
	 * API operations
	 * ------------------------------------------------------------------- */

	/**
	 * Connect the store: verify the API key and resolve the shop id.
	 *
	 * @return array|WP_Error
	 */
	public function connect() {
		$host   = wp_parse_url( home_url(), PHP_URL_HOST );
		$result = FashionFit::api_request( 'GET', '/api/widget/shop?domain=' . rawurlencode( (string) $host ) );
		if ( is_wp_error( $result ) ) {
			return $result;
		}
		if ( empty( $result['shopId'] ) ) {
			return new WP_Error( 'fashionfit_no_shop', __( 'API nie zwróciło identyfikatora sklepu.', 'fashionfit' ) );
		}
		FashionFit::update_setting( 'shop_id', sanitize_text_field( $result['shopId'] ) );
		return $result;
	}

	/**
	 * Push a batch of product payloads to the API.
	 *
	 * @param array $products Array of payload arrays.
	 * @return int|WP_Error Number of synced products, or WP_Error.
	 */
	public function push_products( $products ) {
		$shop_id = FashionFit::get_setting( 'shop_id', '' );
		if ( '' === $shop_id ) {
			return new WP_Error( 'fashionfit_no_shop', __( 'Sklep nie jest połączony.', 'fashionfit' ) );
		}

		$result = FashionFit::api_request(
			'POST',
			'/api/widget/products/sync',
			array(
				'shopId'   => $shop_id,
				'products' => array_values( $products ),
			)
		);
		if ( is_wp_error( $result ) ) {
			return $result;
		}
		return isset( $result['synced'] ) ? (int) $result['synced'] : count( $products );
	}

	public function deactivate_product( $post_id ) {
		$shop_id = FashionFit::get_setting( 'shop_id', '' );
		if ( '' === $shop_id ) {
			return;
		}
		FashionFit::api_request(
			'POST',
			'/api/widget/products/deactivate',
			array(
				'shopId'      => $shop_id,
				'external_id' => (string) $post_id,
			)
		);
	}

	/**
	 * Synchronise every eligible published product.
	 *
	 * @return int|WP_Error Number of synced products.
	 */
	public function run_full_sync() {
		if ( ! FashionFit::is_connected() || ! function_exists( 'wc_get_products' ) ) {
			return new WP_Error( 'fashionfit_not_ready', __( 'Sklep nie jest połączony.', 'fashionfit' ) );
		}

		$total = 0;
		$page  = 1;
		do {
			$products = wc_get_products(
				array(
					'status'   => 'publish',
					'limit'    => 50,
					'page'     => $page,
					'orderby'  => 'ID',
					'order'    => 'ASC',
					'return'   => 'objects',
				)
			);

			$payloads = array();
			foreach ( $products as $product ) {
				if ( 'no' === get_post_meta( $product->get_id(), '_fashionfit_enabled', true ) ) {
					continue;
				}
				$payloads[] = $this->build_payload( $product );
			}

			if ( ! empty( $payloads ) ) {
				$synced = $this->push_products( $payloads );
				if ( is_wp_error( $synced ) ) {
					return $synced;
				}
				$total += $synced;
			}

			$page++;
		} while ( count( $products ) === 50 );

		FashionFit::update_setting( 'last_sync_time', current_time( 'mysql' ) );
		FashionFit::update_setting( 'synced_count', $total );

		return $total;
	}

	/* ---------------------------------------------------------------------
	 * Payload building
	 * ------------------------------------------------------------------- */

	private function build_payload( $product ) {
		$product_id = $product->get_id();

		$image_id  = $product->get_image_id();
		$image_url = $image_id ? wp_get_attachment_image_url( $image_id, 'full' ) : '';

		$terms      = wp_get_post_terms( $product_id, 'product_cat' );
		$categories = array();
		if ( ! is_wp_error( $terms ) ) {
			foreach ( $terms as $term ) {
				$categories[] = array(
					'name' => $term->name,
					'slug' => $term->slug,
				);
			}
		}

		$override = get_post_meta( $product_id, '_fashionfit_category', true );
		$category = $override ? $override : $this->map_category( $categories );
		$attributes_data = $this->build_attributes( $product );
		$normalized_facts = $this->extract_product_facts( $attributes_data );
		$gallery_images = $this->build_gallery_images( $product );
		$tags = $this->build_tags( $product_id );
		$modified = $product->get_date_modified();
		$source_updated_at = $modified ? $modified->date( DATE_ATOM ) : null;

		$price = $this->sanitize_decimal( $product->get_price() );
		$regular_price = $this->sanitize_decimal( $product->get_regular_price() );
		$sale_price = $this->sanitize_decimal( $product->get_sale_price() );
		$stock_status = $this->sanitize_limited_string( $product->get_stock_status(), 40 );
		$stock_quantity = $this->sanitize_integer( $product->get_stock_quantity() );
		$description = $this->sanitize_limited_string( wp_strip_all_tags( (string) $product->get_description() ), self::MAX_DESCRIPTION_LEN );
		$short_description = $this->sanitize_limited_string( wp_strip_all_tags( (string) $product->get_short_description() ), self::MAX_SHORT_DESCRIPTION_LEN );
		$variants = $this->build_variants( $product );

		$payload = array(
			'external_id'       => (string) $product_id,
			'name'              => $this->sanitize_limited_string( $product->get_name(), self::MAX_STRING_LEN ),
			'garment_image_url' => $image_url ? $image_url : null,
			'category'          => $category,
			'product_url'       => get_permalink( $product_id ),
			'variants'          => $variants,
			'is_in_stock'       => (bool) $product->is_in_stock(),
		);

		$this->set_payload_value( $payload, 'price', $price );
		$this->set_payload_value( $payload, 'regular_price', $regular_price );
		$this->set_payload_value( $payload, 'sale_price', $sale_price );
		$this->set_payload_value( $payload, 'currency', $this->sanitize_limited_string( get_woocommerce_currency(), 16 ) );
		$this->set_payload_value( $payload, 'stock_status', $stock_status );
		$this->set_payload_value( $payload, 'stock_quantity', $stock_quantity );
		$this->set_payload_value( $payload, 'attributes', ! empty( $attributes_data ) ? $attributes_data : null );
		$this->set_payload_value( $payload, 'colors', ! empty( $normalized_facts['colors'] ) ? $normalized_facts['colors'] : null );
		$this->set_payload_value( $payload, 'sizes', ! empty( $normalized_facts['sizes'] ) ? $normalized_facts['sizes'] : null );
		$this->set_payload_value( $payload, 'material', $normalized_facts['material'] );
		$this->set_payload_value( $payload, 'description', $description );
		$this->set_payload_value( $payload, 'short_description', $short_description );
		$this->set_payload_value( $payload, 'tags', ! empty( $tags ) ? $tags : null );
		$this->set_payload_value( $payload, 'gallery_images', ! empty( $gallery_images ) ? $gallery_images : null );
		$this->set_payload_value( $payload, 'source_updated_at', $source_updated_at );

		return $payload;
	}

	private function build_variants( $product ) {
		if ( ! $product->is_type( 'variable' ) ) {
			return null;
		}
		$variants = array();
		$children = $product->get_children();

		if ( is_array( $children ) ) {
			$children = array_slice( $children, 0, self::MAX_VARIANTS_PER_PRODUCT );
			foreach ( $children as $variation_id ) {
				$variation = wc_get_product( $variation_id );
				if ( ! $variation ) {
					continue;
				}
				$variant_attributes = $this->build_variation_attributes( $variation );
				$variants[] = array(
					'external_id'    => (string) $variation_id,
					'attributes'     => ! empty( $variant_attributes ) ? $variant_attributes : null,
					'price'          => $this->sanitize_decimal( $variation->get_price() ),
					'regular_price'  => $this->sanitize_decimal( $variation->get_regular_price() ),
					'sale_price'     => $this->sanitize_decimal( $variation->get_sale_price() ),
					'stock_status'   => $this->sanitize_limited_string( $variation->get_stock_status(), 40 ),
					'stock_quantity' => $this->sanitize_integer( $variation->get_stock_quantity() ),
					'is_in_stock'    => (bool) $variation->is_in_stock(),
				);
			}
		}

		if ( ! empty( $variants ) ) {
			return $variants;
		}

		// Fallback for shops where variation product objects are unavailable.
		$fallback = array();
		foreach ( $product->get_variation_attributes() as $name => $options ) {
			$key = sanitize_title( (string) $name );
			if ( ! $key ) {
				continue;
			}
			$normalized = $this->normalize_string_array( $options, self::MAX_ATTR_OPTIONS, self::MAX_STRING_LEN );
			if ( empty( $normalized ) ) {
				continue;
			}
			$fallback[ $key ] = $normalized;
		}

		return ! empty( $fallback ) ? $fallback : null;
	}

	private function build_variation_attributes( $variation ) {
		$attributes = array();
		$raw = $variation->get_attributes();
		if ( ! is_array( $raw ) ) {
			return $attributes;
		}

		foreach ( $raw as $key => $value ) {
			$clean_key = $this->sanitize_limited_string( wc_attribute_label( $key ), self::MAX_STRING_LEN );
			$clean_slug = $this->sanitize_limited_string( sanitize_title( (string) $key ), self::MAX_STRING_LEN );
			$clean_value = $this->sanitize_limited_string( (string) $value, self::MAX_STRING_LEN );
			if ( ! $clean_value ) {
				continue;
			}
			$attributes[] = array(
				'name'    => $clean_key ? $clean_key : $clean_slug,
				'slug'    => $clean_slug,
				'options' => array( $clean_value ),
			);
			if ( count( $attributes ) >= self::MAX_ATTRIBUTES_PER_PRODUCT ) {
				break;
			}
		}

		return $attributes;
	}

	private function build_attributes( $product ) {
		$attributes = array();
		$raw_attributes = $product->get_attributes();
		if ( ! is_array( $raw_attributes ) ) {
			return $attributes;
		}

		foreach ( array_slice( $raw_attributes, 0, self::MAX_ATTRIBUTES_PER_PRODUCT ) as $raw_attribute ) {
			$entry = $this->normalize_attribute_entry( $raw_attribute, $product->get_id() );
			if ( ! $entry ) {
				continue;
			}
			$attributes[] = $entry;
		}

		return $attributes;
	}

	private function normalize_attribute_entry( $attribute, $product_id ) {
		if ( ! $attribute ) {
			return null;
		}

		$is_wc_attribute = is_object( $attribute ) && method_exists( $attribute, 'get_name' );
		$name = '';
		$slug = '';
		$options = array();
		$visible = null;
		$variation = null;

		if ( $is_wc_attribute ) {
			$name = $attribute->get_name();
			$slug = sanitize_title( (string) $name );
			$visible = method_exists( $attribute, 'get_visible' ) ? (bool) $attribute->get_visible() : null;
			$variation = method_exists( $attribute, 'get_variation' ) ? (bool) $attribute->get_variation() : null;

			if ( method_exists( $attribute, 'is_taxonomy' ) && $attribute->is_taxonomy() ) {
				$taxonomy = $attribute->get_name();
				$term_names = wc_get_product_terms( $product_id, $taxonomy, array( 'fields' => 'names' ) );
				if ( ! is_wp_error( $term_names ) ) {
					$options = $term_names;
				}
				$label = wc_attribute_label( $taxonomy );
				if ( is_string( $label ) && '' !== trim( $label ) ) {
					$name = $label;
				}
			} else {
				$options = method_exists( $attribute, 'get_options' ) ? $attribute->get_options() : array();
			}
		} elseif ( is_array( $attribute ) ) {
			$name = isset( $attribute['name'] ) ? $attribute['name'] : '';
			$slug = isset( $attribute['slug'] ) ? $attribute['slug'] : sanitize_title( (string) $name );
			$options = isset( $attribute['options'] ) ? $attribute['options'] : array();
			$visible = isset( $attribute['visible'] ) ? (bool) $attribute['visible'] : null;
			$variation = isset( $attribute['variation'] ) ? (bool) $attribute['variation'] : null;
		}

		$clean_name = $this->sanitize_limited_string( (string) $name, self::MAX_STRING_LEN );
		$clean_slug = $this->sanitize_limited_string( (string) $slug, self::MAX_STRING_LEN );
		$clean_options = $this->normalize_string_array( $options, self::MAX_ATTR_OPTIONS, self::MAX_STRING_LEN );

		if ( empty( $clean_name ) && empty( $clean_slug ) ) {
			return null;
		}
		if ( empty( $clean_options ) ) {
			return null;
		}

		return array(
			'name'      => $clean_name ? $clean_name : $clean_slug,
			'slug'      => $clean_slug,
			'options'   => $clean_options,
			'is_visible' => $visible,
			'is_variation' => $variation,
		);
	}

	private function extract_product_facts( $attributes ) {
		$colors = array();
		$sizes = array();
		$materials = array();

		foreach ( $attributes as $attribute ) {
			if ( ! is_array( $attribute ) ) {
				continue;
			}
			$label = strtolower( trim( (string) ( $attribute['slug'] ?? $attribute['name'] ?? '' ) ) );
			$options = isset( $attribute['options'] ) && is_array( $attribute['options'] ) ? $attribute['options'] : array();

			if ( $this->is_color_attribute( $label ) ) {
				$colors = array_merge( $colors, $options );
				continue;
			}
			if ( $this->is_size_attribute( $label ) ) {
				$sizes = array_merge( $sizes, $options );
				continue;
			}
			if ( $this->is_material_attribute( $label ) ) {
				$materials = array_merge( $materials, $options );
			}
		}

		$normalized_colors = $this->normalize_string_array( $colors, self::MAX_ATTR_OPTIONS, self::MAX_STRING_LEN );
		$normalized_sizes = $this->normalize_string_array( $sizes, self::MAX_ATTR_OPTIONS, self::MAX_STRING_LEN );
		$normalized_materials = $this->normalize_string_array( $materials, self::MAX_ATTR_OPTIONS, self::MAX_STRING_LEN );

		return array(
			'colors'   => $normalized_colors,
			'sizes'    => $normalized_sizes,
			'material' => ! empty( $normalized_materials ) ? $normalized_materials[0] : null,
		);
	}

	private function is_color_attribute( $label ) {
		return (bool) preg_match( '/(^|_)(color|kolor|barwa)($|_)/u', $label );
	}

	private function is_size_attribute( $label ) {
		return (bool) preg_match( '/(^|_)(size|rozmiar)($|_)/u', $label );
	}

	private function is_material_attribute( $label ) {
		return (bool) preg_match( '/(^|_)(material|materia\x{0142}|tkanina|fabric|sklad|sk\x{0142}ad)($|_)/u', $label );
	}

	private function build_tags( $product_id ) {
		$terms = wp_get_post_terms( $product_id, 'product_tag' );
		if ( is_wp_error( $terms ) || empty( $terms ) ) {
			return array();
		}

		$tags = array();
		foreach ( array_slice( $terms, 0, self::MAX_TAGS ) as $term ) {
			$name = $this->sanitize_limited_string( $term->name, self::MAX_STRING_LEN );
			$slug = $this->sanitize_limited_string( $term->slug, self::MAX_STRING_LEN );
			if ( ! $name && ! $slug ) {
				continue;
			}
			$tags[] = array(
				'name' => $name ? $name : $slug,
				'slug' => $slug,
			);
		}
		return $tags;
	}

	private function build_gallery_images( $product ) {
		$images = array();
		$image_ids = $product->get_gallery_image_ids();
		if ( ! is_array( $image_ids ) ) {
			return $images;
		}

		foreach ( array_slice( $image_ids, 0, self::MAX_GALLERY_IMAGES ) as $image_id ) {
			$src = wp_get_attachment_image_url( $image_id, 'full' );
			$src = $this->sanitize_url( $src );
			if ( ! $src ) {
				continue;
			}
			$images[] = array(
				'src' => $src,
				'alt' => $this->sanitize_limited_string( get_post_meta( $image_id, '_wp_attachment_image_alt', true ), self::MAX_STRING_LEN ),
				'name' => $this->sanitize_limited_string( get_the_title( $image_id ), self::MAX_STRING_LEN ),
			);
		}

		return $images;
	}

	private function normalize_string_array( $values, $max_items, $max_len ) {
		$normalized = array();
		$seen = array();
		$list = is_array( $values ) ? $values : array( $values );

		foreach ( $list as $value ) {
			if ( count( $normalized ) >= $max_items ) {
				break;
			}
			$clean = $this->sanitize_limited_string( (string) $value, $max_len );
			if ( ! $clean ) {
				continue;
			}
			$key = function_exists( 'mb_strtolower' ) ? mb_strtolower( $clean, 'UTF-8' ) : strtolower( $clean );
			if ( isset( $seen[ $key ] ) ) {
				continue;
			}
			$seen[ $key ] = true;
			$normalized[] = $clean;
		}

		return $normalized;
	}

	private function sanitize_decimal( $value ) {
		if ( '' === $value || null === $value ) {
			return null;
		}
		$normalized = str_replace( ',', '.', trim( (string) $value ) );
		if ( ! is_numeric( $normalized ) ) {
			return null;
		}
		return (float) $normalized;
	}

	private function sanitize_integer( $value ) {
		if ( '' === $value || null === $value ) {
			return null;
		}
		if ( ! is_numeric( $value ) ) {
			return null;
		}
		return (int) round( (float) $value );
	}

	private function sanitize_limited_string( $value, $max_len = self::MAX_STRING_LEN ) {
		if ( null === $value ) {
			return null;
		}
		$clean = trim( wp_strip_all_tags( (string) $value ) );
		if ( '' === $clean ) {
			return null;
		}
		return function_exists( 'mb_substr' ) ? mb_substr( $clean, 0, $max_len, 'UTF-8' ) : substr( $clean, 0, $max_len );
	}

	private function sanitize_url( $value ) {
		$clean = $this->sanitize_limited_string( $value, 2048 );
		if ( ! $clean ) {
			return null;
		}
		if ( ! wp_http_validate_url( $clean ) ) {
			return null;
		}
		$scheme = wp_parse_url( $clean, PHP_URL_SCHEME );
		if ( ! in_array( strtolower( (string) $scheme ), array( 'http', 'https' ), true ) ) {
			return null;
		}
		return $clean;
	}

	private function set_payload_value( &$payload, $key, $value ) {
		if ( null === $value ) {
			return;
		}
		if ( is_string( $value ) && '' === trim( $value ) ) {
			return;
		}
		if ( is_array( $value ) && empty( $value ) ) {
			return;
		}
		$payload[ $key ] = $value;
	}

	/**
	 * Best-effort mapping of WooCommerce categories to FashionFit categories.
	 *
	 * @param array $categories Array of { name, slug }.
	 * @return string
	 */
	private function map_category( $categories ) {
		foreach ( $categories as $category ) {
			$label = strtolower( $category['slug'] . ' ' . $category['name'] );
			if ( preg_match( '/(t-?shirt|shirt|top|bluz|sweter|sweat|koszul|hoodie)/', $label ) ) {
				return 'tops';
			}
			if ( preg_match( '/(jean|spodnie|pants|trouser|short|skirt|sp\x{00f3}dnic|legging|bottom)/u', $label ) ) {
				return 'bottoms';
			}
			if ( preg_match( '/(dress|sukienk|jumpsuit|kombinezon|one-?piece|romper|overall)/', $label ) ) {
				return 'one-pieces';
			}
			if ( preg_match( '/(jacket|coat|kurtk|p\x{0142}aszcz|outer|blazer|parka)/u', $label ) ) {
				return 'outerwear';
			}
			if ( preg_match( '/(accessor|akcesor|bag|torb|hat|czapk|belt|pasek|scarf|szalik|jewel)/', $label ) ) {
				return 'accessories';
			}
		}
		return 'tops';
	}
}
