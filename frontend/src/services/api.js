import axios from 'axios';
import {
  getApiUrl,
  getApiFallbackUrl,
  isMisroutedProxyResponse,
  setApiBasePreference,
  shouldRetryViaProxy,
} from '../utils/apiUrl';
import { runQueued } from '../utils/apiQueue';

const AUTH_TIMEOUT_MS = 35000;

const api = axios.create({
  timeout: 60000,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Cache-Control': 'no-cache',
  },
});

api.interceptors.request.use((config) => {
  if (!config.baseURL) {
    config.baseURL = getApiUrl();
  }
  const token = localStorage.getItem('crowneve_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.method === 'get') {
    config.headers['Cache-Control'] = 'max-age=60';
  }
  if (typeof config.url === 'string' && config.url.startsWith('/auth/')) {
    config.timeout = AUTH_TIMEOUT_MS;
  }
  return config;
});

const retryWithApiFallback = async (config) => {
  const fallback = getApiFallbackUrl(config.baseURL || getApiUrl());
  if (!fallback) return null;
  setApiBasePreference('proxy');
  config.__apiFallback = true;
  config.baseURL = fallback;
  return api.request(config);
};

api.interceptors.response.use(
  async (response) => {
    const config = response.config;
    if (config && !config.__apiFallback && isMisroutedProxyResponse(response, config)) {
      try {
        const retried = await retryWithApiFallback(config);
        if (retried) return retried;
      } catch (retryErr) {
        return Promise.reject(retryErr);
      }
    }
    return response;
  },
  async (error) => {
    const config = error.config;

    if (config && shouldRetryViaProxy(error, config)) {
      try {
        const retried = await retryWithApiFallback(config);
        if (retried) return retried;
      } catch (retryErr) {
        return Promise.reject(retryErr);
      }
    }

    if (error.response?.status === 429 && error.response?.data) {
      const data = error.response.data;
      if (typeof data === 'object' && data.message) {
        error.message = data.message;
      } else if (typeof data === 'string') {
        error.message = 'Server is busy. Please wait a minute and try again.';
      }
    }

    if (
      error.response?.status === 401 &&
      !error.config?.url?.startsWith('/auth/')
    ) {
      localStorage.removeItem('crowneve_token');
      localStorage.removeItem('crowneve_user');
      localStorage.removeItem('crowneve_last_active');
      sessionStorage.clear();
      const path = window.location.pathname + window.location.search;
      if (!path.startsWith('/login')) {
        window.location.href = `/login?redirect=${encodeURIComponent(path)}`;
      }
    }
    return Promise.reject(error);
  }
);

const rawRequest = api.request.bind(api);
api.request = (config) => runQueued(() => rawRequest(config));

export default api;
