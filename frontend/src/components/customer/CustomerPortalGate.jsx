import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { normalizeCustomerRedirect } from '../../constants/customerPaths';

/**
 * When a logged-in customer hits a legacy public URL (/shop, /cart, /track/…),
 * send them to the matching /my/* route with customer navbar.
 */
const CustomerPortalGate = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--muted, #888)' }}>
        Loading…
      </div>
    );
  }

  if (user?.role === 'CUSTOMER') {
    const fullPath = `${location.pathname}${location.search}`;
    const target = normalizeCustomerRedirect(fullPath);
    if (target !== fullPath) {
      return <Navigate to={target} replace />;
    }
  }

  return children;
};

export default CustomerPortalGate;
