// frontend/src/pages/auth/VerifyOtp.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const VerifyOtp = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  const navigate = useNavigate();
  const { login } = useAuth(); // If AuthContext has a way to manually set user/token, but api response gives token, we can just save it.

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const validateOtp = () => {
    const digits = String(otp || '').trim();
    if (!/^\d{6}$/.test(digits)) {
      setError('OTP is required. Enter the 6-digit code from your email.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateOtp()) return;
    setLoading(true);

    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      
      // Manually store token since we bypassed standard login function
      const { token, user } = response.data;
      localStorage.setItem('crowneve_token', token);
      localStorage.setItem('crowneve_user', JSON.stringify(user));
      localStorage.setItem('crowneve_last_active', Date.now().toString());

      // Force page reload to ensure AuthContext picks up the new token
      window.location.href = '/my/dashboard';
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setError('');
    setSuccess('');

    try {
      await api.post('/auth/resend-otp', { email });
      setTimer(60);
      setCanResend(false);
      setSuccess('A new OTP has been sent to your email.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend OTP.';
      setError(msg);
      if (err.response?.status === 429) setCanResend(true);
    }
  };

  return (
    <div id="page-verify" className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <div className="register-card" style={{ textAlign: 'center', padding: '40px', maxWidth: '400px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h2 className="text-3xl font-family-bebas mb-2 tracking-tighter uppercase text-black">Verify Email</h2>
        <p className="text-sm text-muted mb-6">
          We sent a 6-digit code to <strong>{email}</strong>
        </p>

        {error && <div className="form-error" role="alert">{error}</div>}
        {success && <div className="auth-success-banner" role="status">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label htmlFor="verify-otp" className="sr-only">6-digit OTP</label>
            <input
              id="verify-otp"
              name="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                if (error) setError('');
              }}
              style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '20px', fontWeight: 'bold' }}
              aria-invalid={error ? 'true' : 'false'}
            />
          </div>
          <button type="submit" className="form-submit" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify & Log In'}
          </button>
        </form>

        <div style={{ marginTop: '24px', fontSize: '14px', color: '#666' }}>
          Didn't receive the code? <br />
          <button 
            onClick={handleResend} 
            disabled={!canResend}
            style={{ 
              background: 'none', border: 'none', color: canResend ? '#ff4500' : '#ccc', 
              cursor: canResend ? 'pointer' : 'not-allowed', marginTop: '8px', fontWeight: 'bold' 
            }}
          >
            {canResend ? 'Resend OTP' : `Resend in ${timer}s`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
