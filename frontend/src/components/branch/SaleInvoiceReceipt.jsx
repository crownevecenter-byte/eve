// Sale invoice — thermal for spare parts, A4 for electric bikes
import React from 'react';
import { X, Printer } from 'lucide-react';
import { BikeSaleInvoiceBody } from './BikeSaleInvoice';

export const normalizeSaleOrder = (order, customerMeta = null) => {
  if (!order) return null;

  const meta = customerMeta || order.customerMeta || {};
  const walkIn = order.walkInCustomer;
  const online = order.customer;

  let name = meta.name;
  let sub = meta.phone || meta.email || meta.sub;
  let tag = meta.label || meta.tag;

  if (!name && walkIn) {
    name = `${walkIn.first_name || ''} ${walkIn.last_name || ''}`.trim();
    sub = walkIn.phone || walkIn.cnic;
    tag = tag || 'Store Sale';
  }

  if (!name && online) {
    name = online.name;
    sub = online.email;
    tag = tag || 'Online Customer';
  }

  if (!name && order.customer_name) {
    name = order.customer_name;
    sub = order.customer_phone;
  }

  if (!tag) {
    tag = order.customerId ? 'Online Customer' : 'Store Sale';
  }

  const paymentStatus =
    order.payment_status === 'PAID' || order.status === 'COMPLETED'
      ? 'PAID / COMPLETED'
      : (order.payment_status || order.status || 'PENDING').toUpperCase();

  return {
    ...order,
    billTo: {
      name: name || 'Customer',
      sub: sub || 'N/A',
      tag,
    },
    paymentStatus,
  };
};

/** True when sale includes electric bike(s) — uses A4 invoice instead of thermal. */
export const isBikeSaleOrder = (order) => {
  if (!order) return false;
  if (order.saleCategory === 'bike') return true;
  if (order.saleCategory === 'part') return false;

  const items = order.items || [];
  return items.some(
    (item) =>
      item.product?.product_type === 'bike' ||
      item.product_type === 'bike'
  );
};

const ThermalDivider = () => <div className="sale-thermal-divider" />;

const ThermalLabel = ({ children }) => (
  <span className="sale-thermal-label">{children}</span>
);

export const SaleInvoiceReceiptBody = ({ order }) => {
  const inv = normalizeSaleOrder(order);
  if (!inv) return null;

  const formattedDate =
    new Date(inv.createdAt).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }) +
    ' ' +
    new Date(inv.createdAt).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div id="printable-invoice" className="sale-thermal-slip">
      <div className="sale-thermal-serration" aria-hidden="true" />

      <div className="sale-thermal-center">
        <div className="sale-thermal-brand">CROWN EVE</div>
        <div className="sale-thermal-brand-sub">Spare Parts · Thermal Receipt</div>
      </div>

      <ThermalDivider />

      <div className="sale-thermal-title">— PARTS INVOICE —</div>

      <div className="sale-thermal-grid">
        <div>
          <ThermalLabel>Invoice No</ThermalLabel>
          <span className="sale-thermal-value sale-thermal-mono">
            #{String(inv.id).padStart(6, '0')}
          </span>
        </div>
        <div>
          <ThermalLabel>Date / Time</ThermalLabel>
          <span className="sale-thermal-value sale-thermal-mono">{formattedDate}</span>
        </div>
        <div>
          <ThermalLabel>Customer</ThermalLabel>
          <span className="sale-thermal-value">{inv.billTo.name}</span>
          <span className="sale-thermal-sub">{inv.billTo.sub}</span>
        </div>
        <div>
          <ThermalLabel>Sale Type</ThermalLabel>
          <span className="sale-thermal-value">{inv.billTo.tag}</span>
        </div>
        <div>
          <ThermalLabel>Payment</ThermalLabel>
          <span className="sale-thermal-value sale-thermal-bold">
            {(inv.payment_method || 'CASH').toUpperCase()}
          </span>
        </div>
        <div>
          <ThermalLabel>Status</ThermalLabel>
          <span className="sale-thermal-value sale-thermal-mono">{inv.paymentStatus}</span>
        </div>
      </div>

      <ThermalDivider />

      <div className="sale-thermal-section-label">Itemized Detail</div>

      <table className="sale-thermal-table">
        <thead>
          <tr>
            <th>Qty</th>
            <th>Item / Description</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {(inv.items || []).map((item, idx) => {
            const lineTotal = Number(item.price) * Number(item.quantity);
            return (
              <tr key={idx}>
                <td className="sale-thermal-qty">{item.quantity}</td>
                <td className="sale-thermal-item">
                  <div className="sale-thermal-item-name">
                    {item.product?.name || item.name || 'Product'}
                  </div>
                  <div className="sale-thermal-item-rate">
                    PKR {Number(item.price).toLocaleString()} / unit
                  </div>
                </td>
                <td className="sale-thermal-line-total">
                  PKR {lineTotal.toLocaleString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="sale-thermal-total-box">
        <div className="sale-thermal-total-row">
          <span>Subtotal</span>
          <span className="sale-thermal-mono">PKR {Number(inv.total).toLocaleString()}</span>
        </div>
        <div className="sale-thermal-total-row sale-thermal-total-row--grand">
          <span>GRAND TOTAL</span>
          <span className="sale-thermal-mono sale-thermal-grand">
            PKR {Number(inv.total).toLocaleString()}
          </span>
        </div>
      </div>

      <ThermalDivider />

      <div className="sale-thermal-footer">
        <div className="sale-thermal-thanks">THANK YOU FOR SHOPPING WITH US!</div>
        <div className="sale-thermal-disclaimer">
          Computer generated receipt · No signature required
        </div>
        <div className="sale-thermal-disclaimer">CROWN EVE WISHES YOU A SAFE DRIVE.</div>
      </div>
    </div>
  );
};

const SaleInvoiceReceipt = ({ order, onClose, branchName, issuedBy }) => {
  if (!order) return null;

  const isBike = isBikeSaleOrder(order);

  return (
    <div
      className="sale-invoice-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
      role="dialog"
      aria-modal="true"
      aria-label={isBike ? 'Bike sale invoice' : 'Parts thermal receipt'}
    >
      <div
        className={`sale-invoice-dialog${isBike ? ' sale-invoice-dialog--a4' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sale-invoice-header">
          <div>
            <div className="sale-invoice-title">Invoice Generated</div>
            <div className="sale-invoice-subtitle">
              {isBike ? 'A4 professional bike invoice · Ready to print' : 'Thermal receipt · Spare parts only'}
            </div>
          </div>
          <button
            type="button"
            className="sale-invoice-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </header>

        <div className={`sale-invoice-body${isBike ? ' sale-invoice-body--a4' : ''}`}>
          {isBike ? (
            <BikeSaleInvoiceBody
              order={order}
              branchName={branchName || order.branchName}
              issuedBy={issuedBy || order.issuedBy}
            />
          ) : (
            <SaleInvoiceReceiptBody order={order} />
          )}
        </div>

        <footer className="sale-invoice-footer">
          <button type="button" className="sale-invoice-btn sale-invoice-btn--ghost" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="sale-invoice-btn sale-invoice-btn--print"
            onClick={() => window.print()}
          >
            <Printer size={14} strokeWidth={2.5} />
            {isBike ? 'Print A4 Invoice' : 'Print Thermal Receipt'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default SaleInvoiceReceipt;
