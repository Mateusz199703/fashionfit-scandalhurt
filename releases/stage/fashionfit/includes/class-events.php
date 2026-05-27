<?php
/**
 * WooCommerce order events -> FashionFit analytics events.
 *
 * @package FashionFit
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class FashionFit_Events {

	const ORDER_META_SENT = '_fashionfit_purchase_events_sent';

	public function register_hooks() {
		add_action( 'woocommerce_payment_complete', array( $this, 'on_order_paid' ), 10, 1 );
		add_action( 'woocommerce_order_status_completed', array( $this, 'on_order_paid' ), 10, 1 );
	}

	/**
	 * Send purchase events (once) when an order is paid/completed.
	 *
	 * @param int $order_id WooCommerce order ID.
	 * @return void
	 */
	public function on_order_paid( $order_id ) {
		if ( ! FashionFit::is_connected() || ! function_exists( 'wc_get_order' ) ) {
			return;
		}

		$order_id = (int) $order_id;
		if ( $order_id <= 0 ) {
			return;
		}

		$already_sent = get_post_meta( $order_id, self::ORDER_META_SENT, true );
		if ( ! empty( $already_sent ) ) {
			return;
		}

		$order = wc_get_order( $order_id );
		if ( ! $order ) {
			return;
		}

		$shop_id = FashionFit::get_setting( 'shop_id', '' );
		if ( '' === $shop_id ) {
			return;
		}

		$product_map = $this->get_remote_product_map( $shop_id );
		if ( is_wp_error( $product_map ) ) {
			return;
		}

		$order_total   = (float) $order->get_total();
		$order_status  = (string) $order->get_status();
		$currency      = (string) $order->get_currency();
		$customer_id   = (int) $order->get_customer_id();
		$customer_mail = (string) $order->get_billing_email();
		$sent_any      = false;

		foreach ( $order->get_items( 'line_item' ) as $item ) {
			if ( ! $item instanceof WC_Order_Item_Product ) {
				continue;
			}

			$wc_product_id     = (string) $item->get_product_id();
			$remote_product_id = isset( $product_map[ $wc_product_id ] ) ? $product_map[ $wc_product_id ] : null;
			$line_total        = (float) $item->get_total();
			$quantity          = (int) $item->get_quantity();

			$payload = array(
				'shopId'    => $shop_id,
				'eventType' => 'purchase',
				'productId' => $remote_product_id,
				'metadata'  => array(
					'order_id'       => $order_id,
					'order_status'   => $order_status,
					'order_total'    => $order_total,
					'currency'       => $currency,
					'line_total'     => $line_total,
					'quantity'       => $quantity,
					'wc_product_id'  => $wc_product_id,
					'customer_id'    => $customer_id > 0 ? $customer_id : null,
					'customer_email' => '' !== $customer_mail ? $customer_mail : null,
				),
			);

			$result = FashionFit::api_request( 'POST', '/api/widget/events', $payload );
			if ( is_wp_error( $result ) ) {
				continue;
			}
			$sent_any = true;
		}

		// Prevent duplicate sends from multiple Woo hooks.
		if ( $sent_any ) {
			update_post_meta( $order_id, self::ORDER_META_SENT, current_time( 'mysql' ) );
		}
	}

	/**
	 * Build Woo product_id -> FashionFit product uuid map.
	 *
	 * @param string $shop_id FashionFit shop id.
	 * @return array|WP_Error
	 */
	private function get_remote_product_map( $shop_id ) {
		$result = FashionFit::api_request( 'GET', '/api/widget/products/' . rawurlencode( $shop_id ) );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$products = isset( $result['products'] ) && is_array( $result['products'] ) ? $result['products'] : array();
		$map      = array();

		foreach ( $products as $product ) {
			if ( empty( $product['external_id'] ) || empty( $product['id'] ) ) {
				continue;
			}
			$map[ (string) $product['external_id'] ] = (string) $product['id'];
		}

		return $map;
	}
}

