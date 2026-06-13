import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

/** One API call for POS account screens (categories + accounts). */
export function useAccountsPageInit(branchId) {
  return useQuery({
    queryKey: ['accounts-page-init', branchId],
    queryFn: () =>
      api
        .get('/accounts/page-init', { params: { branchId } })
        .then((r) => r.data),
    enabled: !!branchId,
    staleTime: 5 * 60 * 1000,
  });
}
