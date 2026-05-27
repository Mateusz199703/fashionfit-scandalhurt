/* eslint-disable no-console */
const required = ['BACKEND_URL', 'CLIENT_EMAIL', 'CLIENT_PASSWORD', 'CLIENT_NAME', 'SHOP_DOMAIN'];

for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing required env var: ${key}`);
    process.exit(1);
  }
}

const backendUrl = process.env.BACKEND_URL.replace(/\/$/, '');
const payload = {
  email: process.env.CLIENT_EMAIL,
  password: process.env.CLIENT_PASSWORD,
  name: process.env.CLIENT_NAME,
  company_name: process.env.CLIENT_COMPANY || process.env.CLIENT_NAME,
};

async function postJson(path, body, token) {
  const res = await fetch(`${backendUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data && data.error ? data.error : `Request failed (${res.status})`;
    throw new Error(`${path}: ${message}`);
  }
  return data;
}

async function main() {
  let token;
  let apiKey;

  try {
    const register = await postJson('/api/auth/register', payload);
    token = register.token;
    apiKey = register.apiKey;
    console.log('Client created.');
  } catch (err) {
    if (!String(err.message).includes('already exists')) throw err;
    const login = await postJson('/api/auth/login', {
      email: payload.email,
      password: payload.password,
    });
    token = login.token;
    console.log('Client already exists, logged in.');
  }

  const shop = await postJson(
    '/api/shops',
    {
      name: process.env.SHOP_NAME || process.env.SHOP_DOMAIN,
      domain: process.env.SHOP_DOMAIN,
      platform: 'woocommerce',
    },
    token
  );

  if (!apiKey) {
    const me = await fetch(`${backendUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json());
    apiKey = me && me.client ? me.client.apiKey : '';
  }

  console.log('\nDone. Use these values in WordPress plugin settings:');
  console.log(`API URL: ${backendUrl}`);
  console.log(`API Key: ${apiKey || '(not returned - check dashboard /api/auth/me)'}`);
  console.log(`Shop ID: ${shop.shop.id}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
