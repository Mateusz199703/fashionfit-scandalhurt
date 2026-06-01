<?php
/**
 * Plugin Name: FashionFit — Virtual Try-On
 * Plugin URI: https://fashionfit.app
 * Description: Wirtualna przymierzalnia dla Twojego sklepu WooCommerce
 * Version: 1.2.0
 * Author: FashionFit
 * Text Domain: fashionfit
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * WC requires at least: 6.0
 *
 * @package FashionFit
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'FASHIONFIT_VERSION', '1.2.0' );
define( 'FASHIONFIT_PLUGIN_FILE', __FILE__ );
define( 'FASHIONFIT_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'FASHIONFIT_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

// Backend API base. Override via wp-config.php for self-hosted/staging setups.
if ( ! defined( 'FASHIONFIT_API_URL' ) ) {
	define( 'FASHIONFIT_API_URL', 'https://api.fashionfit.app' );
}

// CDN location of the embeddable widget bundle.
if ( ! defined( 'FASHIONFIT_WIDGET_URL' ) ) {
	define( 'FASHIONFIT_WIDGET_URL', 'https://cdn.fashionfit.app/widget.js' );
}

require_once FASHIONFIT_PLUGIN_DIR . 'includes/class-fashionfit.php';
require_once FASHIONFIT_PLUGIN_DIR . 'includes/class-sync.php';
require_once FASHIONFIT_PLUGIN_DIR . 'includes/class-widget.php';
require_once FASHIONFIT_PLUGIN_DIR . 'includes/class-events.php';
require_once FASHIONFIT_PLUGIN_DIR . 'includes/class-admin.php';

register_activation_hook( __FILE__, array( 'FashionFit', 'activate' ) );
register_deactivation_hook( __FILE__, array( 'FashionFit', 'deactivate' ) );

add_action( 'plugins_loaded', array( 'FashionFit', 'instance' ) );
