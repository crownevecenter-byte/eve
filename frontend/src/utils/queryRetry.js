/**
 * Avoid retry storms on CORS / network failures (no HTTP response).
 * Allow at most one retry for transient 5xx from the API.
 */
export function shouldRetryQuery(failureCount, error) {
  if (!error?.response) return false;

  const status = error.response.status;
  if (status === 401 || status === 403 || status === 404 || status === 429) return false;
  if (status >= 500 && failureCount < 1) return true;

  return false;
}

export const queryRetryDelay = (attempt) => Math.min(1000 * 2 ** attempt, 12000);
