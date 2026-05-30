const { GoogleAuth } = require('google-auth-library');
let cachedAuthClientPromise = null;

function getCredentialsFromEnv() {
  const raw = process.env.GOOGLE_CREDENTIALS_JSON;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error('GOOGLE_CREDENTIALS_JSON is not valid JSON');
  }
}

function getGoogleAuthClient() {
  const credentials = getCredentialsFromEnv();
  if (credentials) {
    return new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
  }

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error('Google credentials are missing. Set GOOGLE_CREDENTIALS_JSON or GOOGLE_APPLICATION_CREDENTIALS');
  }

  return new GoogleAuth({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
}

async function getAuthorizedClient() {
  if (!cachedAuthClientPromise) {
    cachedAuthClientPromise = getGoogleAuthClient()
      .getClient()
      .catch((error) => {
        cachedAuthClientPromise = null;
        throw error;
      });
  }
  return cachedAuthClientPromise;
}

async function getAccessToken() {
  const client = await getAuthorizedClient();
  const tokenResponse = await client.getAccessToken();
  const token = typeof tokenResponse === 'string' ? tokenResponse : tokenResponse && tokenResponse.token;
  if (!token) throw new Error('Could not resolve Google access token');
  return token;
}

module.exports = { getAccessToken };
