// Centralized API URL.
// Default: Hostinger API directly. On QUIC/network failures, fall back to www → Vercel proxy.

export const DIRECT_API = 'https://api.crownevcenter.com/api';
const STORAGE_KEY = 'crown_api_base';

export const getProxiedApiUrl = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`;
  }
  return DIRECT_API;
};

/** Drop stale "direct" preference from older builds that caused CORS + 429 storms. */
export const clearStaleApiPreference = () => {
  if (typeof window === 'undefined') return;
  if (isCrownProductionSite() && sessionStorage.getItem(STORAGE_KEY) === 'direct') {
    sessionStorage.removeItem(STORAGE_KEY);
  }
};

export const setApiBasePreference = (mode) => {
  if (typeof window === 'undefined') return;
  if (mode === 'proxy' || mode === 'direct') {
    sessionStorage.setItem(STORAGE_KEY, mode);
  } else {
    sessionStorage.removeItem(STORAGE_KEY);
  }
};

export const isCrownProductionSite = () => {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'crownevcenter.com' || host === 'www.crownevcenter.com';
};

export const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }

  if (import.meta.env.MODE === 'production' && typeof window !== 'undefined') {
    // Same-origin /api proxy — no CORS, Vercel rewrites to Hostinger API.
    if (isCrownProductionSite()) {
      return getProxiedApiUrl();
    }
    return `${window.location.origin}/api`;
  }

  return 'http://localhost:5000/api';
};

/** Vercel SPA catch-all can return index.html (200) or 405 for /api — not the real backend. */
export const isMisroutedProxyResponse = (response, config) => {
  if (!config?.baseURL || typeof window === 'undefined') return false;
  const originApi = `${window.location.origin}/api`;
  if (!config.baseURL.startsWith(originApi)) return false;
  if (response?.status === 405) return true;
  const ct = response?.headers?.['content-type'] || '';
  return ct.includes('text/html');
};

/** Retry via same-origin proxy when direct API fails (CORS) or proxy returned HTML/405. */
export const shouldRetryViaProxy = (error, config) => {
  if (!config || config.__apiFallback || !isCrownProductionSite()) return false;
  const base = config.baseURL || '';
  const onDirect = base.includes('api.crownevcenter.com');
  const onProxy = base.startsWith(`${window.location.origin}/api`);

  if (onDirect && isNetworkTransportError(error)) {
    return true;
  }
  if (onProxy) {
    const res = error?.response;
    if (res && isMisroutedProxyResponse(res, config)) return true;
    if (isNetworkTransportError(error)) return false;
  }
  return false;
};

/** True when the browser never got an HTTP response (QUIC timeout, DNS, offline, etc.). */
export const isNetworkTransportError = (err) => {
  if (!err || err.response) return false;
  const msg = `${err.message || ''} ${err.code || ''}`;
  return (
    err.code === 'ERR_NETWORK' ||
    err.code === 'ECONNABORTED' ||
    err.code === 'ETIMEDOUT' ||
    /QUIC|NETWORK_IDLE|Failed to fetch|Network Error/i.test(msg)
  );
};

export const getApiFallbackUrl = (currentBase) => {
  if (!currentBase || typeof window === 'undefined') return null;
  // Production site: only fall back to same-origin proxy (never cross-origin direct).
  if (currentBase.includes('api.crownevcenter.com') && isCrownProductionSite()) {
    setApiBasePreference('proxy');
    return getProxiedApiUrl();
  }
  return null;
};
