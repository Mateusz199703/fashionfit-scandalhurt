# FashionFit AI — Specyfikacja wizualna (element po elemencie)

> Wersja: czerwiec 2026 · Adresat: designer, frontend, design reviewer
> Dokument towarzyszący: `fashionfit_build_playbook.md` (co budujemy) + `fashionfit_app.html` (żywy mockup).
> Tu opisujemy **JAK każdy element wygląda, jak się zachowuje i dlaczego tak** — prozą, mierzalnie.

---

## Jak czytać ten dokument

Każdy element opisany jest w schemacie:

- **Co to** — nazwa komponentu.
- **Wymiary / pozycja** — konkretne wartości px / tokeny.
- **Wygląd** — kolory, tło, obramowanie, cień, typografia.
- **Stany** — default / hover / active / focus / loading / error.
- **Ruch** — animacje, timing, easing.
- **Rola** — po co to istnieje (UX).
- **Dlaczego tak** — uzasadnienie decyzji.

Wszystkie kolory i miary odwołują się do tokenów z `tokens.json`. Literały hex pojawiają się tu **tylko dla czytelności** — w kodzie zawsze token.

### Tokeny referencyjne (skrót)

```
--accent      #7B61FF   (fiolet — bohater marki)
--accent2     #4F46E5   (głębszy fiolet — drugi koniec gradientu)
--violet      #8B5CFF   (środek gradientu)
--orange      #FFB15C   (ciepły akcent — „human touch")
--green       #3ECF8E   (sukces, live, dopasowanie)
--rose        #FB7185   (zwroty, ostrzeżenie)
Brand gradient: linear-gradient(120deg, --accent, --accent2)
--ease        cubic-bezier(.16,1,.3,1)   (główny easing — „miękkie lądowanie")
Radiusy:  xs 7 · sm 10 · md 14 · lg 18 · xl 22 · 2xl 28 · pill 100
Glow:     0 30px 80px -40px rgba(123,97,255,.45)
```

### Reguła nadrzędna kolorystyki

Na każdym ekranie **fiolet to jedyny „bohater"**. Pomarańcz pojawia się **wyłącznie** jako sygnał ciepła/człowieka (badge dopasowania, awatar AI, akcent w gradiencie). Zieleń = wyłącznie pozytywny wynik (konwersja, live, pewność). Róż = wyłącznie zwroty/alert. Ten podział jest stały na wszystkich powierzchniach — buduje **pamięć kolorystyczną marki**.

---

# CZĘŚĆ A — APP BAR (wspólny pasek górny)

Pasek obecny nad każdą powierzchnią w Studio (Pulpit / Czat / Przymierzalnia / System).

### A.1 Kontener paska

- **Wymiary:** wysokość 63 px, szerokość 100%, `position: sticky; top: 0`, z-index 50.
- **Wygląd:** tło `--glass` (półprzezroczyste `rgba(20,20,28,.6)`) + `backdrop-filter: blur(20px)`. Dolna krawędź: 1 px `--border`. Padding 12 px góra/dół, 22 px boki.
- **Rola:** stała kotwica nawigacyjna + przełącznik powierzchni.
- **Dlaczego tak:** szkło z rozmyciem daje wrażenie „warstwy nad treścią", a nie ciężkiego nagłówka — treść prześwituje, pasek nie kradnie uwagi.

### A.2 Logo / brand (lewa strona)

- **Układ:** AI Core (28×28 px) + tekst „FashionFit" (Space Grotesk 600, 17 px) + „AI" w kolorze `--accent` + mała etykieta „STUDIO" (10 px, letter-spacing 0.22em, UPPERCASE, kolor `--text-faint`).
- **AI Core:** kula z gradientem radialnym (niebieski → fiolet → pomarańcz), wewnątrz biała „ramka celownika" (4 narożniki). Kula **obraca się** 360° w 24 s (`spin`), ramka **pulsuje skalą** 1→1.05 w 5 s (`scan`).
- **Rola:** tożsamość + „żywy" znak, że to produkt AI.
- **Dlaczego tak:** obracająca się kula z celownikiem to wizualny skrót „AI patrzy / analizuje". Ten sam znak wraca jako awatar Lume — spójność marki na każdej powierzchni.

### A.3 Przełącznik zakładek (środek)

- **Kontener:** pill (radius 100), tło `--surface`, border 1 px `--border`, padding 4 px. Wyśrodkowany (`margin: 0 auto`).
- **Pojedyncza zakładka:** Inter 500, 13.5 px, padding 9×18 px, radius 100.
  - **Default:** kolor `--text-dim`, tło przezroczyste.
  - **Hover:** kolor `--text`.
  - **Aktywna:** tło Brand gradient, tekst biały, cień `0 6px 20px -8px glow`.
