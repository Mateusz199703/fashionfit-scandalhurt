# FashionFit — darmowy deploy (tymczasowe adresy onrender.com)

## Opcja A (najprostsza): Render Blueprint (backend + dashboard)

1. Wejdz na https://render.com i zaloguj sie.
2. New + -> **Blueprint** i wybierz repozytorium.
3. Render automatycznie wykryje plik `render.yaml` z tego repo.
4. Potwierdz utworzenie 2 serwisow:
   - `fashionfit-backend` (Web Service)
   - `fashionfit-dashboard` (Static Site)
5. Ustaw zmienne srodowiskowe backendu:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
   - `JWT_SECRET`
   - `FASHN_API_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `STRIPE_PRICE_STARTER`
   - `STRIPE_PRICE_GROWTH`
   - `STRIPE_PRICE_SCALE`
6. Po pierwszym deployu skopiuj URL backendu, np.
   `https://fashionfit-backend-xxxx.onrender.com`
7. Ustaw:
   - backend `FRONTEND_URL` = URL dashboardu (np. `https://fashionfit-dashboard-xxxx.onrender.com`)
   - backend `API_PUBLIC_URL` = URL backendu (np. `https://fashionfit-backend-xxxx.onrender.com`)
   - dashboard `REACT_APP_API_URL` = URL backendu
8. Redeploy obu serwisow.

To bedzie Twoj tymczasowy, produkcyjny setup bez domeny.

## Opcja B: Koyeb (1 free web service)

1. Wejdz na https://www.koyeb.com i zaloguj sie.
2. Create App -> Deploy from GitHub.
3. Ustaw:
   - Build command: `npm install`
   - Run command: `npm run start:backend`
4. Dodaj te same ENV co wyzej.
5. Wybierz darmowa instancje (`free`) i wdroz.
6. Skopiuj URL aplikacji (to Twoj `API URL`).

## Co wpisac w WordPress (wtyczka FashionFit)

1. `API URL` -> publiczny adres backendu z Render/Koyeb (`https://...onrender.com`).
2. `API Key` -> pobrany z API po rejestracji klienta.
3. `Połącz ze sklepem` -> `Shop ID` uzupelni sie automatycznie.

## Utworzenie klienta + API key + sklepu (automatycznie)

Po deployu odpal lokalnie (na swoim komputerze) w katalogu repo:

```bash
BACKEND_URL=\"https://TWOJ_BACKEND.onrender.com\" \
CLIENT_EMAIL=\"twojmail@example.com\" \
CLIENT_PASSWORD=\"TwojeHaslo123!\" \
CLIENT_NAME=\"Scandalhurt\" \
CLIENT_COMPANY=\"Scandalhurt\" \
SHOP_DOMAIN=\"scandalhurt.pl\" \
SHOP_NAME=\"Scandalhurt\" \
npm run bootstrap:client
```

Skrypt wypisze gotowe dane do wtyczki:
- `API URL`
- `API Key`
- `Shop ID`

## Szybki test health

Otworz w przegladarce:

`https://TWOJ_BACKEND_URL/health`

Powinno zwrocic JSON ze statusem `ok`.

## Stripe webhook (wymagane dla auto-aktywacji kont)

W Stripe -> Developers -> Webhooks dodaj endpoint:

`https://TWOJ_BACKEND_URL/api/webhooks/stripe`

Eventy:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Po zapisaniu skopiuj `Signing secret` i wklej do:
- `STRIPE_WEBHOOK_SECRET` w backendzie na Render.
