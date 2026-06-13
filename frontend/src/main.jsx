import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SpeedInsights } from '@vercel/speed-insights/react'
import './index.css'
import './styles/catalog-layout.css'
import './components/branch/SaleInvoiceReceipt.css'
import './components/branch/BikeSaleInvoice.css'
import './components/branch/ServiceThermalReceipt.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary'
import { shouldRetryQuery, queryRetryDelay } from './utils/queryRetry'
import { clearStaleApiPreference } from './utils/apiUrl'

clearStaleApiPreference()
// Auto-reload on Vite preload errors (new deployment chunk name mismatch)
const CHUNK_RELOAD_COOLDOWN_MS = 60_000;
const CHUNK_RELOAD_JITTER_MS = 3000;

const reloadAfterStaleAsset = (reason) => {
  const lastReload = sessionStorage.getItem('last-chunk-reload');
  const now = Date.now();
  if (lastReload && now - parseInt(lastReload, 10) <= CHUNK_RELOAD_COOLDOWN_MS) {
    return;
  }
  const delay = Math.floor(Math.random() * CHUNK_RELOAD_JITTER_MS);
  console.warn(`${reason} — reloading in ${delay}ms...`);
  setTimeout(() => {
    sessionStorage.setItem('last-chunk-reload', Date.now().toString());
    window.location.reload();
  }, delay);
};

window.addEventListener('vite:preloadError', () => {
  reloadAfterStaleAsset('Vite preload error');
});

window.addEventListener(
  'error',
  (event) => {
    const target = event.target;
    if (target?.tagName === 'LINK' && target.rel === 'stylesheet') {
      reloadAfterStaleAsset('Stale stylesheet after deploy');
    }
  },
  true
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: shouldRetryQuery,
      retryDelay: queryRetryDelay,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
})

const appTree = (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <App />
      <SpeedInsights />
    </QueryClientProvider>
  </ErrorBoundary>
);

// StrictMode double-mounts effects in dev only; production build has no extra invocations.
createRoot(document.getElementById('root')).render(
  import.meta.env.DEV ? <StrictMode>{appTree}</StrictMode> : appTree,
)
