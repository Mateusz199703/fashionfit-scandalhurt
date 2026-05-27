=== FashionFit — Virtual Try-On ===
Contributors: fashionfit
Tags: woocommerce, virtual try-on, ar, fashion, fitting room
Requires at least: 5.8
Tested up to: 6.5
Requires PHP: 7.4
WC requires at least: 6.0
Stable tag: 1.0.4
License: Proprietary

Wirtualna przymierzalnia dla Twojego sklepu WooCommerce.

== Description ==

FashionFit dodaje do Twojego sklepu WooCommerce wirtualną przymierzalnię opartą
o AI. Klienci mogą zobaczyć, jak wybrane ubranie wygląda na ich zdjęciu (Photo
AI) lub na żywo przez kamerę (Live AR), zanim dokonają zakupu.

Główne funkcje:

* Pływający przycisk "Przymierz wirtualnie" na stronach produktów.
* Tryb Photo AI oraz Live AR (MediaPipe).
* Automatyczna i ręczna synchronizacja produktów z FashionFit API.
* Synchronizacja co 24h przez WP Cron.
* Konfigurowalny wygląd: kolor, tekst przycisku, pozycja, miejsce wyświetlania.
* Shortcode `[fashionfit_button product_id="123"]`.
* Meta box na stronie produktu: włącz/wyłącz przymierzalnię i wybierz kategorię.

== Installation ==

1. Wgraj katalog `fashionfit` do `/wp-content/plugins/`.
2. Aktywuj wtyczkę w menu „Wtyczki" w WordPress.
3. Przejdź do WooCommerce → FashionFit.
4. Wklej swój API Key i kliknij „Połącz ze sklepem".
5. Dostosuj wygląd widgetu i wykonaj pierwszą synchronizację produktów.

Wymaga aktywnego pluginu WooCommerce (6.0+).

== Frequently Asked Questions ==

= Gdzie znajdę API Key? =
W panelu klienta FashionFit (https://fashionfit.app), w sekcji ustawień konta.

= Czy zdjęcia klientów są przechowywane? =
Zdjęcia używane do przymiarki nie są trwale przechowywane.

= Jak zmienić adres API (np. środowisko testowe)? =
W ustawieniach wtyczki (menu FashionFit) wpisz adres w polu `API URL`.
Alternatywnie możesz zdefiniować stałą `FASHIONFIT_API_URL` w pliku `wp-config.php`.

== Changelog ==

= 1.0.4 =
* Dodano pole `API URL` w panelu wtyczki (bez edycji `wp-config.php`).
* Wtyczka używa teraz ustawionego `API URL` do wszystkich połączeń.
* Walidacja adresu API oraz czytelniejszy błąd przy braku poprawnego URL.

= 1.0.3 =
* Dodano osobne menu główne "FashionFit" w panelu WordPress, aby ustawienia były zawsze widoczne po instalacji wtyczki.


= 1.0.2 =
* Poprawiono widoczność panelu ustawień: jeśli menu WooCommerce nie jest dostępne, panel FashionFit pojawia się w Ustawieniach WordPress.


= 1.0.1 =
* Dodano automatyczne wysyłanie eventów `purchase` po opłaceniu/zakończeniu
  zamówienia WooCommerce (analityka zakupów po przymiarce).
* Zabezpieczenie przed duplikacją eventów dla tego samego zamówienia.

= 1.0.0 =
* Pierwsze wydanie: panel ustawień, synchronizacja produktów, auto-inject
  widgetu, shortcode oraz meta box produktu.
