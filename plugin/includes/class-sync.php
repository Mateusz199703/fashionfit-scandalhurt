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

		return array(
			'external_id'       => (string) $product_id,
			'name'              => $product->get_name(),
			'garment_image_url' => $image_url ? $image_url : null,
			'category'          => $category,
			'product_url'       => get_permalink( $product_id ),
			'variants'          => $this->build_variants( $product ),
		);
	}

	private function build_variants( $product ) {
		if ( ! $product->is_type( 'variable' ) ) {
			return null;
		}
		$variants = array();
		foreach ( $product->get_variation_attributes() as $name => $options ) {
			$variants[ sanitize_title( $name ) ] = array_values( $options );
		}
		return ! empty( $variants ) ? $variants : null;
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
