<?php
/**
 * Front-end widget injection and shortcode.
 *
 * @package FashionFit
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class FashionFit_Widget {

	public function register_hooks() {
		add_action( 'wp_footer', array( $this, 'inject_widget' ) );
		add_shortcode( 'fashionfit_button', array( $this, 'render_shortcode' ) );
	}

	/**
	 * Inject the FashionFit config + loader script into the footer.
	 */
	public function inject_widget() {
		if ( ! FashionFit::is_connected() || ! $this->should_display() ) {
			return;
		}

		$settings = FashionFit::get_settings();
		$api_url  = FashionFit::get_api_base_url();
		$widget_src = $api_url ? untrailingslashit( $api_url ) . '/widget.js' : FASHIONFIT_WIDGET_URL;
		$config   = array(
			'apiKey'       => $settings['api_key'],
			'shopId'       => $settings['shop_id'],
			'apiUrl'       => $api_url,
			'primaryColor' => $settings['primary_color'],
			'buttonLabel'  => $settings['button_label'],
			'position'     => $settings['position'],
		);

		echo "\n<!-- FashionFit Virtual Try-On -->\n";
		echo '<script>window.FashionFitConfig = ' . wp_json_encode( $config ) . ';</script>' . "\n";
		echo '<script async src="' . esc_url( $widget_src ) . '"></script>' . "\n";
	}

	/**
	 * Decide whether the widget should load on the current view.
	 *
	 * @return bool
	 */
	private function should_display() {
		$show_on = FashionFit::get_setting( 'show_on', 'products' );

		if ( 'everywhere' === $show_on ) {
			return true;
		}

		// WooCommerce conditional tags may be unavailable on some views.
		$is_product = function_exists( 'is_product' ) && is_product();

		if ( 'products' === $show_on ) {
			return $is_product;
		}

		if ( 'cards' === $show_on ) {
			$is_archive = ( function_exists( 'is_shop' ) && is_shop() )
				|| ( function_exists( 'is_product_category' ) && is_product_category() )
				|| ( function_exists( 'is_product_tag' ) && is_product_tag() );
			return $is_product || $is_archive;
		}

		return false;
	}

	/**
	 * Shortcode: [fashionfit_button product_id="123"].
	 *
	 * @param array $atts Shortcode attributes.
	 * @return string
	 */
	public function render_shortcode( $atts ) {
		$atts = shortcode_atts(
			array(
				'product_id' => '',
				'label'      => FashionFit::get_setting( 'button_label', 'Przymierz wirtualnie ✨' ),
			),
			$atts,
			'fashionfit_button'
		);

		$product_id = absint( $atts['product_id'] );
		if ( ! $product_id || ! FashionFit::is_connected() ) {
			return '';
		}

		$url = get_permalink( $product_id );
		if ( ! $url ) {
			return '';
		}

		return sprintf(
			'<a class="fashionfit-shortcode-btn" href="%1$s" data-product-id="%2$d" style="--ff-primary:%3$s">%4$s</a>',
			esc_url( $url ),
			$product_id,
			esc_attr( FashionFit::get_setting( 'primary_color', '#C4883A' ) ),
			esc_html( $atts['label'] )
		);
	}
}
