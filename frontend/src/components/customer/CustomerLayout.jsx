// frontend/src/components/customer/CustomerLayout.jsx
import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import PageSuspense from '../PageSuspense';
import CustomerFooter from './CustomerFooter';
import { LOGO_URL } from '../../constants/mediaAssets';
import '../../styles/customer.css';
import '../../styles/customer-ui.css';
import '../../styles/customer-neu-cards.css';

const NAV_LINKS = [
  { label: 'Dashboard', to: '/my/dashboard', match: (p) => p === '/my/dashboard' },
  { label: 'Shop', to: '/my/shop', match: (p) => p.startsWith('/my/shop') || p.startsWith('/my/product') },
  { label: 'Orders', to: '/my/orders', match: (p) => p.startsWith('/my/orders') || p.startsWith('/my/track/') || p.startsWith('/track/') },
  { label: 'Bookings', to: '/my/bookings', match: (p) => p.startsWith('/my/bookings') },
  { label: 'Book Service', to: '/my/book-service', match: (p) => p.startsWith('/my/book-service') || p.startsWith('/appointments') },
];

const linkClass = (match, isActive) => `cnl-pill${match || isActive ? ' active' : ''}`;

const PillArrow = () => (
  <svg
    className="cnl-pill-arrow"
    viewBox="0 0 16 19"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M7 18C7 18.5523 7.44772 19 8 19C8.55228 19 9 18.5523 9 18H7ZM8.70711 0.292893C8.31658 -0.0976311 7.68342 -0.0976311 7.29289 0.292893L0.928932 6.65685C0.538408 7.04738 0.538408 7.68054 0.928932 8.07107C1.31946 8.46159 1.95262 8.46159 2.34315 8.07107L8 2.41421L13.6569 8.07107C14.0474 8.46159 14.6805 8.46159 15.0711 8.07107C15.4616 7.68054 15.4616 7.04738 15.0711 6.65685L8.70711 0.292893ZM9 18L9 1H7L7 18H9Z"
      className="cnl-pill-arrow-path"
    />
  </svg>
);

const CustomerLayout = () => {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div id="customer-dashboard-shell">
      <header className="cnav scrolled">
        <button
          type="button"
          className={`cnl-pill cnav-menu-btn${menuOpen ? ' open' : ''}`}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span>{menuOpen ? 'Close' : 'Menu'}</span>
          <PillArrow />
        </button>

        <NavLink to="/my/dashboard" className="cnav-logo logo" onClick={closeMenu}>
          <img
            src={LOGO_URL}
            alt="Crown Eve Center"
            className="cnav-logo-img"
          />
        </NavLink>

        <div className="cnav-links--desktop" role="navigation" aria-label="Customer navigation">
          <ul className="cnav-nav-list">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) => `${linkClass(link.match(location.pathname), isActive)} cnl-pill--compact`}
                >
                  <span>{link.label}</span>
                  <PillArrow />
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <div className="cnav-actions">
          <NavLink to="/my/cart" className="cnav-cart-link" aria-label="Cart" title="Cart">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            {count > 0 && <span className="cnav-cart-badge">{count}</span>}
          </NavLink>

          <button type="button" className="cnav-profile-btn" onClick={() => navigate('/my/profile')}>
            <span className="cnav-user-name">{user?.name?.split(' ')[0] || 'Account'}</span>
            <span className="cnav-user-role">Customer</span>
          </button>

          <button type="button" className="cnl-pill cnl-pill--compact btn-nav-login" onClick={logout}>
            <span>Logout</span>
            <PillArrow />
          </button>
        </div>
      </header>

      <aside
        className={`cnav-drawer${menuOpen ? ' open' : ''}`}
        aria-hidden={!menuOpen}
        aria-label="Mobile navigation"
      >
        <div className="cnav-drawer-head">
          <img src={LOGO_URL} alt="Crown Eve Center" className="cnav-drawer-logo" />
          <button type="button" className="cnav-drawer-close" aria-label="Close menu" onClick={closeMenu}>
            ✕
          </button>
        </div>

        <div className="cnav-drawer-nav" role="navigation" aria-label="Mobile menu links">
          <p className="cnav-drawer-label">Navigation</p>
          {NAV_LINKS.map((link) => (
            <NavLink
              key={`drawer-${link.to}`}
              to={link.to}
              className={({ isActive }) => `${linkClass(link.match(location.pathname), isActive)} cnl-pill--block`}
              onClick={closeMenu}
            >
              <span>{link.label}</span>
              <PillArrow />
            </NavLink>
          ))}

          <p className="cnav-drawer-label">Account</p>
          <NavLink
            to="/my/cart"
            className={({ isActive }) => `${linkClass(location.pathname.startsWith('/my/cart'), isActive)} cnl-pill--block`}
            onClick={closeMenu}
          >
            <span>Cart {count > 0 ? `(${count})` : ''}</span>
            <PillArrow />
          </NavLink>
          <NavLink
            to="/my/profile"
            className={({ isActive }) => `${linkClass(location.pathname.startsWith('/my/profile'), isActive)} cnl-pill--block`}
            onClick={closeMenu}
          >
            <span>Profile</span>
            <PillArrow />
          </NavLink>
          <button
            type="button"
            className="cnl-pill cnl-pill--block cnl-logout-mobile"
            onClick={() => { closeMenu(); logout(); }}
          >
            <span>Logout</span>
            <PillArrow />
          </button>
        </div>
      </aside>

      {menuOpen && (
        <button type="button" className="cnav-overlay" aria-label="Close menu" onClick={closeMenu} />
      )}

      <main className="main-wrap">
        <div className="page-wrap">
          <PageSuspense>
            <Outlet />
          </PageSuspense>
        </div>
      </main>

      <CustomerFooter />
    </div>
  );
};

export default CustomerLayout;
