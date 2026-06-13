import React from 'react';
import { LOGO_URL } from '../../constants/mediaAssets';
import { normalizeSaleOrder } from './SaleInvoiceReceipt';
import './BikeSaleInvoice.css';

const formatMoney = (n) => `PKR ${Number(n || 0).toLocaleString()}`;

const formatDateTime = (d) => {
  const date = new Date(d);
  return {
    date: date.toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' }),
    time: date.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }),
  };
};

export const BikeSaleInvoiceBody = ({ order, branchName, issuedBy }) => {
  const inv = normalizeSaleOrder(order);
  if (!inv) return null;

  const { date, time } = formatDateTime(inv.createdAt);
  const branch = inv.branch?.name || branchName || order?.branchName || 'Authorized Branch';
  const branchLocation = inv.branch?.location || '—';
  const branchPhone = inv.branch?.phone || inv.branch?.whatsapp || '—';

  return (
    <div id="printable-invoice-bike" className="bike-a4-invoice">
      <div className="bike-a4-frame">
        <header className="bike-a4-header">
          <img src={LOGO_URL} alt="Crown Eve Center" className="bike-a4-logo" />
          <h1 className="bike-a4-company">CROWN EVE CENTER</h1>
          <p className="bike-a4-tagline">Premium Electric Mobility · Authorized Sales &amp; Service</p>
          <div className="bike-a4-doc-type">Official Sale Invoice</div>
        </header>

        <div className="bike-a4-title-bar">
          <span>TAX INVOICE / BIKE SALE CERTIFICATE</span>
          <span className="bike-a4-inv-no">No. {String(inv.id).padStart(6, '0')}</span>
        </div>

        <div className="bike-a4-meta-grid">
          <div className="bike-a4-meta-box">
            <h3>Seller / Branch</h3>
            <p><strong>{branch}</strong></p>
            <p>{branchLocation}</p>
            <p>Phone: {branchPhone}</p>
          </div>
          <div className="bike-a4-meta-box">
            <h3>Buyer / Customer</h3>
            <p><strong>{inv.billTo.name}</strong></p>
            <p>{inv.billTo.sub}</p>
            <p>Type: {inv.billTo.tag}</p>
          </div>
          <div className="bike-a4-meta-box">
            <h3>Invoice Details</h3>
            <p>Date: <strong>{date}</strong></p>
            <p>Time: <strong>{time}</strong></p>
            <p>Payment: <strong>{(inv.payment_method || 'CASH').toUpperCase()}</strong></p>
            <p>Status: <strong>{inv.paymentStatus}</strong></p>
          </div>
        </div>

        <table className="bike-a4-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Bike Model / Description</th>
              <th>Specifications</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {(inv.items || []).map((item, idx) => {
              const bike = item.product?.bikeDetail;
              const specs = [
                bike?.motor_type && `Motor: ${bike.motor_type}`,
                bike?.battery_type && `Battery: ${bike.battery_type}`,
                bike?.battery_capacity_ah && `${bike.battery_capacity_ah}Ah`,
                bike?.max_speed_kmh && `Max ${bike.max_speed_kmh} km/h`,
              ].filter(Boolean).join(' · ') || 'Electric Bike — Standard Spec';

              return (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>
                    <strong>{item.product?.name || item.name || 'Electric Bike'}</strong>
                  </td>
                  <td className="bike-a4-specs">{specs}</td>
                  <td>{item.quantity}</td>
                  <td>{formatMoney(item.price)}</td>
                  <td><strong>{formatMoney(Number(item.price) * Number(item.quantity))}</strong></td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="bike-a4-totals">
          <div className="bike-a4-total-line">
            <span>Subtotal</span>
            <span>{formatMoney(inv.total)}</span>
          </div>
          <div className="bike-a4-total-line bike-a4-grand">
            <span>GRAND TOTAL</span>
            <span>{formatMoney(inv.total)}</span>
          </div>
        </div>

        <div className="bike-a4-terms">
          <h4>Terms &amp; Conditions</h4>
          <ol>
            <li>This invoice confirms transfer of ownership of the electric bike(s) listed above.</li>
            <li>Warranty is valid as per company policy; service only at authorized Crown Eve branches.</li>
            <li>Bike must be registered with relevant authorities as per local law.</li>
            <li>Payment received in full unless otherwise stated. Goods once sold are non-refundable.</li>
          </ol>
        </div>

        <div className="bike-a4-signatures">
          <div className="bike-a4-sign-block">
            <div className="bike-a4-sign-line" />
            <div className="bike-a4-sign-label">Branch Owner / Authorized Signatory</div>
            <div className="bike-a4-sign-name">{issuedBy || order?.issuedBy || '________________'}</div>
          </div>
          <div className="bike-a4-sign-block">
            <div className="bike-a4-sign-line" />
            <div className="bike-a4-sign-label">Customer Signature</div>
            <div className="bike-a4-sign-name">{inv.billTo.name}</div>
          </div>
        </div>

        <footer className="bike-a4-footer">
          <p>Thank you for choosing Crown Eve Center — Drive Electric, Drive Smart.</p>
          <p className="bike-a4-footer-note">This is a computer-generated invoice. Both parties must sign above for record.</p>
        </footer>
      </div>
    </div>
  );
};

export default BikeSaleInvoiceBody;
