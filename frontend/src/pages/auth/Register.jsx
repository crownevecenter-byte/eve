// frontend/src/pages/auth/Register.jsx
import React, { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LOGO_URL } from '../../constants/mediaAssets';
import { PAKISTAN_CITIES } from '../../constants/pakistanCities';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import GoogleAuthSection from '../../components/auth/GoogleAuthSection';
import { getPostLoginPath } from '../../utils/authRedirect';
import { useRedirectIfAuthenticated } from '../../hooks/useRedirectIfAuthenticated';
import PasswordStrength, { validatePassword, validatePhone } from '../../components/PasswordStrength';
import PasswordInput from '../../components/auth/PasswordInput';
import './Auth.css';

const Register = () => {
  useRedirectIfAuthenticated();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    city: ''
  });
  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const navigate = useNavigate();
  const { loginWithGoogle, user, loading: authLoading } = useAuth();

  if (authLoading || user) {
    return (
      <div id="page-register" className="page">
        <div className="register-card" style={{ display: 'flex', justifyContent: 'center', padding: '64px 32px' }}>
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
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    const pwdErr = validatePassword(formData.password);
    if (pwdErr) { setError(pwdErr); return; }
    const phoneErr = validatePhone(formData.phone);
    if (phoneErr) { setError(phoneErr); return; }
    if (submitting) return;
    setSubmitting(true);
    try {
      await api.post('/auth/register', {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        city: formData.city,
        role: 'CUSTOMER'
      });
      navigate(`/verify-otp?email=${encodeURIComponent(formData.email)}`);
    } catch (err) {
      const msg =
        err.code === 'ECONNABORTED'
          ? 'Server is slow or unreachable. Try again in a moment.'
          : err.response?.data?.message || 'Registration failed';
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
      navigate(getPostLoginPath(res.user), { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (err.code === 'ECONNABORTED' || !err.response
            ? 'Server is not responding. Try again in a moment.'
            : 'Google sign-up failed. Please try again.')
      );
    } finally {
      setGoogleSubmitting(false);
    }
  }, [googleSubmitting, submitting, loginWithGoogle, navigate]);

  const authBusy = submitting || googleSubmitting;

  return (
    <div id="page-register" className="page">
      <div className="register-card">
        <Link to="/" className="auth-logo">
          <img src={LOGO_URL} alt="Crown Hadi EV Center" />
        </Link>
        <h2 className="text-5xl font-family-bebas mb-2 tracking-tighter uppercase">Create Account.</h2>
        <p className="auth-subtext text-sm mb-8">Join Crown Eve — browse bikes, book services, track your orders.</p>
        
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}

        <GoogleAuthSection
          mode="signup"
          onSuccess={handleGoogleSuccess}
          onError={(msg) => setError(msg)}
          disabled={authBusy}
        />

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="auth-label">First Name</label>
            <div className="auth-field">
              <svg className="auth-field-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
              <input
                className="auth-input"
                type="text"
                placeholder="Ali"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label className="auth-label">Last Name</label>
            <div className="auth-field">
              <svg className="auth-field-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
              <input
                className="auth-input"
                type="text"
                placeholder="Khan"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label className="auth-label">Email Address</label>
            <div className="auth-field">
              <svg className="auth-field-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5L4 8V6l8 5 8-5v2z" />
              </svg>
              <input
                className="auth-input"
                type="email"
                placeholder="ali@email.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label className="auth-label">Phone Number</label>
            <div className="auth-field">
              <svg className="auth-field-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.1 21 3 13.9 3 5c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
              </svg>
              <input
                className="auth-input"
                type="tel"
                placeholder="+92 300 0000000"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                onBlur={e => setPhoneError(validatePhone(e.target.value) || '')}
                required
              />
            </div>
            {phoneError && <p style={{color:'#ef4444',fontSize:11,marginTop:4}}>{phoneError}</p>}
          </div>
          <div className="form-group">
            <label className="auth-label">Password</label>
            <PasswordInput
              variant="field"
              placeholder="Min 8 chars, upper, lower, number"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              minLength={8}
              required
            />
            <PasswordStrength password={formData.password} />
          </div>
          <div className="form-group">
            <label className="auth-label">Confirm Password</label>
            <PasswordInput
              variant="field"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label className="auth-label" htmlFor="register-city">City</label>
            <div className="auth-field">
              <svg className="auth-field-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z" />
              </svg>
              <input
                className="auth-input"
                id="register-city"
                type="text"
                list="pakistan-cities"
                placeholder="Type or select your city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                autoComplete="address-level2"
                required
              />
            </div>
            <datalist id="pakistan-cities">
              {PAKISTAN_CITIES.map((city) => (
                <option key={city} value={city} />
              ))}
            </datalist>
          </div>
          <div className="auth-terms-row">
            <input type="checkbox" id="terms" required />
            <label htmlFor="terms">
              I agree to the <Link to="/terms" className="form-link">Terms of Service</Link> and <Link to="/privacy" className="form-link">Privacy Policy</Link>
            </label>
          </div>
          <button type="submit" className="form-submit auth-btn-primary" disabled={authBusy}>
            {submitting ? 'Creating account…' : 'Create My Account →'}
          </button>
        </form>

        <div className="auth-footer-text" style={{ marginTop: '24px' }}>
          Already have an account? <Link to="/login" className="form-link">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
