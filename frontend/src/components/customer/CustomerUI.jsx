import React from 'react';
import { Loader2 } from 'lucide-react';

export const CustomerLoading = ({ message = 'Loading…' }) => (
  <div className="ce-loading">
    <Loader2 className="ce-loading-spinner" size={32} strokeWidth={2} aria-hidden />
    <p>{message}</p>
  </div>
);

export const CustomerEmpty = ({ icon: Icon, title, description, actionLabel, onAction }) => (
  <div className="ce-empty">
    {Icon && (
      <div className="ce-empty-icon">
        <Icon size={40} strokeWidth={1.5} />
      </div>
    )}
    <h3>{title}</h3>
    {description && <p>{description}</p>}
    {actionLabel && onAction && (
      <button type="button" className="btn btn-primary btn-sm" onClick={onAction}>
        {actionLabel}
      </button>
    )}
  </div>
);

export const CustomerAlert = ({ type = 'info', children }) => (
  <div className={`ce-alert ce-alert--${type}`} role="alert">
    {children}
  </div>
);

export const CustomerMeta = ({ label, value, highlight }) => (
  <div className="ce-meta">
    <span className="ce-meta-label">{label}</span>
    <span className={`ce-meta-value${highlight ? ' ce-meta-value--highlight' : ''}`}>{value}</span>
  </div>
);

export const CustomerCount = ({ count, suffix = 'found' }) => (
  <span className="ce-count">{count} {suffix}</span>
);