- **Ruch:** zmiana stanu w 350 ms `--ease`.
- **Rola:** szybka zmiana kontekstu (Pulpit / Czat / Przymierzalnia / System).
- **Dlaczego tak:** segmented-pill (zamiast tabów z podkreśleniem) czyta się jak „przełącznik trybu" — sugeruje, że to różne *tryby tego samego produktu*, nie osobne strony.

### A.4 Przełącznik motywu (prawa)

- **Wymiary:** koło 38 px, border 1 px `--border-strong`, tło `--surface`.
- **Ikona:** księżyc (tryb dark) lub słońce (tryb light), stroke 2, 17 px.
- **Hover:** border i ikona zmieniają się na `--accent`.
- **Rola:** dostosowanie do preferencji / pory dnia operatora.
- **Dlaczego tak:** okrągły, dyskretny — narzędziowy element, nie ozdoba.

---

# CZĘŚĆ B — DASHBOARD (Pulpit operatora)

> **Charakter:** spokojny, czytelny, niska ilość ruchu. Operator patrzy na to 8h dziennie — priorytetem jest **czytelność danych i brak zmęczenia oka**, nie efekt „wow".

Layout: dwukolumnowy — sidebar 236 px (stały) + główna treść (elastyczna).

## B.1 Sidebar (lewa kolumna)

### B.1.1 Kontener

- **Wymiary:** 236 px szerokości, `position: sticky`, wysokość pełnego ekranu minus pasek (calc(100vh − 63px)). Prawa krawędź 1 px `--border`. Tło `--panel` (pełne, nie szkło). Padding 20×14 px.
- **Rola:** stała nawigacja + tożsamość sklepu + status planu.
- **Dlaczego tak:** pełne (nieprzezroczyste) tło sidebara oddziela strefę nawigacji od strefy danych — operator wie, „gdzie klika, a gdzie czyta".

### B.1.2 Store switcher (góra sidebara)

- **Układ:** kafelek z borderem 1 px `--border`, radius 13, tło `--surface`, padding 11×12. W środku: kwadratowy awatar 34 px (radius 9) z gradientem fiolet→pomarańcz i inicjałami sklepu (Space Grotesk 700, biały) + nazwa (Space Grotesk, 13.5 px) + domena (11 px, `--text-faint`) + chevron w dół po prawej.
- **Hover:** border → `--border-strong`.
- **Rola:** przełączanie między sklepami (multi-store) + potwierdzenie „jesteś w Atelier Nord".
- **Dlaczego tak:** awatar z inicjałami daje natychmiastową identyfikację sklepu kolorem — operator obsługujący kilka sklepów rozpoznaje je „na rzut oka", zanim przeczyta nazwę.

### B.1.3 Pozycje nawigacji

- **Pojedyncza pozycja:** padding 10×12, radius 11, ikona 18 px (stroke 1.8, `currentColor`) + etykieta (13.5 px, 500).
  - **Default:** kolor `--text-dim`.
  - **Hover:** tło `--surface`, kolor `--text`.
  - **Aktywna:** tło `--surface-2`, kolor `--text`, oraz **pionowy pasek 3 px** przy lewej krawędzi w kolorze `--accent` z poświatą glow.
- **Badge przy pozycji:** np. „128" przy „Rozmowy AI" — pill, tło `--accent`, tekst biały, 10 px 700. Wariant „soft" (np. liczba produktów) — tło `--surface-2`, tekst przygaszony.
- **Grupy:** nagłówek grupy „WZROST" — 10 px, letter-spacing 0.16em, UPPERCASE, `--text-faint`.
- **Rola:** nawigacja + sygnalizacja „gdzie dzieje się coś nowego" (badge).
- **Dlaczego tak:** akcentowy pasek zamiast pełnego podświetlenia tła — subtelniejszy, nie „krzyczy", a wyraźnie wskazuje aktywną sekcję. Badge z liczbą rozmów ciągnie operatora tam, gdzie jest ruch.

### B.1.4 Box planu (dół sidebara)

- **Pozycja:** `margin-top: auto` (przyklejony do dołu). Border 1 px `--border`, radius 14, tło gradient `--surface-2 → transparent`, padding 14.
- **Treść:** „Plan Growth" (Space Grotesk 13 px) + „342 / 500 rozmów" (11.5 px `--text-faint`) + przycisk „Zwiększ limit →" (pełna szerokość, gradient brand, biały, radius 9).
- **Rola:** świadomość zużycia limitu + ścieżka upsell.
- **Dlaczego tak:** licznik zużycia w stałym, widocznym miejscu tworzy delikatną presję „kończy mi się limit" → naturalny upgrade, bez nachalnego pop-upu.

## B.2 Główna treść (prawa kolumna)

Padding 26×30 px.

### B.2.1 Page header

