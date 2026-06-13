// frontend/src/components/customer/CustomerShared.jsx
import React, { useState, useEffect, useCallback } from "react";
import { getApiUrl } from "../../utils/apiUrl";

/**
 * CORE API UTILITY
 * Handles authenticated requests to the backend.
 */
export const api = async (endpoint, options = {}) => {
  const token = localStorage.getItem("crowneve_token");
  const baseUrl = getApiUrl();
  
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${baseUrl}${endpoint}`, { ...options, headers });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Network request failed");
  }
  return data;
};

/**
 * DATA FETCHING HOOK
 */
export const useFetch = (endpoint) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api(endpoint);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

export const STATUS_TIMELINE = {
  PENDING:    [{ label: "Order Placed", done: true  }, { label: "Being Prepared", done: false }, { label: "Out for Delivery", done: false }, { label: "Delivered", done: false }],
  PROCESSING: [{ label: "Order Placed", done: true  }, { label: "Being Prepared", done: true, active: true }, { label: "Out for Delivery", done: false }, { label: "Delivered", done: false }],
  COMPLETED:  [{ label: "Order Placed", done: true  }, { label: "Being Prepared", done: true  }, { label: "Out for Delivery", done: true  }, { label: "Delivered", done: true  }],
  CANCELLED:  [{ label: "Order Placed", done: true  }, { label: "Cancelled", done: true }],
};

export const STATUS_BADGE = {
  PENDING:    { label: "Pending",    cls: "bg-y" },
  PROCESSING: { label: "Processing", cls: "bg-b" },
  COMPLETED:  { label: "Delivered",  cls: "bg-g" },
  CANCELLED:  { label: "Cancelled",  cls: "bg-r" },
};

/**
 * UI COMPONENTS
 */
export const Badge = ({ status }) => {
  const map = { 
    Completed: "bg-g", 
    Processing: "bg-b", 
    Pending: "bg-a", 
    Cancelled: "bg-r", 
    Upcoming: "bg-o", 
    "In Stock": "bg-g", 
    "Low Stock": "bg-a", 
    "New Arrival": "bg-o",
    Active: "bg-g",
    Delivered: "bg-g"
  };
  return <span className={`badge ${map[status] || "bg-gray"}`}>{status}</span>;
};

export const Modal = ({ title, onClose, children, footer }) => (
  <div className="mov" onClick={(e) => e.target === e.currentTarget && onClose()}>
    <div className="modal">
      <div className="modal-bar" />
      <div className="mhd">
        <div className="mt">{title}</div>
        <button className="mx" onClick={onClose}>✕</button>
      </div>
      <div className="mbd">
        {children}
        {footer && <div className="modal-footer" style={{ marginTop: 24, display: "flex", gap: 8, justifyContent: "flex-end" }}>{footer}</div>}
      </div>
    </div>
  </div>
);

export const Icon = ({ name, size = 18, className = "" }) => {
  // Simple mapping for common icons using emojis/unicode for the premium look
  const icons = {
    cart: "🛒",
    order: "📦",
    booking: "📅",
    service: "🔧",
    profile: "👤",
    home: "🏠",
    shop: "🛍️",
    track: "📍",
    plus: "＋",
    minus: "－",
    check: "✓",
    cross: "✕",
    search: "⌕",
    chevron: "›",
    star: "⭐",
    trash: "🗑️",
    edit: "✎",
    logout: "➔",
    bike: "🏍️",
    settings: "⚙️"
  };
  return (
    <span className={`icon-wrap ${className}`} style={{ fontSize: size, display: 'inline-flex', alignItems: 'center' }}>
      {icons[name] || "•"}
    </span>
  );
};

export const Sk = ({ h, w = '100%', r = 8 }) => (
  <div className="skeleton" style={{ height: h, width: w, borderRadius: r, background: 'rgba(0,0,0,0.03)', animation: 'pulse 1.5s infinite ease-in-out' }} />
);

export const toast = (msg, type = "success") => {
  // Basic console toast for now, can be upgraded to a real toast system
  console.log(`[${type.toUpperCase()}] ${msg}`);
  alert(msg);
};
