// frontend/src/components/owner/OwnerShared.jsx
import React, { useState, useEffect, useCallback } from "react";
import { getApiUrl } from "../../utils/apiUrl";
import { runQueued } from "../../utils/apiQueue";

// ─── API HELPER & HOOKS ─────────────────────────────────────────────────────
const API_BASE = getApiUrl();
const TOKEN_KEY = "crowneve_token";

export const api = async (path, options = {}) => {
  return runQueued(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    const res = await fetch(`${API_BASE}${path}`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const message =
        res.status === 429
          ? "Server is busy. Please wait a minute and try again."
          : err.message || `HTTP ${res.status}`;
      const error = new Error(message);
      error.status = res.status;
      throw error;
    }
    return res.json();
  });
};

export function useFetch(path, deps = [], disabled = false) {
  const pathKey = path == null ? '' : String(path);
  const depsKey = JSON.stringify(deps);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!disabled);
  const [error, setError] = useState(null);

  const refetch = useCallback(async (showLoading = true) => {
    if (!pathKey || disabled) return;
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const d = await api(pathKey);
      setData(d);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [pathKey, depsKey, disabled]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!disabled) refetch();
  }, [refetch, disabled]);

  return { data, loading, error, refetch };
}

export function useDebounce(val, ms = 400) {
  const [dv, setDv] = useState(val);
  useEffect(() => {
    const t = setTimeout(() => setDv(val), ms);
    return () => clearTimeout(t);
  }, [val, ms]);
  return dv;
}

// ─── ICONS ──────────────────────────────────────────────────────────────────
export const Icon = ({ name, size = 18 }) => {
  const paths = {
    dashboard: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
    branches: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
    parts: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
    users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75 M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0",
    reports: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
    settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
    orders: "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18 M16 10a4 4 0 0 1-8 0",
    purchases: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    plus: "M12 5v14 M5 12h14",
    edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
    trash: "M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
    search: "M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0",
    logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
    menu: "M3 12h18 M3 6h18 M3 18h18",
    close: "M18 6 6 18 M6 6l12 12",
    check: "M20 6 9 17l-5-5",
    download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3",
    trend: "M23 6l-9.5 9.5-5-5L1 18",
    dollar: "M12 1v22 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
    globe: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20 M2 12h20 M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z",
    shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    bell: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0",
    database: "M12 2a9 3 0 1 0 0 6 9 3 0 0 0 0-6 M3 5v6c0 1.66 4.03 3 9 3s9-1.34 9-3V5 M3 11v6c0 1.66 4.03 3 9 3s9-1.34 9-3v-6",
    eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
    refresh: "M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
    alert: "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01",
  };
  const d = paths[name] || paths.dashboard;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {d.split(" M").map((seg, i) => <path key={i} d={(i > 0 ? "M" : "") + seg} />)}
    </svg>
  );
};

// ─── TOAST ───────────────────────────────────────────────────────────────────
let _addToast;
export const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);
  _addToast = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <Icon name={t.type === "error" ? "alert" : "check"} size={16} />
          {t.msg}
        </div>
      ))}
    </div>
  );
};
export const toast = (msg, type) => _addToast?.(msg, type);

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
export const OrderBadge = ({ status }) => {
  const map = { PENDING: "badge-yellow", PROCESSING: "badge-blue", COMPLETED: "badge-green", CANCELLED: "badge-red" };
  return <span className={`badge ${map[status] || "badge-blue"}`}>{status}</span>;
};
export const Modal = ({ title, onClose, children, footer }) => (
  <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
    <div className="modal">
      <div className="modal-header">
        <div className="modal-title">{title}</div>
        <button className="btn-icon" onClick={onClose}><Icon name="close" size={16} /></button>
      </div>
      <div className="modal-body">{children}</div>
      {footer && <div className="modal-footer">{footer}</div>}
    </div>
  </div>
);

export const Sk = ({ w = "100%", h = 16, r = 6, mb = 0 }) => (
  <div className="skeleton" style={{ width: w, height: h, borderRadius: r, marginBottom: mb }} />
);

export const TableSk = ({ rows = 6, cols = 5 }) => (
  <div style={{ padding: "20px" }}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        {Array.from({ length: cols }).map((_, j) => <Sk key={j} h={14} r={4} />)}
      </div>
    ))}
  </div>
);

export const Confirm = ({ msg, onConfirm, onCancel }) => (
  <div className="modal-backdrop" onClick={onCancel}>
    <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
      <div className="modal-header"><div className="modal-title">Confirm</div></div>
      <div className="modal-body">
        <p style={{ color: "var(--muted)", fontSize: 14 }}>{msg}</p>
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
      </div>
    </div>
  </div>
);
