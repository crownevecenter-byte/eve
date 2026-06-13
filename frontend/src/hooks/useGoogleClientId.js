import { useEffect, useState } from 'react';
import api from '../services/api';
import { GOOGLE_OAUTH_CLIENT_ID } from '../constants/googleAuth';

export const useGoogleClientId = () => {
  const [clientId, setClientId] = useState(GOOGLE_OAUTH_CLIENT_ID);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    api
      .get('/auth/google-config')
      .then((res) => {
        if (!cancelled && res.data?.clientId) {
          setClientId(res.data.clientId);
        }
      })
      .catch(() => {
        // Keep bundled/default client ID when API config is unavailable.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    clientId,
    loading,
    enabled: Boolean(clientId),
  };
};