- **Układ:** tytuł „Pulpit" (Space Grotesk, 26 px) + podtytuł (13 px `--text-faint`: data + „ostatnia synchronizacja 4 min temu"). Po prawej (`margin-left: auto`): pole wyszukiwania + segmented range (7/30/90 dni) + dzwonek powiadomień.
- **Segmented range:** kontener `--surface`, border `--border`, radius 10, padding 3. Aktywny segment: tło `--panel-2`, lekki cień; nieaktywne: `--text-dim`.
- **Rola:** kontekst czasowy danych + szybkie filtrowanie zakresu.
- **Dlaczego tak:** „ostatnia synchronizacja 4 min temu" buduje zaufanie do świeżości danych — operator wie, że patrzy na aktualny obraz, nie cache sprzed tygodnia.

### B.2.2 Rząd KPI (4 karty)

- **Grid:** 4 równe kolumny, gap 16 px.
- **Pojedyncza karta KPI:** padding 20, border 1 px `--border`, radius 16, tło `--panel`, `overflow: hidden`.
  - **Nagłówek:** mała ikona (26 px kwadrat, radius 8, tło `--surface-2`, ikona 14 px `--accent`) + etykieta (12.5 px `--text-dim`).
  - **Wartość:** Space Grotesk 700, 30 px (np. „5,9%", „487 zł", „96%").
  - **Delta:** 12 px 700, ze strzałką ▲/▼. Kolor `--green` dla pozytywnych (także „−28% zwrotów" jest zielone, bo to *dobra* zmiana!).
  - **Sparkline:** mała krzywa 74×34 px w prawym dolnym rogu, kolor `--green` lub `--accent`, stroke 2, zaokrąglone końce.
  - **Hover:** `translateY(-2px)`, border → `--border-strong`.
- **Cztery metryki:** Konwersja (+34%), Zwroty (−28%), Śr. wartość koszyka (+41%), Trafność rozmiaru (96%).
- **Rola:** w 5 sekund pokazać, że produkt działa.
- **Dlaczego tak:** **liczba + kierunek + mikro-wykres = pełne zrozumienie bez czytania**. Kluczowa decyzja: spadek zwrotów jest **zielony, nie czerwony** — kolor koduje *czy to dobre dla biznesu*, nie *czy liczba rośnie*. To eliminuje sekundę „czy −28% to dobrze?".

### B.2.3 Wykres dual-line „Konwersja vs zwroty"

- **Kontener:** karta (border, radius 18, tło `--panel`, padding 22), szerokość ~1.55 części grida (większa niż donut obok).
- **Nagłówek karty:** tytuł (16 px) + legenda po prawej (kwadracik 9 px `--accent` „Konwersja", kwadracik `--rose` „Zwroty").
- **Obszar wykresu (SVG 560×220):**
  - **Siatka:** 4 poziome linie `--grid` (ledwo widoczne).
  - **Linia konwersji:** pełna, stroke 2.6, gradient `--accent → --violet → --orange` (od lewej do prawej), zaokrąglone złącza. Rośnie.
  - **Obszar pod linią:** wypełnienie gradientem `rgba(123,97,255,.35) → transparent` w pionie.
  - **Linia zwrotów:** przerywana (dash 6 6), stroke 2.2, kolor `--rose`, lekko przezroczysta. Opada.
  - **Punkt szczytowy:** kropka 4.5 px na końcu linii konwersji — wypełnienie `--accent`, obwódka 2.5 px w kolorze `--panel` (efekt „wycięcia").
  - **Oś X:** etykiety T1–T7 (9 px `--text-faint`, Space Grotesk).
- **Ruch:** przy wejściu w widok linie **rysują się od lewej do prawej** (`stroke-dashoffset` 900→0) w 1.8 s; obszar pojawia się z opóźnieniem (fade 1.4 s). Konwersja startuje +0.2 s, zwroty +0.5 s.
- **Rola:** opowiedzieć całą wartość produktu jednym obrazem — „konwersja w górę, zwroty w dół".
- **Dlaczego tak:** dwie przeciwbieżne linie (rosnąca pełna vs opadająca przerywana) to **natychmiastowa narracja sukcesu**. Animacja rysowania prowadzi wzrok od początku do szczytu — operator „przeżywa" wzrost, nie tylko go widzi.

### B.2.4 Donut „Looki → zakup"

- **Kontener:** mniejsza karta obok wykresu.
- **Donut:** koło 150 px, `conic-gradient(--accent 0–78%, --surface-2 78–100%)`, wewnątrz wycięcie (inset 14 px) w kolorze `--panel`. W środku: „78%" (Space Grotesk 700, 30 px) + „konwersja looków" (11 px `--text-faint`).
- **Legenda:** 3 wiersze z kwadracikiem koloru + etykietą + wartością po prawej (Space Grotesk): Kupiony cały look 78% (`--accent`), Część looku 15% (`--orange`), Tylko przeglądał 7% (`--surface-2`).
- **Rola:** pokazać siłę kompletnych stylizacji (nie pojedynczych produktów).
- **Dlaczego tak:** donut to najczytelniejszy format dla „udziału w całości". 78% w środku to wartość-bohater, legenda dostarcza kontekstu bez zaśmiecania koła.

### B.2.5 Banner „Insight AI"

- **Układ:** poziomy pasek, border 1 px `--accent` (pełny akcentowy — jedyny taki na pulpicie!), radius 16, tło gradient `--surface-2 → transparent`. Po lewej: ikona 46 px (radius 13, gradient brand, ikona iskry/AI). Środek: mała etykieta „INSIGHT AI · wykryty wzorzec" (10 px, letter-spacing 0.14em, `--accent`) + zdanie insightu (Space Grotesk 500, 15 px). Po prawej: przycisk akcji „Włącz auto-look →" (tło `--accent`, biały, radius 10).
- **Rola:** produkt sam podpowiada akcję, nie zostawia operatora z surowymi danymi.
- **Dlaczego tak:** **to jedyny element na pulpicie z pełną akcentową obwódką** — celowo. Przyciąga wzrok do najinteligentniejszej części produktu. Komunikuje: „nie tylko mierzymy, my doradzamy". To buduje poczucie, że AI naprawdę myśli.

### B.2.6 Tabela „Ostatnie rozmowy z AI"

- **Kontener:** karta, w nagłówku tytuł + tag „na żywo".
- **Nagłówki kolumn:** 10.5 px, letter-spacing 0.1em, UPPERCASE, `--text-faint`: Klient / Zapytanie / Rozmiar / Status / Wartość.
- **Wiersz:**
  - **Klient:** awatar 30 px (koło, gradient indywidualny per osoba, inicjały Space Grotesk biały) + imię (13 px) + czas (11 px `--text-faint`).
  - **Zapytanie:** `--text-dim`, max 220 px (ucięte).
  - **Rozmiar:** „M/L/28/S" w `--accent`, Space Grotesk 700.
  - **Status:** pill — „Kupiła look" (zielony, z pulsującą kropką live), „W koszyku" (pomarańczowy), „Porzuciła" (neutralny szary).
  - **Wartość:** Space Grotesk 600, wyrównana do prawej („876 zł" lub „—").
  - **Hover wiersza:** tło `--surface`.
- **Rola:** dowód, że AI realnie pracuje — twarze, pytania, wyniki, pieniądze.
- **Dlaczego tak:** kolorowe awatary z inicjałami humanizują dane (to nie liczby, to klientki). Pulsująca zielona kropka przy „Kupiła look" daje poczucie, że **dzieje się to teraz** — produkt żyje.

### B.2.7 Karta „Status integracji"

- **Wiersz integracji:** ikona platformy 34 px (radius 9, kolor brandowy platformy: Woo fiolet `#674399`, Shopify zielony, itd.) + nazwa (Space Grotesk 13 px) + opis (11.5 px `--text-faint`) + status po prawej.
  - **Status „Aktywna":** `--green` + pulsująca kropka live.
  - **Status „Wkrótce":** `--text-faint`, bez kropki.
- **Rola:** widoczność stanu połączeń + uczciwość („Shopify wkrótce").
- **Dlaczego tak:** te same kolory platform co na landingu — spójność. Status „Wkrótce" zamiast ukrywania = uczciwość, która buduje zaufanie.

---

# CZĘŚĆ C — OKNO ROZMOWY Z AGENTEM („Lume")

> **Charakter:** kameralny, intymny, premium. To „aplikacja w aplikacji" — klientka ma czuć, że rozmawia z prawdziwą stylistką, nie z formularzem. **Najważniejsza powierzchnia konwersji.**

Widget: 400 px szerokości, 660 px wysokości, radius 28, tło `--panel`, border 1 px `--border-strong`. Podwójny cień: glow (`0 50px 120px -40px`) + czarny (`0 30px 80px -50px rgba(0,0,0,.6)`). `overflow: hidden`, układ kolumnowy.

**Dlaczego taki kształt:** wysoki prostokąt z dużym radiusem (28) i mocnym, miękkim cieniem „unosi" widget nad stroną sklepu — wygląda jak osobne, premium urządzenie. To nie „czat na stronie", to „Twoja stylistka w kieszeni".

## C.1 Nagłówek widgetu

- **Wymiary:** padding 18×20, dolna krawędź 1 px `--border`. Tło: subtelny gradient `rgba(123,97,255,.14) → transparent` (lewy górny róg lekko fioletowy).
- **Awatar (44 px):** AI Core (obracająca się kula z celownikiem) + **dodatkowy pierścień** wokół (inset −4 px, border 1.5 px `--accent`, opacity 0.4, obrót 14 s). 
- **Tekst:** „Lume · stylista AI" (Space Grotesk 15 px) + status „Online · odpowiada od razu" (11.5 px `--green` + pulsująca kropka).
- **Po prawej:** ikona „⋮" (więcej opcji), `--text-faint`.
- **Rola:** ustanowić tożsamość i obecność stylistki.
- **Dlaczego tak:** **imię „Lume" + status „online" + żywy awatar z pierścieniem** = personifikacja. Klientka rozmawia z *kimś*, nie z *czymś*. Pierścień wokół awatara sugeruje „aktywne słuchanie". Zielony „odpowiada od razu" znosi lęk „czy ktoś tu jest?".

## C.2 Strumień wiadomości (body)

- **Kontener:** `flex: 1`, scroll w pionie, padding 20, odstęp 14 px między wiadomościami. Pasek scrolla cienki (5 px, `--border-strong`).
- **Daystamp:** wyśrodkowany „Dzisiaj" (10.5 px `--text-faint`).
- **Bąbel AI:** awatar 28 px (mini AI Core) po lewej + dymek: tło `--surface-2`, border `--border`, radius 17 z **ostrym lewym dolnym rogiem (5 px)**, font 14 px. Słowa kluczowe (np. **romantyczny**, **M**) pogrubione w kolorze `--accent`.
- **Bąbel klientki:** wyrównany do prawej, tło Brand gradient, tekst biały, radius 17 z **ostrym prawym dolnym rogiem (5 px)**.
- **Rola:** prowadzić rozmowę naturalnie, jak komunikator.
- **Dlaczego tak:** „ostry róg" przy nadawcy (lewy-dół dla AI, prawy-dół dla klientki) to konwencja znana z iMessage/Messenger — klientka **od razu wie, kto mówi**, bez czytania. Pogrubienia w akcencie wyróżniają decyzje (rozmiar, styl) — wzrok skacze do tego, co istotne.

## C.3 Wskaźnik pisania (typing)

- **Wygląd:** trzy kropki 7 px w dymku AI (tło `--surface-2`, border, ten sam ostry róg). Każda kropka **podskakuje i rozjaśnia się** sekwencyjnie (animacja `blink`, 1.2 s, opóźnienia 0/0.2/0.4 s).
- **Rola:** sygnalizować, że Lume „myśli/pisze".
- **Dlaczego tak:** ludzki rytm. Daje poczucie, że odpowiedź jest tworzona dla mnie teraz — buduje cierpliwość i wrażenie żywej rozmowy.

## C.4 Karuzela produktów w czacie ⭐ (najważniejszy element konwersji)

- **Kontener:** poziomy scroll, gap 10 px, ukryty pasek scrolla, pełna szerokość bąbla.
- **Karta produktu (128 px szer.):** border `--border`, radius 14, tło `--panel-2`, `overflow: hidden`.
  - **Obraz (118 px wys.):** studyjne tło (radialny gradient w kolorze kategorii) + **wektorowy render produktu** (sukienka/sandały/torebka) z miękkim cieniem. W prawym górnym rogu **badge „96% dopasowania"** (9.5 px 700, tło `rgba(0,0,0,.5)`, biały, blur).
  - **Info:** nazwa (Space Grotesk 12 px 600) + wiersz „rozm. M" (11 px `--text-faint`) + cena (Space Grotesk 700, `--accent`).
  - **Hover:** border → `--accent`, `translateY(-3px)`, cień glow.
- **Rola:** zamienić rozmowę w zakup **bez wychodzenia z czatu**.
- **Dlaczego tak:** **to jest moment konwersji**, więc dostaje najwięcej uwagi wizualnej. Badge „% dopasowania" w rogu to genialny haczyk — kwantyfikuje dopasowanie, buduje pewność („96% — to dla mnie"). Karuzela (scroll poziomy) pozwala pokazać cały look bez przytłaczania. Render na studyjnym tle = wygląda jak katalog premium, nie jak placeholder.

## C.5 Szybkie odpowiedzi (chipy)

- **Wygląd:** pill, padding 9×14, border 1 px `--border-strong`, tło `--surface`, tekst `--text` 12.5 px.
  - **Hover:** border i tekst → `--accent`, tło `--surface-2`.
- **Przykłady:** „Pokaż cały look", „Tańsze warianty", „Przymierz wirtualnie".
- **Rola:** prowadzić rozmowę bez pisania od zera.
- **Dlaczego tak:** redukują tarcie. Klientka nie musi formułować myśli — klika gotową ścieżkę. „Przymierz wirtualnie" to most do Przymierzalni — łączy powierzchnie.

## C.6 Stopka z polem wpisywania

- **Pole input:** `flex: 1`, tło `--surface`, border `--border-strong`, radius 100 (pill), padding 11×16. Placeholder „Napisz wiadomość…" (`--text-faint`). Po prawej w polu: ikona mikrofonu (`--text-faint`).
- **Przycisk Send:** koło 44 px, gradient brand, ikona „papierowego samolotu" biała.
  - **Hover:** `scale(1.06)`, cień glow.
- **Rola:** wejście tekstowe/głosowe + wysłanie.
- **Dlaczego tak:** okrągły gradientowy przycisk Send to jedyny mocny akcent w stopce — kieruje do akcji. Mikrofon w polu zapowiada input głosowy (wygodny mobilnie).

## C.7 „Powered by"

- **Wygląd:** wyśrodkowany pasek 10 px `--text-faint`: „Napędzane przez **FashionFit AI** · zgodne z RODO".
- **Rola:** atrybucja marki + sygnał zaufania.
- **Dlaczego tak:** „zgodne z RODO" w stopce czatu rozbraja obawy o dane dokładnie tam, gdzie klientka je podaje.

---

# CZĘŚĆ D — WIRTUALNA PRZYMIERZALNIA

> **Charakter:** kinowy, studyjny. Ciemne tło z reflektorem na produkcie. To moment „zobacz na sobie, zanim kupisz". Layout 3-kolumnowy: wybór (300 px) / scena (elastyczna) / rekomendacja (280 px).

## D.1 Lewa kolumna — wybór produktu

- **Nagłówek sekcji:** „PRODUKT" (12 px, letter-spacing 0.12em, UPPERCASE, `--text-faint`).
- **Pozycja produktu (`ppi`):** kafelek z miniaturą 42×52 px (studyjne tło + render) + nazwa (Space Grotesk 13 px) + opis (11.5 px `--text-faint`) + checkbox po prawej.
  - **Default:** border `--border`, tło `--surface`.
  - **Aktywna:** border `--accent`, tło `--surface-2`, checkbox wypełniony `--accent` z białym ptaszkiem.
- **Wybór koloru (swatche):** koła 30 px, `box-shadow inset` 1 px dla obrysu. Aktywny: obwódka 2 px `--text`.
- **Wybór rozmiaru:** rząd przycisków (S/M/L/XL), każdy `flex: 1`, radius 10, Space Grotesk 600.
  - **Aktywny:** border `--accent`, tło `--surface-2`, tekst `--accent`.
  - **Rekomendowany (M):** dodatkowo mały badge „AI" w prawym górnym rogu (tło `--accent`, biały, 8 px).
- **Rola:** konfiguracja wariantu do przymierzenia.
- **Dlaczego tak:** badge „AI" przy rozmiarze M **wizualnie łączy rekomendację silnika z wyborem** — klientka widzi, że „M" to nie przypadek, tylko podpowiedź. Swatche kolorów jako koła = uniwersalny, natychmiast zrozumiały wzorzec.

## D.2 Środkowa kolumna — scena

- **Tło sceny:** radialny gradient `rgba(123,97,255,.16) → transparent` od góry — **efekt reflektora studyjnego**. Padding 30.
- **Ramka try-on:** szerokość min(440px, 80%), proporcja 4:5, radius 24, border `--border-strong`, mocny cień glow.
  - **Warstwa „Przed":** sylwetka konturowa (szary stroke) na tle w paski (placeholder „bez stylizacji").
  - **Warstwa „Po · AI":** kolorowa postać w sukience (gradient fiolet→pomarańcz), włosy, buty — na ciemnym studyjnym tle z fioletową poświatą. Przycięta clip-path (pokazuje się od lewej zależnie od suwaka).
  - **Etykiety:** „Przed" (lewy górny róg) / „Po · AI" (prawy górny) — pill, tło `rgba(0,0,0,.5)`, blur, biały, UPPERCASE 10.5 px.
  - **Uchwyt suwaka:** pionowa biała linia 2 px z poświatą + okrągły uchwyt 44 px (biały, ikona ⇄, cień). Przeciągalny myszą/dotykiem.
- **Confidence bar (lewy dolny róg sceny):** pływający panel — tło `--glass`, blur, border `--border-strong`, radius 16. Zawiera: pierścień 48 px (`conic-gradient --green 0–92%`) z „92%" w środku + „Dopasowanie 92%" (Space Grotesk 13.5 px) + „krój podkreśla talię" (11.5 px `--text-dim`).
- **Ruch:** suwak płynnie odsłania warstwę „Po" (clip-path aktualizowany w czasie rzeczywistym).
- **Rola:** zredukować niepewność „jak to na mnie wygląda".
- **Dlaczego tak:** **suwak przed/po to interakcja, nie obrazek** — klientka sama odkrywa efekt, co angażuje i zapada w pamięć. Reflektor (radialny gradient) i ciemne tło izolują produkt jak w sesji zdjęciowej. **Confidence bar w zieleni (92%) zamiast „idealne dopasowanie"** = uczciwość zgodna z blueprintem; „krój podkreśla talię" wyjaśnia *dlaczego*, budując zaufanie zamiast pustej obietnicy.

## D.3 Prawa kolumna — rekomendacja Fit Engine

- **Nagłówek:** „REKOMENDACJA FIT ENGINE".
- **Breakdown dopasowania (`r-fit`):** dla każdej miary (Biust / Talia / Biodra):
  - Wiersz: nazwa po lewej + „92 cm → luz 2 cm" po prawej (Space Grotesk).
  - **Pasek (track):** 6 px wysokości, tło `--surface-2`, wypełnienie gradientem `--accent → --violet` na szerokość odpowiadającą dopasowaniu.
  - **Skala:** „obcisłe" ← → „luźne" (10 px `--text-faint`).
- **Cena:** „239 zł" (Space Grotesk 700, 26 px) + przekreślone „299 zł" (`--text-faint`).
- **CTA główny:** „Dodaj rozmiar M do koszyka" — pełna szerokość, gradient brand, biały, radius 100, padding 14. Hover: cień glow + `translateY(-1px)`.
- **CTA drugorzędny:** „Dodaj cały look · 876 zł" — border `--border-strong`, tło `--surface`.
- **Nota prywatności:** ikona tarczy `--green` + tekst 11 px `--text-faint`: „Wizualizacja generowana z wymiarów, bez przesyłania Twoich zdjęć. Dane usuwane po sesji. Zgodne z RODO."
- **Rola:** wytłumaczyć rekomendację rozmiaru i domknąć zakup.
- **Dlaczego tak:** **paski z luzem w cm pokazują *dlaczego M*, nie tylko *że M*** — to przewaga nad konkurencją, która mówi tylko „polecamy M". Dwa CTA (rozmiar vs cały look) dają wybór skali zakupu. Nota prywatności z zieloną tarczą dokładnie tam, gdzie pojawia się lęk o dane (wymiary ciała) — rozbraja go w miejscu obawy.

---

# CZĘŚĆ E — WIDGET NA STRONIE PRODUKTU (embed w sklepie)

> Powierzchnia, której nie ma w mockupie Studio, ale jest kluczowa — to jak FashionFit pojawia się **w cudzym sklepie**. Musi być widoczny, ale nie inwazyjny, i adaptować się do brandu hosta.

## E.1 Launcher (pływający przycisk)

- **Pozycja:** prawy dolny róg, 20 px od krawędzi, z-index wysoki (nad treścią sklepu, pod modalami systemowymi).
- **Wygląd:** koło 60 px, gradient brand, w środku AI Core (mini) lub ikona iskry. Cień glow.
  - **Spoczynek:** delikatne „oddychanie" (scale 1↔1.04, 4 s) — przyciąga wzrok bez agresji.
  - **Hover:** `scale(1.08)`, mocniejszy glow.
  - **Po 8 s na stronie produktu:** opcjonalny mały dymek-zaczepka „Pomóc dobrać rozmiar?" (auto-chowa się po 5 s).
- **Rola:** zaproszenie do rozmowy, nieinwazyjne.
- **Dlaczego tak:** oddychanie + opóźniony dymek = „jestem tu, gdy mnie potrzebujesz", bez wymuszania. Dymek pojawia się dopiero, gdy klientka faktycznie ogląda produkt (sygnał intencji).

## E.2 Stan otwarty (desktop)

- Launcher rozwija się w widget Lume (Część C) zakotwiczony w rogu — **animacja skali + fade z punktu launchera** (350 ms `--ease`), nie „wyskok".
- Tło strony sklepu przyciemnia się minimalnie (`rgba(0,0,0,.2)`) tylko na mobile; na desktopie widget współistnieje z treścią.
- **Dlaczego tak:** rozwinięcie „z przycisku" zachowuje ciągłość przestrzenną — klientka widzi, skąd okno przyszło i gdzie wróci.

## E.3 Stan otwarty (mobile) — bottom sheet

- **Układ:** pełna szerokość, wysokość ~85% ekranu, przyklejony do dołu, radius tylko górne rogi (28 px). Uchwyt „grabber" (40×4 px, `--border-strong`) na środku góry.
- **Gesty:** swipe w dół zamyka; swipe na karuzeli produktów przewija poziomo.
- **Klawiatura:** gdy aktywny input, sheet podnosi się nad klawiaturę, lista wiadomości scrolluje do ostatniej.
- **Rola:** natywne, pełnoekranowe doświadczenie czatu na telefonie (gdzie jest ~70% ruchu).
- **Dlaczego tak:** bottom-sheet to natywny wzorzec mobilny (znany z map, Apple Music) — klientka wie, jak go obsłużyć instynktownie. Pełna wysokość = poważna rozmowa, nie wciśnięty czacik.

## E.4 Adaptacja do brandu sklepu

- Operator w Studio ustawia **kolor akcentu widgetu** (domyślnie fiolet FashionFit, ale można dopasować do sklepu) + nazwę agenta + ton.
- **Stałe (niezmienne):** struktura, radiusy, typografia, guardrails, badge „% dopasowania", nota RODO.
- **Rola:** widget czuje się jak część sklepu, nie obcy wtręt.
- **Dlaczego tak:** sklep premium nie chce „obcego fioletu" gryzącego się z brandem. Pozwalamy zmienić akcent, ale **trzymamy strukturę i jakość** — żeby FashionFit zawsze wyglądał na produkt premium, niezależnie od hosta.

---

# CZĘŚĆ F — ZASADY PRZEKROJOWE (obowiązują wszędzie)

## F.1 Stany interakcji (każdy klikalny element MUSI mieć)

| Stan | Zachowanie wizualne |
|---|---|
| **Default** | spoczynek wg specyfikacji |
| **Hover** | zmiana koloru/border na `--accent` lub lift `translateY(-2px)`; 250–350 ms `--ease` |
| **Active/pressed** | `scale(0.98)` lub przygaszenie |
| **Focus-visible** | outline 2 px `--accent`, offset 3 px (KLAWIATURA — nieusuwalne!) |
| **Loading** | skeleton (puls `--surface ↔ --surface-2`) lub spinner z AI Core |
| **Disabled** | opacity 0.5, `cursor: not-allowed`, brak hover |
| **Error** | border `--rose`, komunikat pod polem, ikona ⚠ |

## F.2 Animacje — katalog i timing

| Animacja | Czas | Easing | Gdzie |
|---|---|---|---|
| Hover lift kart | 250–350 ms | `--ease` | wszystkie karty |
| Rysowanie wykresu | 1.8 s | `--ease` | Pulsy, dashboard |
| Reveal przy scrollu | 1 s | `--ease` | landing, sekcje |
| Typing dots | 1.2 s loop | ease | czat |
| AI Core spin | 24 s loop | linear | wszędzie |
| AI Core scan | 5 s loop | `--ease` | wszędzie |
| Pulsująca kropka live | 2 s loop | ease | statusy |
| Launcher „oddychanie" | 4 s loop | ease | embed |
| Tab/przełącznik | 350 ms | `--ease` | nawigacja |
| Bottom sheet open | 350 ms | `--ease` | mobile |

**Reguła żelazna:** wszystko powyżej **wyłącza się** w `@media (prefers-reduced-motion: reduce)`. Bez wyjątków.

## F.3 Hierarchia kolorów akcji (na każdym ekranie)

1. **Główny CTA** — gradient brand, pełna sytość. **Tylko jeden na ekran/widok.**
2. **Akcja drugorzędna** — border + tło `--surface`, bez gradientu.
3. **Akcja trzeciorzędna** — sam tekst w `--accent` lub `--text-dim`.
4. **Destrukcyjna** — `--rose`, zawsze z potwierdzeniem.

## F.4 Spacing i rytm

- Tylko wartości z `--spacing` (4/8/12/16/20/24/32/40).
- Odstęp między sekcjami w obrębie karty: 18–24 px.
- Padding kart: 20–22 px (Studio), 14–20 px (widget).
- Gap w gridach: 16 px (Studio), 10–12 px (widget — ciaśniej, bo mniej miejsca).

## F.5 Dostępność (niepodlegające negocjacji)

- Kontrast tekstu min. 4.5:1 (body), 3:1 (duże nagłówki).
- Każdy interaktywny element osiągalny klawiaturą, z widocznym focus-ring.
- Wykresy mają `aria-label` opisujący trend słowami.
- Czat: `role="log"`, każda wiadomość `role="article"`, status `aria-live="polite"`.
- Ikony dekoracyjne `aria-hidden`, ikony znaczące z `<title>`.
- Tryb wysokiego kontrastu i reduced-motion wspierane.

## F.6 Responsywność — punkty łamania

| Breakpoint | Zmiana |
|---|---|
| > 1080 px | pełny layout (sidebar + 3 kolumny) |
| ≤ 1080 px | sidebar chowany w hamburger; gridy 2-kол.; przymierzalnia 1-kол. |
| ≤ 560 px | wszystko 1-kол.; czat pełna szerokość; tabs scrollowalne; widget → bottom sheet |

---

# Zakończenie — pięć rzeczy, które MUSZĄ zostać w głowie klienta

1. **Fioletowa kula z celownikiem (AI Core)** — znak rozpoznawczy, ten sam na landingu, w pasku, jako awatar Lume. Powtarzalność = zapamiętywalność.
2. **„Lume" — stylistka z imieniem** — nie chatbot. Personifikacja zostaje w pamięci.
3. **Badge „% dopasowania"** — kwantyfikacja pewności, której nie ma konkurencja. „96% — to dla mnie".
4. **Confidence bar + luz w cm** — uczciwość zamiast obietnicy. Buduje zaufanie, które wraca.
5. **Gradient fiolet→pomarańcz** — jeden, charakterystyczny, na CTA i kluczowych akcentach wszędzie. To „kolor FashionFit".

Spójność tych pięciu elementów na **wszystkich** powierzchniach — od reklamy, przez landing, czat, po e-mail potwierdzający zakup — sprawia, że marka „wpada w głowę" i tam zostaje.
