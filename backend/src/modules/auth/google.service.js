const { OAuth2Client } = require('google-auth-library');

// Public OAuth Web client ID — matches frontend when Hostinger env is unset.
const DEFAULT_GOOGLE_CLIENT_ID =
  '225130453736-jl6ulha3l8qc92qhboiapn4t7rkum54n.apps.googleusercontent.com';

const getGoogleClientId = () => process.env.GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID;

const verifyGoogleIdToken = async (idToken) => {
  const clientId = getGoogleClientId();
  if (!clientId) {
    const err = new Error('Google sign-in is not configured on the server.');
    err.statusCode = 503;
    throw err;
  }

  const client = new OAuth2Client(clientId);
  const ticket = await client.verifyIdToken({
    idToken,
    audience: clientId,
  });

  const payload = ticket.getPayload();
  if (!payload?.email) {
    const err = new Error('Google account email is missing.');
    err.statusCode = 400;
    throw err;
  }

  if (payload.email_verified === false) {
    const err = new Error('Please verify your Google email before signing in.');
    err.statusCode = 400;
    throw err;
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name || payload.email.split('@')[0],
  };
};

module.exports = { verifyGoogleIdToken, getGoogleClientId };
