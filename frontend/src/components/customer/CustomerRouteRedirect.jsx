import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { normalizeCustomerRedirect } from '../../constants/customerPaths';

/** Redirect legacy /track/:id → /my/track/:id inside customer shell */
export const RedirectTrackToMy = () => {
  const { id } = useParams();
  return <Navigate to={`/my/track/${id}`} replace />;
};

/** Redirect any legacy customer path using alias map */
export const RedirectLegacyCustomerPath = ({ to }) => (
  <Navigate to={normalizeCustomerRedirect(to)} replace />
);
