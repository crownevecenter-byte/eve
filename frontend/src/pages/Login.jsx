// frontend/src/pages/Login.jsx
import React, { useCallback, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LOGO_URL } from '../constants/mediaAssets';
import GoogleAuthSection from '../components/auth/GoogleAuthSection';
import PasswordInput from '../components/auth/PasswordInput';
import { getPostLoginPath } from '../utils/authRedirect';
import { useRedirectIfAuthenticated } from '../hooks/useRedirectIfAuthenticated';
import './auth/Auth.css';

const Login = () => {
  useRedirectIfAuthenticated();
  const params = new URLSearchParams(window.location.search);
  const inactivityMsg = params.get('reason') === 'inactivity'
    ? 'You were logged out due to 30 minutes of inactivity.'
    : null;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { login, loginWithGoogle, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (authLoading || user) {
    return (
      <div id="page-login" className="page">
        <div className="login-card" style={{ display: 'flex', justifyContent: 'center', padding: '64px 32px' }}>
          <div
            style={{
              width: 36,
              height: 36,
              border: '3px solid rgba(232,71,10,0.25)',
              borderTopColor: '#E8470A',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await login(email, password);
      const user = res.user;
      
      navigate(getPostLoginPath(user, location), { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      if (err.response?.data?.unverified) {
        return navigate(`/verify-otp?email=${encodeURIComponent(err.response.data.email || email)}`);
      }
      const status = err.response?.status;
      let msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      if (err.code === 'ECONNABORTED' || !err.response) {
        msg =
          'Backend server is not responding. Wait 1 minute, then try again. If this keeps happening, the Hostinger API needs a restart.';
      } else if (status === 401) {
        msg = err.response?.data?.message || 'Invalid email or password.';
      } else if (status === 429) {
        msg = err.response?.data?.message || 'Too many attempts. Please wait a minute and try again.';
      } else if (status === 500) {
        msg =
          err.response?.data?.message ||
          'Server error during login. Ensure Hostinger has JWT_SECRET set and the API was restarted after the latest deploy.';
      } else if (status === 503 || status === 504) {
        msg =
          'Server is busy or timed out. Wait a minute, then try again. Restart the Hostinger API if this continues.';
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSuccess = useCallback(async (credential) => {
    if (googleSubmitting || submitting) return;
    setGoogleSubmitting(true);
    setError('');
    try {
      const res = await loginWithGoogle(credential);
      navigate(getPostLoginPath(res.user, location), { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.code === 'ECONNABORTED' || !err.response
          ? 'Server is not responding. Try again in a moment.'
          : 'Google sign-in failed. Please try again.');
      setError(msg);
    } finally {
      setGoogleSubmitting(false);
    }
  }, [googleSubmitting, submitting, loginWithGoogle, navigate, location]);

  const authBusy = submitting || googleSubmitting;

  return (
    <div id="page-login" className="page">
      <div className="login-card">
        <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="logo" style={{ display: 'inline-flex', alignItems: 'center' }}>
            <img src={LOGO_URL} alt="Crown Hadi EV Center" style={{ height: '80px', width: 'auto', objectFit: 'contain' }} />
          </div>
          <button
            onClick={() => navigate('/')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(0,0,0,0.05)',
              color: 'var(--white2)', borderRadius: '8px', padding: '7px 14px',
              fontSize: '12px', cursor: 'pointer', letterSpacing: '0.05em',
              fontWeight: 600, transition: 'all .2s'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          >
            ← Home
          </button>
        </div>
        <h2 className="text-5xl font-family-bebas mb-2 tracking-tighter uppercase text-orange-600">Welcome Back.</h2>
        <p className="text-sm text-[#BDBDB8] mb-8">Sign in to your Crown Eve portal to manage your hub.</p>

        {inactivityMsg && (
          <div className="form-info" style={{
            background: 'rgba(232,71,10,0.08)',
            border: '1px solid rgba(232,71,10,0.3)',
            color: '#E8470A',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '13px',
            marginBottom: '16px'
          }}>
            {inactivityMsg}
          </div>
        )}

        {error && (
          <div className="auth-error-banner" role="alert">
            {error}
          </div>
        )}

        <GoogleAuthSection
          mode="signin"
          onSuccess={handleGoogleSuccess}
          onError={(msg) => setError(msg)}
          disabled={authBusy}
        />
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              placeholder="ali@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label>Password</label>
              <Link to="/forgot" className="form-link" style={{ fontSize: '12px' }}>Forgot password?</Link>
            </div>
            <PasswordInput
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="form-submit" disabled={authBusy}>
            {submitting ? 'Signing in…' : 'Sign In To Portal →'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--white2)', marginTop: '24px' }}>
          Don't have an account? <Link to="/register" className="form-link">Register</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
