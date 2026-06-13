const NodeCache = require('node-cache');

/** userId -> revoked-at timestamp (ms). TTL matches max JWT lifetime. */
const revokedAfter = new NodeCache({ stdTTL: 86400, checkperiod: 3600 });

const revokeUserTokens = (userId) => {
  revokedAfter.set(String(userId), Date.now());
};

const isTokenRevoked = (userId, tokenIssuedAtSec) => {
  const revokedAt = revokedAfter.get(String(userId));
  if (!revokedAt || !tokenIssuedAtSec) return false;
  return tokenIssuedAtSec * 1000 < revokedAt;
};

module.exports = { revokeUserTokens, isTokenRevoked };
