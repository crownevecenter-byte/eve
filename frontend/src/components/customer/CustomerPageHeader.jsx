import React from 'react';

const CustomerPageHeader = ({ eyebrow, title, subtitle, actions }) => (
  <div className="customer-page-header">
    <div className="customer-page-header-main">
      {eyebrow && <span className="customer-page-eyebrow">{eyebrow}</span>}
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
    {actions && <div className="customer-page-header-actions">{actions}</div>}
  </div>
);

export default CustomerPageHeader;
