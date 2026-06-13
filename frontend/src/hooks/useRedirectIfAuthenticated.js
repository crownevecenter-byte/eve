import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPostLoginPath } from '../utils/authRedirect';

/** Send already-logged-in users to their dashboard instead of login/register. */
export function useRedirectIfAuthenticated() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && user) {
      navigate(getPostLoginPath(user, location), { replace: true });
    }
  }, [user, loading, navigate, location]);
}
