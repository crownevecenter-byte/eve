import React, { useEffect, useRef, useState } from 'react';
import { useGoogleClientId } from '../../hooks/useGoogleClientId';
import {
  initGoogleIdentityOnce,
  renderGoogleButton,
  setGoogleCredentialCallback,
  waitForGoogleButton,
} from '../../utils/googleGsi';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.223 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C33.64 6.053 28.991 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
    <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C33.64 6.053 28.991 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.05 12.05 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
  </svg>
);

const GoogleAuthSection = ({ onSuccess, onError, disabled = false, mode = 'signin' }) => {
  const { clientId, loading, enabled } = useGoogleClientId();
  const hiddenButtonRef = useRef(null);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const [gsiReady, setGsiReady] = useState(false);
  const [gsiError, setGsiError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const label = mode === 'signup' ? 'Sign up with Google' : 'Continue with Google';

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onSuccess, onError]);

  useEffect(() => {
    setGoogleCredentialCallback((response) => {
      if (response?.credential) {
        onSuccessRef.current(response.credential);
      } else {
        onErrorRef.current?.('Google did not return a sign-in token.');
      }
    });
  }, []);

  useEffect(() => {
    setGsiReady(false);
    setGsiError(false);

    if (!enabled || !clientId) return undefined;

    let cancelled = false;

    const boot = async () => {
      try {
        await initGoogleIdentityOnce(clientId);
        const mount = hiddenButtonRef.current;
        if (cancelled || !mount) return;

        renderGoogleButton(mount, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: mode === 'signup' ? 'signup_with' : 'continue_with',
          width: 400,
        });

        await waitForGoogleButton(mount);
        if (!cancelled) setGsiReady(true);
      } catch {
        if (!cancelled) setGsiError(true);
      }
    };

    boot();

    return () => {
      cancelled = true;
      if (hiddenButtonRef.current) hiddenButtonRef.current.innerHTML = '';
    };
  }, [clientId, enabled, mode, retryKey]);

  const handleMissingConfig = () => {
    onErrorRef.current?.(
      'Google sign-in is not configured yet. Set GOOGLE_CLIENT_ID on the API server (Hostinger env).'
    );
  };

  const handleRetry = () => {
    setGsiError(false);
    setGsiReady(false);
    if (hiddenButtonRef.current) hiddenButtonRef.current.innerHTML = '';
    setRetryKey((key) => key + 1);
  };

  return (
    <>
      {!enabled && !loading && (
        <button
          type="button"
          className="auth-google-custom"
          disabled={disabled}
          onClick={handleMissingConfig}
        >
          <GoogleIcon />
          <span>{label}</span>
        </button>
      )}

      {enabled && (
        <div className="auth-google-stack">
          <div className="auth-google-custom auth-google-custom--visual" aria-hidden="true">
            <GoogleIcon />
            <span>
              {loading || !gsiReady
                ? (gsiError ? 'Google sign-in unavailable' : 'Loading Google…')
                : label}
            </span>
          </div>

          <div
            ref={hiddenButtonRef}
            className={`auth-google-gsi-mount${
              disabled || loading || !gsiReady || gsiError ? ' auth-google-gsi-mount--disabled' : ''
            }`}
            aria-label={label}
          />

          {gsiError && (
            <button type="button" className="auth-google-retry" onClick={handleRetry}>
              Retry Google sign-in
            </button>
          )}
        </div>
      )}

      <div className="form-divider">or</div>
    </>
  );
};

export default GoogleAuthSection;
