# FashionFit — darmowy deploy backendu (bez placenia na start)

## Opcja A (najprostsza): Render Free Web Service

1. Wejdz na https://render.com i zaloguj sie.
2. New + -> **Blueprint** i wybierz repozytorium.
3. Render automatycznie wykryje plik `render.yaml` z tego repo.
4. Potwierdz utworzenie serwisu `fashionfit-backend` (plan `free`).
5. Dodaj zmienne srodowiskowe:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
   - `JWT_SECRET`
   - `FRONTEND_URL` = `http://localhost:3000`
   - opcjonalnie: `FASHN_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
6. Deploy.
7. Po deployu skopiuj publiczny adres, np. `https://fashionfit-backend.onrender.com`.

To bedzie Twoj `API URL` we wtyczce WordPress.

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

1. `API URL` -> publiczny adres backendu z Render/Koyeb.
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
