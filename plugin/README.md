# FashionFit WooCommerce Plugin

WordPress / WooCommerce plugin (PHP) that installs the FashionFit widget into a
store, exposes settings for the API key, and injects the widget script on
product pages.

Includes server-side purchase tracking: after WooCommerce payment/completion,
the plugin sends `purchase` analytics events (per line item) to FashionFit API.
