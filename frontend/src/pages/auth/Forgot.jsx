// frontend/src/pages/auth/Forgot.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import PasswordStrength, { validatePassword } from '../../components/PasswordStrength';
import PasswordInput from '../../components/auth/PasswordInput';
import './Auth.css';

const isValidOtp = (value) => /^\d{6}$/.test(String(value || '').trim());

const Forgot = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otpError, setOtpError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setStep(2);
      setOtp('');
      setOtpError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const validateOtpField = () => {
    if (!isValidOtp(otp)) {
      setOtpError('OTP is required. Enter the 6-digit code from your email.');
      return false;
    }
    setOtpError('');
    return true;
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!validateOtpField()) return;
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    const pwdErr = validatePassword(newPassword);
    if (pwdErr) { setError(pwdErr); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email,
        otp: otp.trim(),
        newPassword,
      });
      setSuccess('Password updated successfully. Redirecting to login…');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="page-forgot" className="page">
      <div className="login-card">
        <Link
          to="/login"
          className="auth-forgot-link button3"
          style={{ display: 'inline-block', marginBottom: '24px' }}
        >
          ← Back to Login
        </Link>

        <h2 className="text-5xl font-family-bebas mb-2 tracking-tighter uppercase">
          Reset Password
        </h2>
        <p className="auth-subtext text-sm mb-8">
          {step === 1
            ? 'Enter your email — we will send a 6-digit OTP.'
            : `Enter the OTP sent to ${email} and your new password.`}
        </p>

        {error && <div className="form-error" role="alert">{error}</div>}
        {success && <div className="auth-success-banner" role="status">{success}</div>}

        {step === 1 ? (
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <label className="auth-label" htmlFor="forgot-email">Email Address</label>
              <div className="auth-field">
                <svg className="auth-field-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5L4 8V6l8 5 8-5v2z" />
                </svg>
                <input
                  className="auth-input"
                  id="forgot-email"
                  name="email"
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <button type="submit" className="form-submit auth-btn-primary" disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP →'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} noValidate>
            <div className="form-group">
              <label className="auth-label" htmlFor="forgot-otp">6-digit OTP</label>
              <div className="auth-field">
                <svg className="auth-field-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 1L3 5v6c0 5.6 3.8 10.7 9 12 5.2-1.3 9-6.4 9-12V5l-9-4zm0 10.9A2.9 2.9 0 1114.9 9 2.9 2.9 0 0112 11.9z" />
                </svg>
                <input
                  className="auth-input"
                  id="forgot-otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                    if (otpError) setOtpError('');
                  }}
                  onBlur={validateOtpField}
                  style={{
                    textAlign: 'center',
                    letterSpacing: '4px',
                    fontWeight: 'bold',
                    borderColor: otpError ? '#ef4444' : undefined,
                  }}
                  aria-invalid={otpError ? 'true' : 'false'}
                  aria-describedby={otpError ? 'forgot-otp-error' : undefined}
                />
              </div>
              {otpError && (
                <p id="forgot-otp-error" className="auth-field-error">
                  {otpError}
                </p>
              )}
            </div>
            <div className="form-group">
              <label className="auth-label" htmlFor="forgot-new-password">New Password</label>
              <PasswordInput
                variant="field"
                id="forgot-new-password"
                name="newPassword"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                required
              />
              <PasswordStrength password={newPassword} />
            </div>
            <div className="form-group">
              <label className="auth-label" htmlFor="forgot-confirm-password">Confirm Password</label>
              <PasswordInput
                variant="field"
                id="forgot-confirm-password"
                name="confirmPassword"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            <button
              type="submit"
              className="form-submit auth-btn-primary"
              disabled={loading}
              onClick={(e) => {
                if (!validateOtpField()) {
                  e.preventDefault();
                }
              }}
            >
              {loading ? 'Updating...' : 'Update Password →'}
            </button>
            <button
              type="button"
              className="auth-forgot-link button3"
              style={{ display: 'block', width: '100%', marginTop: '16px' }}
              onClick={() => {
                setStep(1);
                setOtp('');
                setOtpError('');
                setNewPassword('');
                setConfirmPassword('');
                setError('');
              }}
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Forgot;
