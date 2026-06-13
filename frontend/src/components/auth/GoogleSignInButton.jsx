import React from 'react';
import { GoogleLogin } from '@react-oauth/google';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const GoogleSignInButton = ({ onSuccess, onError, disabled = false }) => {
  if (!CLIENT_ID) return null;

  return (
    <div className={`auth-google-wrap${disabled ? ' auth-google-wrap--disabled' : ''}`}>
      <GoogleLogin
        onSuccess={(response) => {
          if (response?.credential) {
            onSuccess(response.credential);
          } else {
            onError?.('Google did not return a sign-in token.');
          }
        }}
        onError={() => onError?.('Google sign-in was cancelled or failed.')}
        text="continue_with"
        theme="outline"
        shape="rectangular"
        size="large"
        width="400"
        locale="en"
      />
    </div>
  );
};

export const isGoogleSignInEnabled = () => Boolean(CLIENT_ID);

export default GoogleSignInButton;
