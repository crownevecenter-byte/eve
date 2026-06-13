import axios from 'axios';
import {
  getApiUrl,
  getApiFallbackUrl,
  isMisroutedProxyResponse,
  setApiBasePreference,
  shouldRetryViaProxy,
} from '../utils/apiUrl';

/** Catalog reads without Authorization — enables server-side GET cache for all visitors. */
const publicApi = axios.create({
  timeout: 30000,
  headers: {
    Accept: 'application/json',
  },
});

publicApi.interceptors.request.use((config) => {
  config.baseURL = getApiUrl();
  return config;
});

const retryPublicWithFallback = async (config) => {
  const fallback = getApiFallbackUrl(config.baseURL || getApiUrl());
  if (!fallback) return null;
  setApiBasePreference(fallback.includes('api.crownevcenter.com') ? 'direct' : 'proxy');
  config.__apiFallback = true;
  config.baseURL = fallback;
  return publicApi.request(config);
};

publicApi.interceptors.response.use(
  async (response) => {
    const config = response.config;
    if (config && !config.__apiFallback && isMisroutedProxyResponse(response, config)) {
      try {
        const retried = await retryPublicWithFallback(config);
        if (retried) return retried;
      } catch (retryErr) {
        return Promise.reject(retryErr);
      }
    }
    return response;
  },
  async (error) => {
    const config = error.config;
    if (!config) return Promise.reject(error);

    if (shouldRetryViaProxy(error, config)) {
      try {
        const retried = await retryPublicWithFallback(config);
        if (retried) return retried;
      } catch (retryErr) {
        return Promise.reject(retryErr);
      }
    }

    return Promise.reject(error);
  }
);

export default publicApi;
