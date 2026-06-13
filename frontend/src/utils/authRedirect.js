import { normalizeRoleRedirect } from '../constants/customerPaths';

/** Post-login path from role + optional ?redirect= or location.state.from */
export const getPostLoginPath = (user, location = null) => {
  const searchParams = location?.search ? new URLSearchParams(location.search) : null;
  const redirectQuery = searchParams?.get('redirect');
  const from = location?.state?.from || redirectQuery || null;

  if (from) {
    return normalizeRoleRedirect(from, user.role);
  }

  const role = user.role;
  if (role === 'COMPANY_OWNER') return '/owner/dashboard';
  if (role === 'BRANCH_OWNER' || role === 'BRANCH_MANAGER') return '/branch/dashboard';
  if (role === 'CUSTOMER') return '/my/dashboard';
  if (role === 'EMPLOYEE') return '/branch/pos';
  if (role === 'TECHNICIAN') return '/branch/appointments';
  return '/';
};
