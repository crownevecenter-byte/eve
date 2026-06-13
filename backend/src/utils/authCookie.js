const TOKEN_MAX_AGE_SEC = 86400;

const setAuthCookie = (res, token) => {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `token=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=${TOKEN_MAX_AGE_SEC}; SameSite=Lax${secure}`
  );
};

const clearAuthCookie = (res) => {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${secure}`
  );
};

const getTokenFromRequest = (req) => {
  const bearer = req.headers.authorization?.split(' ')[1];
  if (bearer) return bearer;

  const raw = req.headers.cookie;
  if (!raw) return null;
  const match = raw.match(/(?:^|;\s*)token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
};

module.exports = { setAuthCookie, clearAuthCookie, getTokenFromRequest, TOKEN_MAX_AGE_SEC };
