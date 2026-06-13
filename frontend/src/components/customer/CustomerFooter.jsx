import React from 'react';
import { Link } from 'react-router-dom';
import { LOGO_URL } from '../../constants/mediaAssets';

const FOOTER_LINKS = [
  {
    title: 'Portal',
    links: [
      { to: '/my/dashboard', label: 'Dashboard' },
      { to: '/my/shop', label: 'Shop Bikes' },
      { to: '/my/shop?type=part', label: 'Parts' },
      { to: '/my/book-service', label: 'Book Service' },
    ],
  },
  {
    title: 'Account',
    links: [
      { to: '/my/orders', label: 'My Orders' },
      { to: '/my/bookings', label: 'My Bookings' },
      { to: '/my/cart', label: 'Cart' },
      { to: '/my/profile', label: 'Profile' },
    ],
  },
  {
    title: 'Help',
    links: [
      { to: '/', label: 'Public Site' },
      { to: '/contact', label: 'Contact' },
      { to: '/terms', label: 'Terms' },
      { to: '/privacy', label: 'Privacy' },
    ],
  },
];

const CustomerFooter = () => (
  <footer className="ce-footer" aria-label="Site footer">
    <div className="ce-footer-glow" aria-hidden />
    <div className="ce-footer-inner">
      <div className="ce-footer-top">
        <div className="ce-footer-brand">
          <Link to="/my/dashboard" className="ce-footer-logo">
            <img src={LOGO_URL} alt="Crown Eve Center" />
          </Link>
          <p className="ce-footer-tagline">Premium Electric Mobility</p>
          <p className="ce-footer-desc">
            Pakistan&apos;s premium mobility destination. Browse electric bikes, book services,
            and track your orders — all from your customer portal.
          </p>
          <div className="ce-footer-socials">
            <a href="https://web.facebook.com/hadievcenter/?_rdc=1&_rdr" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
            </a>
            <a href="https://www.instagram.com/hadievcenter?hl=af" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
            </a>
            <a href="https://wa.me/923219240325" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" /></svg>
            </a>
          </div>
        </div>

        {FOOTER_LINKS.map(({ title, links }) => (
          <div className="ce-footer-col" key={title}>
            <h4>
              <span className="ce-footer-col-dot" aria-hidden />
              {title}
            </h4>
            <ul>
              {links.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to}>{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="ce-footer-bottom">
        <p>© {new Date().getFullYear()} <span>Crown Eve Bikes</span>. All rights reserved.</p>
        <p className="ce-footer-hours">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="ce-footer-hours-text">
            <span>Main Branch — Chishtian, Pakistan</span>
            <span>Open Daily 10AM – 8PM</span>
          </span>
        </p>
      </div>
    </div>
  </footer>
);

export default CustomerFooter;
