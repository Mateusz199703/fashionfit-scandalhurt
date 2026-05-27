<?php
/**
 * WordPress admin: settings page, AJAX actions and product meta box.
 *
 * @package FashionFit
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class FashionFit_Admin {

	const NONCE      = 'fashionfit_admin';
	const CAPABILITY = 'manage_options';

	/** @var FashionFit_Sync */
	private $sync;

	/** @var string */
	private $hook_suffix = '';

	public function __construct( FashionFit_Sync $sync ) {
		$this->sync = $sync;

		add_action( 'admin_menu', array( $this, 'register_menu' ) );
		add_action( 'admin_init', array( $this, 'register_settings' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_assets' ) );
		add_action( 'admin_notices', array( $this, 'maybe_show_wc_notice' ) );

		add_action( 'wp_ajax_fashionfit_connect', array( $this, 'ajax_connect' ) );
		add_action( 'wp_ajax_fashionfit_sync', array( $this, 'ajax_sync' ) );

		add_action( 'add_meta_boxes', array( $this, 'register_meta_box' ) );
		add_action( 'save_post_product', array( $this, 'save_meta_box' ), 10, 1 );

		add_action( 'update_option_' . FashionFit::OPTION, array( $this, 'on_settings_updated' ), 10, 2 );
	}

	/* ---------------------------------------------------------------------
	 * Menu, assets, notices
	 * ------------------------------------------------------------------- */

	public function register_menu() {
		// Always expose a standalone top-level menu for clarity and consistency
		// across different WordPress admin/menu setups.
		$this->hook_suffix = add_menu_page(
			__( 'FashionFit', 'fashionfit' ),
			__( 'FashionFit', 'fashionfit' ),
			self::CAPABILITY,
			'fashionfit',
			array( $this, 'render_settings_page' ),
			'dashicons-format-image',
			58
		);
	}

	public function enqueue_assets( $hook ) {
		if ( $hook !== $this->hook_suffix ) {
			return;
		}

		wp_enqueue_style(
			'fashionfit-admin',
			FASHIONFIT_PLUGIN_URL . 'admin/css/admin.css',
			array(),
			FASHIONFIT_VERSION
		);

		wp_enqueue_style( 'wp-color-picker' );
		wp_enqueue_script( 'wp-color-picker' );
		wp_add_inline_script(
			'wp-color-picker',
			'jQuery(function($){ $(".fashionfit-color").wpColorPicker(); });'
		);
	}

	public function maybe_show_wc_notice() {
		if ( class_exists( 'WooCommerce' ) ) {
			return;
		}
		echo '<div class="notice notice-error"><p>';
		echo esc_html__( 'FashionFit wymaga aktywnego pluginu WooCommerce.', 'fashionfit' );
		echo '</p></div>';
	}

	/* ---------------------------------------------------------------------
	 * Settings API
	 * ------------------------------------------------------------------- */

	public function register_settings() {
		register_setting(
			'fashionfit_settings_group',
			FashionFit::OPTION,
			array( 'sanitize_callback' => array( $this, 'sanitize_settings' ) )
		);
	}

	/**
	 * Sanitise submitted settings, preserving server-managed keys.
	 *
	 * @param array $input Raw submitted values.
	 * @return array
	 */
	public function sanitize_settings( $input ) {
		$current = FashionFit::get_settings();
		$input   = is_array( $input ) ? $input : array();
		$out     = $current; // Preserve shop_id, last_sync_time, synced_count.

		if ( isset( $input['api_url'] ) ) {
			$api_url = esc_url_raw( trim( (string) $input['api_url'] ) );
			if ( $api_url && wp_http_validate_url( $api_url ) ) {
				$out['api_url'] = untrailingslashit( $api_url );
			}
		}

		$out['api_key'] = isset( $input['api_key'] ) ? sanitize_text_field( $input['api_key'] ) : '';

		if ( isset( $input['primary_color'] ) ) {
			$color                = sanitize_hex_color( $input['primary_color'] );
			$out['primary_color'] = $color ? $color : $current['primary_color'];
		}

		if ( isset( $input['button_label'] ) ) {
			$out['button_label'] = sanitize_text_field( $input['button_label'] );
		}

		$positions        = array( 'bottom-right', 'bottom-left' );
		$out['position']  = ( isset( $input['position'] ) && in_array( $input['position'], $positions, true ) )
			? $input['position']
			: 'bottom-right';

		$show_options    = array( 'products', 'cards', 'everywhere' );
		$out['show_on']  = ( isset( $input['show_on'] ) && in_array( $input['show_on'], $show_options, true ) )
			? $input['show_on']
			: 'products';

		$out['auto_sync'] = empty( $input['auto_sync'] ) ? 0 : 1;

		return $out;
	}

	/**
	 * Schedule or clear the daily cron when the auto-sync toggle changes.
	 *
	 * @param array $old Old option value.
	 * @param array $new New option value.
	 */
	public function on_settings_updated( $old, $new ) {
		$enabled   = ! empty( $new['auto_sync'] );
		$scheduled = wp_next_scheduled( FashionFit::CRON_HOOK );

		if ( $enabled && ! $scheduled ) {
			wp_schedule_event( time() + HOUR_IN_SECONDS, 'daily', FashionFit::CRON_HOOK );
		} elseif ( ! $enabled && $scheduled ) {
			wp_unschedule_event( $scheduled, FashionFit::CRON_HOOK );
		}
	}

	public function render_settings_page() {
		if ( ! current_user_can( self::CAPABILITY ) ) {
			return;
		}
		$settings = FashionFit::get_settings();
		$nonce    = wp_create_nonce( self::NONCE );
		require FASHIONFIT_PLUGIN_DIR . 'admin/settings-page.php';
	}

	/* ---------------------------------------------------------------------
	 * AJAX
	 * ------------------------------------------------------------------- */

	public function ajax_connect() {
		check_ajax_referer( self::NONCE, 'nonce' );
		if ( ! current_user_can( self::CAPABILITY ) ) {
			wp_send_json_error( array( 'message' => __( 'Brak uprawnień.', 'fashionfit' ) ), 403 );
		}

		// Persist a freshly entered key before connecting.
		if ( isset( $_POST['api_key'] ) ) {
			FashionFit::update_setting( 'api_key', sanitize_text_field( wp_unslash( $_POST['api_key'] ) ) );
		}
		if ( isset( $_POST['api_url'] ) ) {
			$api_url = esc_url_raw( trim( (string) wp_unslash( $_POST['api_url'] ) ) );
			if ( $api_url && wp_http_validate_url( $api_url ) ) {
				FashionFit::update_setting( 'api_url', untrailingslashit( $api_url ) );
			}
		}

		$result = $this->sync->connect();
		if ( is_wp_error( $result ) ) {
			wp_send_json_error( array( 'message' => $result->get_error_message() ) );
		}

		wp_send_json_success(
			array(
				'shopId'  => isset( $result['shopId'] ) ? $result['shopId'] : '',
				'message' => __( 'Połączono ze sklepem.', 'fashionfit' ),
			)
		);
	}

	public function ajax_sync() {
		check_ajax_referer( self::NONCE, 'nonce' );
		if ( ! current_user_can( self::CAPABILITY ) ) {
			wp_send_json_error( array( 'message' => __( 'Brak uprawnień.', 'fashionfit' ) ), 403 );
		}

		$result = $this->sync->run_full_sync();
		if ( is_wp_error( $result ) ) {
			wp_send_json_error( array( 'message' => $result->get_error_message() ) );
		}

		wp_send_json_success(
			array(
				'synced'    => (int) $result,
				'last_sync' => FashionFit::get_setting( 'last_sync_time', '' ),
				/* translators: %d: number of products */
				'message'   => sprintf( __( 'Zsynchronizowano %d produktów.', 'fashionfit' ), (int) $result ),
			)
		);
	}

	/* ---------------------------------------------------------------------
	 * Product meta box
	 * ------------------------------------------------------------------- */

	public function register_meta_box() {
		add_meta_box(
			'fashionfit_tryon',
			__( 'FashionFit Try-On', 'fashionfit' ),
			array( $this, 'render_meta_box' ),
			'product',
			'side',
			'default'
		);
	}

	public function render_meta_box( $post ) {
		wp_nonce_field( 'fashionfit_meta', 'fashionfit_meta_nonce' );

		$enabled  = get_post_meta( $post->ID, '_fashionfit_enabled', true );
		$enabled  = ( '' === $enabled ) ? 'yes' : $enabled; // Default on.
		$category = get_post_meta( $post->ID, '_fashionfit_category', true );
		$preview  = get_post_meta( $post->ID, '_fashionfit_last_tryon', true );

		$categories = array(
			''            => __( '— Wykryj automatycznie —', 'fashionfit' ),
			'tops'        => __( 'Góra (tops)', 'fashionfit' ),
			'bottoms'     => __( 'Dół (bottoms)', 'fashionfit' ),
			'one-pieces'  => __( 'Jednoczęściowe (one-pieces)', 'fashionfit' ),
			'outerwear'   => __( 'Odzież wierzchnia (outerwear)', 'fashionfit' ),
		);
		?>
		<p>
			<label>
				<input type="checkbox" name="fashionfit_enabled" value="yes" <?php checked( $enabled, 'yes' ); ?> />
				<?php esc_html_e( 'Włącz wirtualną przymierzalnię dla tego produktu', 'fashionfit' ); ?>
			</label>
		</p>
		<p>
			<label for="fashionfit_category"><strong><?php esc_html_e( 'Kategoria ubrania', 'fashionfit' ); ?></strong></label><br />
			<select name="fashionfit_category" id="fashionfit_category" style="width:100%;">
				<?php foreach ( $categories as $value => $label ) : ?>
					<option value="<?php echo esc_attr( $value ); ?>" <?php selected( $category, $value ); ?>>
						<?php echo esc_html( $label ); ?>
					</option>
				<?php endforeach; ?>
			</select>
		</p>
		<p>
			<strong><?php esc_html_e( 'Ostatnia przymiarka', 'fashionfit' ); ?></strong><br />
			<?php if ( $preview ) : ?>
				<img src="<?php echo esc_url( $preview ); ?>" alt="" style="max-width:100%;height:auto;border-radius:6px;" />
			<?php else : ?>
				<span style="color:#888;"><?php esc_html_e( 'Brak danych', 'fashionfit' ); ?></span>
			<?php endif; ?>
		</p>
		<?php
	}

	public function save_meta_box( $post_id ) {
		if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || wp_is_post_revision( $post_id ) ) {
			return;
		}
		if ( ! isset( $_POST['fashionfit_meta_nonce'] )
			|| ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['fashionfit_meta_nonce'] ) ), 'fashionfit_meta' ) ) {
			return;
		}
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		$enabled = isset( $_POST['fashionfit_enabled'] ) ? 'yes' : 'no';
		update_post_meta( $post_id, '_fashionfit_enabled', $enabled );

		$allowed  = array( '', 'tops', 'bottoms', 'one-pieces', 'outerwear' );
		$category = isset( $_POST['fashionfit_category'] ) ? sanitize_text_field( wp_unslash( $_POST['fashionfit_category'] ) ) : '';
		if ( ! in_array( $category, $allowed, true ) ) {
			$category = '';
		}
		update_post_meta( $post_id, '_fashionfit_category', $category );
	}
}
