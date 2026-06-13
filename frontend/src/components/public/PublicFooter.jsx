import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LOGO_URL } from '../../constants/mediaAssets';

const PublicFooter = () => {
  const { user } = useAuth();

  return (
    <footer>
      <div className="footer-top">
        <div className="footer-brand">
          <Link to="/" className="logo" style={{ display: 'flex', alignItems: 'center' }}>
            <img src={LOGO_URL} alt="Crown Eve Center" style={{ height: '90px', width: 'auto', objectFit: 'contain' }} />
          </Link>
          <p>
            Pakistan&apos;s premium mobility destination with multiple branches. Premium EV bikes,
            long-range batteries, high-performance motors, and expert service — all in one place.
          </p>
          <div className="footer-socials">
            <a href="https://web.facebook.com/hadievcenter/?_rdc=1&_rdr" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
            </a>
            <a href="https://www.instagram.com/hadievcenter?hl=af" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
            </a>
            <a href="https://wa.me/923219240325" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="WhatsApp">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
              </svg>
            </a>
          </div>
        </div>
        <div className="footer-col">
          <h4>Explore</h4>
          <ul>
            <li><Link to={user?.role === 'CUSTOMER' ? '/my/shop' : '/shop'}>Shop Bikes</Link></li>
            <li><Link to={user?.role === 'CUSTOMER' ? '/my/shop?type=part' : '/shop?type=part'}>Parts Catalog</Link></li>
            {user && <li><Link to={user.role === 'CUSTOMER' ? '/my/book-service' : '/appointments'}>Book Service</Link></li>}
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Account</h4>
          <ul>
            <li><Link to="/login">Sign In</Link></li>
            <li><Link to="/register">Register</Link></li>
            {user && (
              <>
                {user.role === 'CUSTOMER' && (
                  <li><Link to="/my/dashboard">My Dashboard</Link></li>
                )}
                <li><Link to="/my/orders">My Orders</Link></li>
                <li><Link to="/my/bookings">My Bookings</Link></li>
              </>
            )}
          </ul>
        </div>
        <div className="footer-col">
          <h4>Legal</h4>
          <ul>
            <li><Link to="/terms">Terms of Service</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/contact">Get Help</Link></li>
            <li><Link to="/contact">Warranty &amp; Returns</Link></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} <span>Crown Eve Bikes</span>. All rights reserved.</p>
        <p style={{ fontSize: '11px', color: 'var(--muted)' }}>Main Branch — Chishtian, Pakistan · Open Daily 10AM – 8PM</p>
      </div>
    </footer>
  );
};

export default PublicFooter;
