// frontend/src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useRef, useContext } from 'react';
import api from '../services/api';
import { normalizeRole } from '../constants/roles';

const AuthContext = createContext();

const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes idle → logout
const TOKEN_REFRESH_INTERVAL = 20 * 60 * 1000; // refresh JWT every 20 min while active
const ACTIVITY_EVENTS  = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
const LAST_ACTIVE_KEY  = 'crowneve_last_active';
const TOKEN_KEY        = 'crowneve_token';
const USER_KEY         = 'crowneve_user';

const migrateLegacySessionKeys = () => {
  const legacyToken = localStorage.getItem('token');
  const legacyUser = localStorage.getItem('user');
  if (legacyToken && !localStorage.getItem(TOKEN_KEY)) {
    localStorage.setItem(TOKEN_KEY, legacyToken);
    localStorage.removeItem('token');
  }
  if (legacyUser && !localStorage.getItem(USER_KEY)) {
    localStorage.setItem(USER_KEY, legacyUser);
    localStorage.removeItem('user');
  }
};

const hasStoredSession = () => {
  migrateLegacySessionKeys();
  return !!(localStorage.getItem(TOKEN_KEY) || localStorage.getItem(USER_KEY));
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    migrateLegacySessionKeys();
    try {
      const cached = JSON.parse(localStorage.getItem(USER_KEY) || 'null');
      return cached ? { ...cached, role: normalizeRole(cached.role) } : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(hasStoredSession);
  const inactivityTimer = useRef(null);
  const lastTokenRefresh = useRef(0);

  const maybeRefreshToken = () => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    const now = Date.now();
    if (now - lastTokenRefresh.current < TOKEN_REFRESH_INTERVAL) return;
    lastTokenRefresh.current = now;
    api.post('/auth/refresh')
      .then((res) => {
        if (res.data?.token) {
          localStorage.setItem(TOKEN_KEY, res.data.token);
        }
      })
      .catch(() => {});
  };

  // ── Inactivity logout + sliding JWT refresh while active ───
  const resetInactivityTimer = () => {
    localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
    clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      performLogout(true);
    }, INACTIVITY_LIMIT);
    maybeRefreshToken();
  };

  const performLogout = async (dueToInactivity = false) => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(LAST_ACTIVE_KEY);
    sessionStorage.clear();
    setUser(null);
    clearTimeout(inactivityTimer.current);
    window.location.href = dueToInactivity ? '/login?reason=inactivity' : '/';
  };

  // ── On mount: check auth + start inactivity tracking ──────
  useEffect(() => {
    const checkAuth = async () => {
      migrateLegacySessionKeys();
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        // Check if already inactive before even hitting API
        const lastActive = parseInt(localStorage.getItem(LAST_ACTIVE_KEY) || '0');
        if (lastActive && Date.now() - lastActive > INACTIVITY_LIMIT) {
          await performLogout(true);
          return;
        }
        try {
          const res = await api.get('/auth/me');
          const nextUser = { ...res.data.user, role: normalizeRole(res.data.user.role) };
          setUser(nextUser);
          localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
          lastTokenRefresh.current = Date.now();
        } catch (err) {
          const status = err.response?.status;
          if (status === 401) {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            setUser(null);
          }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  // ── Attach activity listeners when user is logged in ──────
  useEffect(() => {
    if (!user) {
      clearTimeout(inactivityTimer.current);
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, resetInactivityTimer));
      return;
    }
    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, resetInactivityTimer, { passive: true }));
    resetInactivityTimer();
    return () => {
      clearTimeout(inactivityTimer.current);
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, resetInactivityTimer));
    };
  }, [user]);

  // ── Cross-tab sync via localStorage events ─────────────────
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === TOKEN_KEY && !e.newValue) {
        setUser(null);
        sessionStorage.clear();
        const authPage = ['/login', '/register'].includes(window.location.pathname);
        if (!authPage) window.location.href = '/';
        return;
      }
      if (e.key === TOKEN_KEY && e.newValue) {
        lastTokenRefresh.current = Date.now();
      }
      if (e.key === USER_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setUser({ ...parsed, role: normalizeRole(parsed.role) });
          resetInactivityTimer();
        } catch {}
        return;
      }
      if (e.key === USER_KEY && !e.newValue) {
        setUser(null);
      }
      if (e.key === LAST_ACTIVE_KEY && e.newValue) {
        clearTimeout(inactivityTimer.current);
        const elapsed = Date.now() - parseInt(e.newValue, 10);
        const remaining = Math.max(INACTIVITY_LIMIT - elapsed, 0);
        inactivityTimer.current = setTimeout(() => performLogout(true), remaining);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // ── Auth actions ───────────────────────────────────────────
  const persistSession = (data) => {
    const nextUser = { ...data.user, role: normalizeRole(data.user.role) };
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
    lastTokenRefresh.current = Date.now();
    setUser(nextUser);
    return { ...data, user: nextUser };
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return persistSession(res.data);
  };

  const loginWithGoogle = async (credential) => {
    const res = await api.post('/auth/google', { credential });
    return persistSession(res.data);
  };

  const logout = () => performLogout(false);

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
