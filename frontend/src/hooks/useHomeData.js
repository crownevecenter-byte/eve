import { useQuery } from '@tanstack/react-query';
import publicApi from '../services/publicApi';
import { shouldRetryQuery, queryRetryDelay } from '../utils/queryRetry';

const HOME_BIKES_CACHE_KEY = 'crown_home_bikes_v1';

const normalizeProductsList = (data) => {
  const list = data?.data ?? data;
  return Array.isArray(list) ? list : [];
};

const readCachedBikes = () => {
  try {
    const raw = sessionStorage.getItem(HOME_BIKES_CACHE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : undefined;
  } catch {
    return undefined;
  }
};

const writeCachedBikes = (products) => {
  try {
    if (products?.length) {
      sessionStorage.setItem(HOME_BIKES_CACHE_KEY, JSON.stringify(products));
    }
  } catch {
    // ignore quota errors
  }
};

export function useHomeData() {
  const servicesQuery = useQuery({
    queryKey: ['home', 'services'],
    queryFn: () => publicApi.get('/services').then((r) => { const d = r.data?.data ?? r.data; return Array.isArray(d) ? d : []; }),
    staleTime: 5 * 60 * 1000,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  });

  const productsQuery = useQuery({
    queryKey: ['home', 'products', 'bikes'],
    queryFn: async () => {
      const res = await publicApi.get('/products', {
        params: { product_type: 'bike', limit: 6, lite: '1' },
      });
      const list = normalizeProductsList(res.data);
      writeCachedBikes(list);
      return list;
    },
    enabled: servicesQuery.isSuccess,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: () => readCachedBikes(),
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  });

  const branchesQuery = useQuery({
    queryKey: ['home', 'branches'],
    queryFn: () => publicApi.get('/branches', { params: { limit: 20 } }).then((r) => { const d = r.data?.data ?? r.data; return Array.isArray(d) ? d : []; }),
    enabled: productsQuery.isSuccess,
    staleTime: 10 * 60 * 1000,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  });

  const testimonialsQuery = useQuery({
    queryKey: ['home', 'testimonials'],
    queryFn: () => publicApi.get('/testimonials').then((r) => { const d = r.data?.data ?? r.data; return Array.isArray(d) ? d : []; }),
    enabled: branchesQuery.isSuccess,
    staleTime: 10 * 60 * 1000,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  });

  const branchesRaw = branchesQuery.data?.data ?? branchesQuery.data ?? [];
  const products = productsQuery.data ?? [];

  return {
    services: servicesQuery.data ?? [],
    products,
    branches: Array.isArray(branchesRaw) ? branchesRaw : [],
    testimonials: testimonialsQuery.data ?? [],
    isLoading: productsQuery.isLoading && products.length === 0,
    isProductsError: productsQuery.isError,
    isProductsFetching: productsQuery.isFetching,
    productsFromCache: productsQuery.isPlaceholderData && products.length > 0,
    refetchProducts: productsQuery.refetch,
    servicesLoading: servicesQuery.isLoading,
    branchesLoading: branchesQuery.isLoading,
    testimonialsLoading: testimonialsQuery.isLoading,
  };
}
