<?php
/**
 * Settings page template.
 *
 * Expects $settings (array) and $nonce (string) from FashionFit_Admin.
 *
 * @package FashionFit
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<div class="wrap fashionfit-settings">
	<h1><?php esc_html_e( 'FashionFit — Wirtualna przymierzalnia', 'fashionfit' ); ?></h1>

	<form method="post" action="options.php">
		<?php settings_fields( 'fashionfit_settings_group' ); ?>

		<div class="fashionfit-card">
			<h2><?php esc_html_e( 'Połączenie', 'fashionfit' ); ?></h2>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row">
						<label for="fashionfit_api_url"><?php esc_html_e( 'API URL', 'fashionfit' ); ?></label>
					</th>
					<td>
						<input type="url" id="fashionfit_api_url" name="<?php echo esc_attr( FashionFit::OPTION ); ?>[api_url]"
							class="regular-text"
							value="<?php echo esc_attr( $settings['api_url'] ); ?>" />
						<p class="description"><?php esc_html_e( 'Adres backendu FashionFit, np. https://api.twojadomena.pl', 'fashionfit' ); ?></p>
					</td>
				</tr>
				<tr>
					<th scope="row">
						<label for="fashionfit_api_key"><?php esc_html_e( 'API Key', 'fashionfit' ); ?> <span class="fashionfit-req">*</span></label>
					</th>
					<td>
						<input type="text" id="fashionfit_api_key" name="<?php echo esc_attr( FashionFit::OPTION ); ?>[api_key]"
							class="regular-text" required
							value="<?php echo esc_attr( $settings['api_key'] ); ?>" />
						<p class="description"><?php esc_html_e( 'Klucz API z panelu FashionFit.', 'fashionfit' ); ?></p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="fashionfit_shop_id"><?php esc_html_e( 'Shop ID', 'fashionfit' ); ?></label></th>
					<td>
						<input type="text" id="fashionfit_shop_id" class="regular-text" readonly
							value="<?php echo esc_attr( $settings['shop_id'] ); ?>" />
						<input type="hidden" id="fashionfit_shop_id_hidden"
							name="<?php echo esc_attr( FashionFit::OPTION ); ?>[shop_id]"
							value="<?php echo esc_attr( $settings['shop_id'] ); ?>" />
						<button type="button" class="button button-secondary" id="fashionfit-connect"
							data-nonce="<?php echo esc_attr( $nonce ); ?>">
							<?php esc_html_e( 'Połącz ze sklepem', 'fashionfit' ); ?>
						</button>
						<span class="fashionfit-status" id="fashionfit-connect-status"></span>
					</td>
				</tr>
			</table>
		</div>

		<div class="fashionfit-card">
			<h2><?php esc_html_e( 'Wygląd widgetu', 'fashionfit' ); ?></h2>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="fashionfit_primary_color"><?php esc_html_e( 'Kolor główny', 'fashionfit' ); ?></label></th>
					<td>
						<input type="text" id="fashionfit_primary_color" class="fashionfit-color"
							name="<?php echo esc_attr( FashionFit::OPTION ); ?>[primary_color]"
							value="<?php echo esc_attr( $settings['primary_color'] ); ?>" />
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="fashionfit_button_label"><?php esc_html_e( 'Tekst przycisku', 'fashionfit' ); ?></label></th>
					<td>
						<input type="text" id="fashionfit_button_label" class="regular-text"
							name="<?php echo esc_attr( FashionFit::OPTION ); ?>[button_label]"
							value="<?php echo esc_attr( $settings['button_label'] ); ?>" />
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="fashionfit_position"><?php esc_html_e( 'Pozycja', 'fashionfit' ); ?></label></th>
					<td>
						<select name="<?php echo esc_attr( FashionFit::OPTION ); ?>[position]" id="fashionfit_position">
							<option value="bottom-right" <?php selected( $settings['position'], 'bottom-right' ); ?>>
								<?php esc_html_e( 'Prawy dół', 'fashionfit' ); ?>
							</option>
							<option value="bottom-left" <?php selected( $settings['position'], 'bottom-left' ); ?>>
								<?php esc_html_e( 'Lewy dół', 'fashionfit' ); ?>
							</option>
						</select>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="fashionfit_tryon_provider"><?php esc_html_e( 'Silnik AI try-on', 'fashionfit' ); ?></label></th>
					<td>
						<select name="<?php echo esc_attr( FashionFit::OPTION ); ?>[tryon_provider]" id="fashionfit_tryon_provider">
							<option value="auto" <?php selected( $settings['tryon_provider'], 'auto' ); ?>>
								<?php esc_html_e( 'Auto (najlepszy dostępny)', 'fashionfit' ); ?>
							</option>
							<option value="google_vto" <?php selected( $settings['tryon_provider'], 'google_vto' ); ?>>
								<?php esc_html_e( 'Google VTO', 'fashionfit' ); ?>
							</option>
							<option value="fashn" <?php selected( $settings['tryon_provider'], 'fashn' ); ?>>
								<?php esc_html_e( 'FASHN.ai', 'fashionfit' ); ?>
							</option>
							<option value="mock" <?php selected( $settings['tryon_provider'], 'mock' ); ?>>
								<?php esc_html_e( 'Mock (test UI)', 'fashionfit' ); ?>
							</option>
						</select>
						<p class="description"><?php esc_html_e( 'Wybierz provider przymiarek dla tego sklepu. Polecane na teraz: Google VTO.', 'fashionfit' ); ?></p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="fashionfit_show_on"><?php esc_html_e( 'Pokaż na', 'fashionfit' ); ?></label></th>
					<td>
						<select name="<?php echo esc_attr( FashionFit::OPTION ); ?>[show_on]" id="fashionfit_show_on">
							<option value="products" <?php selected( $settings['show_on'], 'products' ); ?>>
								<?php esc_html_e( 'Stronach produktów', 'fashionfit' ); ?>
							</option>
							<option value="cards" <?php selected( $settings['show_on'], 'cards' ); ?>>
								<?php esc_html_e( 'Kartach produktów (listy + produkty)', 'fashionfit' ); ?>
							</option>
							<option value="everywhere" <?php selected( $settings['show_on'], 'everywhere' ); ?>>
								<?php esc_html_e( 'Wszędzie', 'fashionfit' ); ?>
							</option>
						</select>
					</td>
				</tr>
			</table>
		</div>

		<div class="fashionfit-card">
			<h2><?php esc_html_e( 'Synchronizacja produktów', 'fashionfit' ); ?></h2>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><?php esc_html_e( 'Ostatnia synchronizacja', 'fashionfit' ); ?></th>
					<td>
						<span id="fashionfit-last-sync">
							<?php echo $settings['last_sync_time'] ? esc_html( $settings['last_sync_time'] ) : esc_html__( 'Nigdy', 'fashionfit' ); ?>
						</span>
						<input type="hidden" id="fashionfit_last_sync_hidden"
							name="<?php echo esc_attr( FashionFit::OPTION ); ?>[last_sync_time]"
							value="<?php echo esc_attr( (string) $settings['last_sync_time'] ); ?>" />
					</td>
				</tr>
				<tr>
					<th scope="row"><?php esc_html_e( 'Zsynchronizowane produkty', 'fashionfit' ); ?></th>
					<td>
						<span id="fashionfit-synced-count"><?php echo esc_html( (string) $settings['synced_count'] ); ?></span>
						<input type="hidden" id="fashionfit_synced_count_hidden"
							name="<?php echo esc_attr( FashionFit::OPTION ); ?>[synced_count]"
							value="<?php echo esc_attr( (string) $settings['synced_count'] ); ?>" />
					</td>
				</tr>
				<tr>
					<th scope="row"><?php esc_html_e( 'Synchronizuj', 'fashionfit' ); ?></th>
					<td>
						<button type="button" class="button button-secondary" id="fashionfit-sync"
							data-nonce="<?php echo esc_attr( $nonce ); ?>">
							<?php esc_html_e( 'Synchronizuj teraz', 'fashionfit' ); ?>
						</button>
						<span class="fashionfit-status" id="fashionfit-sync-status"></span>
					</td>
				</tr>
				<tr>
					<th scope="row"><?php esc_html_e( 'Automatyczna synchronizacja', 'fashionfit' ); ?></th>
					<td>
						<label>
							<input type="checkbox" name="<?php echo esc_attr( FashionFit::OPTION ); ?>[auto_sync]" value="1"
								<?php checked( ! empty( $settings['auto_sync'] ) ); ?> />
							<?php esc_html_e( 'Synchronizuj automatycznie co 24h (WP Cron)', 'fashionfit' ); ?>
						</label>
					</td>
				</tr>
			</table>
		</div>

		<?php submit_button( __( 'Zapisz ustawienia', 'fashionfit' ) ); ?>
	</form>
</div>

<script>
( function () {
	var ajaxUrl = '<?php echo esc_js( admin_url( 'admin-ajax.php' ) ); ?>';

	function post( action, nonce, extra ) {
		var body = new URLSearchParams();
		body.append( 'action', action );
		body.append( 'nonce', nonce );
		if ( extra ) {
			Object.keys( extra ).forEach( function ( k ) { body.append( k, extra[ k ] ); } );
		}
		return fetch( ajaxUrl, {
			method: 'POST',
			credentials: 'same-origin',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: body.toString()
		} ).then( function ( r ) { return r.json(); } );
	}

	var connectBtn = document.getElementById( 'fashionfit-connect' );
	if ( connectBtn ) {
		connectBtn.addEventListener( 'click', function () {
			var status = document.getElementById( 'fashionfit-connect-status' );
			var apiKey = document.getElementById( 'fashionfit_api_key' ).value;
			var apiUrl = document.getElementById( 'fashionfit_api_url' ).value;
			status.textContent = '<?php echo esc_js( __( 'Łączenie...', 'fashionfit' ) ); ?>';
			connectBtn.disabled = true;
			post( 'fashionfit_connect', connectBtn.dataset.nonce, { api_key: apiKey, api_url: apiUrl } ).then( function ( res ) {
				connectBtn.disabled = false;
				if ( res && res.success ) {
					document.getElementById( 'fashionfit_shop_id' ).value = res.data.shopId || '';
					document.getElementById( 'fashionfit_shop_id_hidden' ).value = res.data.shopId || '';
					status.textContent = res.data.message;
					status.className = 'fashionfit-status fashionfit-ok';
				} else {
					status.textContent = ( res && res.data && res.data.message ) ? res.data.message : 'Error';
					status.className = 'fashionfit-status fashionfit-err';
				}
			} ).catch( function () {
				connectBtn.disabled = false;
				status.textContent = 'Error';
				status.className = 'fashionfit-status fashionfit-err';
			} );
		} );
	}

	var syncBtn = document.getElementById( 'fashionfit-sync' );
	if ( syncBtn ) {
		syncBtn.addEventListener( 'click', function () {
			var status = document.getElementById( 'fashionfit-sync-status' );
			status.textContent = '<?php echo esc_js( __( 'Synchronizacja...', 'fashionfit' ) ); ?>';
			syncBtn.disabled = true;
			post( 'fashionfit_sync', syncBtn.dataset.nonce ).then( function ( res ) {
				syncBtn.disabled = false;
				if ( res && res.success ) {
					status.textContent = res.data.message;
					status.className = 'fashionfit-status fashionfit-ok';
					document.getElementById( 'fashionfit-synced-count' ).textContent = res.data.synced;
					document.getElementById( 'fashionfit_synced_count_hidden' ).value = String( res.data.synced || 0 );
					if ( res.data.last_sync ) {
						document.getElementById( 'fashionfit-last-sync' ).textContent = res.data.last_sync;
						document.getElementById( 'fashionfit_last_sync_hidden' ).value = res.data.last_sync;
					}
				} else {
					status.textContent = ( res && res.data && res.data.message ) ? res.data.message : 'Error';
					status.className = 'fashionfit-status fashionfit-err';
				}
			} ).catch( function () {
				syncBtn.disabled = false;
				status.textContent = 'Error';
				status.className = 'fashionfit-status fashionfit-err';
			} );
		} );
	}
} )();
</script>
