<?php
/**
 * Core plugin class.
 *
 * @package FashionFit
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class FashionFit {

	const OPTION    = 'fashionfit_settings';
	const CRON_HOOK = 'fashionfit_daily_sync';

	/** @var FashionFit|null */
	private static $instance = null;

	/** @var FashionFit_Admin */
	public $admin;

	/** @var FashionFit_Sync */
	public $sync;

	/** @var FashionFit_Widget */
	public $widget;

	/** @var FashionFit_Events */
	public $events;

	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		load_plugin_textdomain( 'fashionfit', false, dirname( plugin_basename( FASHIONFIT_PLUGIN_FILE ) ) . '/languages' );

		$this->sync   = new FashionFit_Sync();
		$this->widget = new FashionFit_Widget();
		$this->events = new FashionFit_Events();

		if ( is_admin() ) {
			$this->admin = new FashionFit_Admin( $this->sync );
		}

		$this->sync->register_hooks();
		$this->widget->register_hooks();
		$this->events->register_hooks();
	}

	/* ---------------------------------------------------------------------
	 * Settings helpers
	 * ------------------------------------------------------------------- */

	public static function default_settings() {
		return array(
			'api_url'        => defined( 'FASHIONFIT_API_URL' ) ? FASHIONFIT_API_URL : '',
			'api_key'        => '',
			'shop_id'        => '',
			'primary_color'  => '#C4883A',
			'button_label'   => 'Przymierz wirtualnie ✨',
			'position'       => 'bottom-right',
			'show_on'        => 'products',
			'auto_sync'      => 0,
			'last_sync_time' => '',
			'synced_count'   => 0,
		);
	}

	public static function get_settings() {
		$opts = get_option( self::OPTION, array() );
		if ( ! is_array( $opts ) ) {
			$opts = array();
		}
		return array_merge( self::default_settings(), $opts );
	}

	public static function get_setting( $key, $default = null ) {
		$settings = self::get_settings();
		return isset( $settings[ $key ] ) ? $settings[ $key ] : $default;
	}

	public static function update_setting( $key, $value ) {
		$opts = get_option( self::OPTION, array() );
		if ( ! is_array( $opts ) ) {
			$opts = array();
		}
		$opts[ $key ] = $value;
		update_option( self::OPTION, $opts );
	}

	public static function is_connected() {
		$settings = self::get_settings();
		return ! empty( $settings['api_key'] ) && ! empty( $settings['shop_id'] );
	}

	/* ---------------------------------------------------------------------
	 * API client
	 * ------------------------------------------------------------------- */

	/**
	 * Resolve API base URL from saved settings or plugin constant fallback.
	 *
	 * @return string
	 */
	public static function get_api_base_url() {
		$saved = trim( (string) self::get_setting( 'api_url', '' ) );
		if ( '' !== $saved ) {
			$saved = esc_url_raw( $saved );
			if ( $saved && wp_http_validate_url( $saved ) ) {
				return untrailingslashit( $saved );
			}
		}

		$fallback = defined( 'FASHIONFIT_API_URL' ) ? trim( (string) FASHIONFIT_API_URL ) : '';
		if ( '' !== $fallback && wp_http_validate_url( $fallback ) ) {
			return untrailingslashit( $fallback );
		}

		return '';
	}

	/**
	 * Perform an authenticated request against the FashionFit API.
	 *
	 * @param string     $method HTTP method.
	 * @param string     $path   Path beginning with a slash (may include query).
	 * @param array|null $body   Optional JSON body.
	 * @return array|WP_Error Decoded response array, or WP_Error on failure.
	 */
	public static function api_request( $method, $path, $body = null ) {
		$api_key = self::get_setting( 'api_key', '' );
		if ( '' === $api_key ) {
			return new WP_Error( 'fashionfit_no_key', __( 'Brak klucza API.', 'fashionfit' ) );
		}
		$base_url = self::get_api_base_url();
		if ( '' === $base_url ) {
			return new WP_Error( 'fashionfit_no_api_url', __( 'Ustaw poprawny adres API URL w ustawieniach FashionFit.', 'fashionfit' ) );
		}

		$args = array(
			'method'  => $method,
			'timeout' => 20,
			'headers' => array(
				'X-API-Key'    => $api_key,
				'Content-Type' => 'application/json',
				'Accept'       => 'application/json',
			),
		);
		if ( null !== $body ) {
			$args['body'] = wp_json_encode( $body );
		}

		$response = wp_remote_request( $base_url . $path, $args );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$code = (int) wp_remote_retrieve_response_code( $response );
		$data = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( $code < 200 || $code >= 300 ) {
			$message = ( is_array( $data ) && isset( $data['error'] ) )
				? $data['error']
				: sprintf( /* translators: %d: HTTP status code */ __( 'Błąd API (%d).', 'fashionfit' ), $code );
			return new WP_Error( 'fashionfit_api', $message, array( 'status' => $code ) );
		}

		return is_array( $data ) ? $data : array();
	}

	/* ---------------------------------------------------------------------
	 * Activation / deactivation
	 * ------------------------------------------------------------------- */

	public static function activate() {
		if ( false === get_option( self::OPTION ) ) {
			add_option( self::OPTION, self::default_settings() );
		}
	}

	public static function deactivate() {
		$timestamp = wp_next_scheduled( self::CRON_HOOK );
		if ( $timestamp ) {
			wp_unschedule_event( $timestamp, self::CRON_HOOK );
		}
		wp_clear_scheduled_hook( self::CRON_HOOK );
	}
}
