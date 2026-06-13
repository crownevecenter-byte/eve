import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

/** One API call replaces 4 chained voucher tab loads (categories, accounts, history, next-no). */
export function useVoucherPageInit(voucherType, branchId) {
  return useQuery({
    queryKey: ['voucher-page-init', branchId, voucherType],
    queryFn: () =>
      api
        .get('/vouchers/page-init', {
          params: { branchId, voucher_type: voucherType },
        })
        .then((r) => r.data),
    enabled: !!branchId && !!voucherType,
    staleTime: 5 * 60 * 1000,
  });
}
