// frontend/src/components/layout/Navbar.jsx
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LOGO_URL } from '../../constants/mediaAssets';

const Navbar = ({ user: propsUser, logout: propsLogout }) => {
  const { user: authUser, logout: authLogout, loading: authLoading } = useAuth();

  // Use props if available, otherwise fallback to context
  const user = propsUser !== undefined ? propsUser : authUser;
  const sessionActive =
    user ||
    (authLoading &&
      (localStorage.getItem('crowneve_token') || localStorage.getItem('crowneve_user')));
  const logout = propsLogout || authLogout;
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  const HERO_ROUTES = ['/', '/about', '/contact'];
  const isHeroNav = HERO_ROUTES.includes(location.pathname) && !scrolled;

  // Close menu when location changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  return (
    <nav className={`${scrolled ? 'scrolled' : ''} ${isHeroNav ? 'transparent' : ''} ${menuOpen ? 'menu-open' : ''}`}>
      <Link to="/" className="logo" style={{ display: 'flex', alignItems: 'center' }}>
        <img src={LOGO_URL} alt="Crown Hadi EV Center" style={{ height: 'var(--logo-size, 90px)', width: 'auto', objectFit: 'contain', display: 'block' }} />
      </Link>

      <ul className={`nav-links ${menuOpen ? 'active' : ''}`}>
        <li><Link to="/">Home</Link></li>
        <li className="dropdown-parent">
          <Link to={user?.role === 'CUSTOMER' ? '/my/shop' : '/shop'}>Products <span className="dropdown-arrow">▾</span></Link>
          <ul className="dropdown-menu-ultra">
            <li><Link to={user?.role === 'CUSTOMER' ? '/my/shop?type=bike' : '/shop?type=bike'}>Bikes</Link></li>
            <li><Link to={user?.role === 'CUSTOMER' ? '/my/shop?type=part' : '/shop?type=part'}>Spare Parts</Link></li>
          </ul>
        </li>
        <li><Link to="/#services">Services</Link></li>
        <li><Link to="/about">About</Link></li>
        {user && <li><Link to={user.role === 'CUSTOMER' ? '/my/book-service' : '/appointments'}>Book Service</Link></li>}
        <li><Link to="/contact">Contact</Link></li>
        {/* On mobile, show auth links inside menu if not in header */}
        <li className="mobile-auth-links">
          {!sessionActive && (
            <div className="flex flex-col gap-4 mt-8">
              <Link to="/login" className="btn-nav-login w-full text-center">Login</Link>
              <Link to="/register" className="btn-nav-register w-full text-center">Register</Link>
            </div>
          )}
        </li>
      </ul>

      <div className="nav-actions">
        {sessionActive ? (
          <div className="flex items-center gap-4">
            <div className="text-right mr-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-orange-500">{user?.name || 'User'}</div>
              <div className="text-[8px] text-gray-400 uppercase tracking-widest">{user?.role?.replace('_', ' ') || 'Signed in'}</div>
            </div>
            {user?.role === 'COMPANY_OWNER' && (
              <Link to="/owner/dashboard" className="btn-nav-register px-4 py-2">Dashboard</Link>
            )}
            {user?.role === 'BRANCH_OWNER' && (
              <Link to="/branch/dashboard" className="btn-nav-register px-4 py-2">Dashboard</Link>
            )}
            {user?.role === 'CUSTOMER' && (
              <Link to="/my/dashboard" className="btn-nav-register px-4 py-2">My Dashboard</Link>
            )}
            {['EMPLOYEE', 'TECHNICIAN'].includes(user?.role) && (
              <Link to="/emp/dashboard" className="btn-nav-register px-4 py-2">Terminal</Link>
            )}
            <button
              onClick={logout}
              className="btn-nav-login"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="header-auth-desktop">
            <Link to="/login" className="btn-nav-login">Login</Link>
            <Link to="/register" className="btn-nav-register">Register</Link>
          </div>
        )}

        <Link
          to={user?.role === 'CUSTOMER' ? '/my/cart' : '/cart'}
          aria-label="Cart"
          style={{ display: 'flex', alignItems: 'center', color: 'inherit', marginRight: 8 }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
        </Link>

        {/* HAMBURGER */}
        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          <div className={`bar ${menuOpen ? 'open' : ''}`}></div>
          <div className={`bar ${menuOpen ? 'open' : ''}`}></div>
          <div className={`bar ${menuOpen ? 'open' : ''}`}></div>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
