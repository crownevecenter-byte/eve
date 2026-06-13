// Shared thermal receipt for service booking ticket & final bill (POS + Branch Services)
import React, { useState, useEffect } from 'react';
import { X, Printer } from 'lucide-react';
import { apiFetch } from './BranchShared';
import {
  getWalkInCustomerName,
  getWalkInCustomerPhone,
  generateServiceId,
} from '../../pages/dashboards/branch/pos/utils';

const format12Hour = (timeStr) => {
  if (!timeStr) return '';
  if (timeStr === 'ASAP') return 'ASAP';
  const [hoursStr, minutesStr] = timeStr.split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = minutesStr || '00';
  if (isNaN(hours)) return timeStr;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursFormatted = hours < 10 ? `0${hours}` : hours;
  return `${hoursFormatted}:${minutes} ${ampm}`;
};

const parsePartsFromNotes = (notes) => {
  const listMatch = notes?.match(/\[(.*?)\]/);
  if (!listMatch?.[1]) return [];

  return listMatch[1].split(', ').map((item) => {
    if (item.includes('|')) {
      const [name, model, priceStr, qtyStr] = item.split('|');
      return {
        name,
        model,
        price: parseFloat(priceStr) || 0,
        qty: parseInt(qtyStr, 10) || 1,
      };
    }
    const qtyMatch = item.match(/\(x(\d+)\)/);
    const name = item.replace(/\(x\d+\)/, '').trim();
    return {
      name,
      model: '',
      price: 0,
      qty: qtyMatch ? parseInt(qtyMatch[1], 10) : 1,
    };
  });
};

export const normalizeServiceBooking = (booking, user) => ({
  ...booking,
  branchId: booking.branchId || user?.branchId,
  branch: booking.branch || {
    name: user?.branch?.name || 'Branch',
    location: user?.branch?.location || '',
  },
  customer: {
    ...(booking.customer || {}),
    name: booking.customer?.name || getWalkInCustomerName(booking.customer_notes),
    phone: booking.customer?.phone || getWalkInCustomerPhone(booking.customer_notes),
  },
});

export const ServiceThermalReceiptBody = ({ type, booking }) => {
  const isBill = type === 'BILL';
  const bookingId = generateServiceId(booking.id);

  const formattedToday =
    new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }) +
    ' ' +
    new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

  const [resolvedParts, setResolvedParts] = useState([]);

  let laborCost = 0;
  let partsCost = 0;

  if (isBill) {
    const notes = booking.customer_notes || '';
    const laborMatch = notes.match(/Labor\s+([\d.]+)/i);
    const partsMatch = notes.match(/Parts\s+([\d.]+)/i);
    laborCost = laborMatch ? parseFloat(laborMatch[1]) : booking.final_price || 0;
    partsCost = partsMatch ? parseFloat(partsMatch[1]) : 0;
  }

  useEffect(() => {
    if (!isBill) {
      setResolvedParts([]);
      return;
    }

    let initialList = [];
    if (Array.isArray(booking.partsUsed) && booking.partsUsed.length > 0) {
      initialList = booking.partsUsed.map((p) => ({
        name: p.name || 'Part',
        model: p.model || '',
        price: Number(p.price) || 0,
        qty: Number(p.quantity || p.qty) || 1,
      }));
    } else {
      initialList = parsePartsFromNotes(booking.customer_notes);
    }

    setResolvedParts(initialList);

    const legacyParts = initialList.filter((p) => p.price === 0);
    if (legacyParts.length > 0 && booking.branchId) {
      const resolveLegacy = async () => {
        const updatedList = [...initialList];
        for (let i = 0; i < updatedList.length; i++) {
          if (updatedList[i].price === 0) {
            try {
              const res = await apiFetch(
                `/products?branchId=${booking.branchId}&search=${encodeURIComponent(updatedList[i].name)}&limit=1`
              );
              const products = res.data || res;
              if (Array.isArray(products) && products.length > 0) {
                const prod = products[0];
                updatedList[i] = {
                  ...updatedList[i],
                  model: prod.partDetail?.model || prod.model || '',
                  price: prod.price || 0,
                };
              }
            } catch (err) {
              console.error('Failed to resolve legacy product:', err);
            }
          }
        }
        setResolvedParts(updatedList);
      };
      resolveLegacy();
    }
  }, [booking.customer_notes, booking.partsUsed, isBill, booking.branchId]);

  const subtotal = laborCost + partsCost;
  const fullLocation = booking.branch?.location || '';
  const [addressText] = fullLocation.split('|');
  const branchTitle = booking.branch?.name
    ? booking.branch.name.toLowerCase().includes('crown')
      ? booking.branch.name
      : `CROWN EVE - ${booking.branch.name}`
    : 'CROWN EVE - MAIN BRANCH';

  return (
    <div
      className="printable-receipt-modal"
      style={{
        background: '#FFF',
        color: '#111',
        padding: '36px 28px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxShadow: '0 20px 50px rgba(0,0,0,0.08)',
        border: '1px solid #E4E4E7',
        borderRadius: 16,
        maxWidth: 390,
        margin: '0 auto',
        textAlign: 'left',
        fontSize: 12,
        lineHeight: '1.5',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -8,
          left: 0,
          right: 0,
          height: 8,
          background:
            'linear-gradient(-135deg, #FFF 5px, transparent 0), linear-gradient(135deg, #FFF 5px, transparent 0)',
          backgroundSize: '10px 10px',
          transform: 'rotate(180deg)',
        }}
      />

      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <div
          style={{
            fontSize: 18,
            fontWeight: 900,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: '#000',
          }}
        >
          {branchTitle}
        </div>
        <div
          style={{
            fontSize: 10,
            color: '#666',
            marginTop: 4,
            fontWeight: 500,
            lineHeight: '1.4',
            maxWidth: '80%',
            margin: '4px auto 0 auto',
          }}
        >
          {addressText?.trim() || 'Pakistan'}
        </div>
      </div>

      <div style={{ borderBottom: '1px dashed #E4E4E7', margin: '14px 0' }} />

      <div
        style={{
          textAlign: 'center',
          fontWeight: 800,
          fontSize: 12,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          color: '#000',
          margin: '16px 0 14px 0',
        }}
      >
        — {isBill ? 'FINAL SERVICE INVOICE' : 'CONFIRMATION VOUCHER'} —
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: '12px 16px',
          margin: '14px 0',
        }}
      >
        <div>
          <span
            style={{
              fontSize: 8,
              fontWeight: 800,
              color: '#888',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'block',
              marginBottom: 2,
            }}
          >
            BOOKING ID
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#000', fontFamily: 'monospace' }}>
            #{bookingId}
          </span>
        </div>
        <div>
          <span
            style={{
              fontSize: 8,
              fontWeight: 800,
              color: '#888',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'block',
              marginBottom: 2,
            }}
          >
            SERVICE STATUS
          </span>
          <span
            style={{
              fontSize: 8,
              fontWeight: 800,
              textTransform: 'uppercase',
              padding: '2px 6px',
              borderRadius: 4,
              background: isBill ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
              color: isBill ? '#10B981' : '#F59E0B',
              display: 'inline-block',
            }}
          >
            {booking.status?.toUpperCase()}
          </span>
        </div>
        <div>
          <span
            style={{
              fontSize: 8,
              fontWeight: 800,
              color: '#888',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'block',
              marginBottom: 2,
            }}
          >
            CUSTOMER
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#000' }}>
            {booking.customer?.name || 'Walk-in Customer'}
          </span>
          {booking.customer?.phone && (
            <span style={{ fontSize: 9, color: '#666', display: 'block', marginTop: 2 }}>
              {booking.customer.phone}
            </span>
          )}
        </div>
        <div>
          <span
            style={{
              fontSize: 8,
              fontWeight: 800,
              color: '#888',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'block',
              marginBottom: 2,
            }}
          >
            BOOKING DATE
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#000', fontFamily: 'monospace' }}>
            {new Date(booking.booking_date).toLocaleDateString('en-GB')}
          </span>
        </div>
        <div>
          <span
            style={{
              fontSize: 8,
              fontWeight: 800,
              color: '#888',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'block',
              marginBottom: 2,
            }}
          >
            SERVICE TYPE
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#000' }}>
            {booking.service?.name || 'General Maintenance'}
          </span>
        </div>
        <div>
          <span
            style={{
              fontSize: 8,
              fontWeight: 800,
              color: '#888',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'block',
              marginBottom: 2,
            }}
          >
            BOOKING TIME
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#000', fontFamily: 'monospace' }}>
            {booking.booking_time ? format12Hour(booking.booking_time) : 'ASAP'}
          </span>
        </div>
      </div>

      <div style={{ borderBottom: '1px dashed #E4E4E7', margin: '14px 0' }} />

      {isBill ? (
        <div>
          <div
            style={{
              fontWeight: 800,
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: '#888',
              marginBottom: 8,
            }}
          >
            Itemized Bill Detail
          </div>
          <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E4E4E7' }}>
                <th style={{ textAlign: 'left', paddingBottom: 6, fontSize: 9, color: '#888', fontWeight: 800 }}>
                  QTY
                </th>
                <th style={{ textAlign: 'left', paddingBottom: 6, fontSize: 9, color: '#888', fontWeight: 800 }}>
                  ITEM / DESCRIPTION
                </th>
                <th style={{ textAlign: 'right', paddingBottom: 6, fontSize: 9, color: '#888', fontWeight: 800 }}>
                  TOTAL
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #F4F4F5' }}>
                <td style={{ padding: '8px 0', color: '#555' }}>1</td>
                <td style={{ padding: '8px 0', fontWeight: 600 }}>LABOR / SERVICE FEE</td>
                <td
                  style={{
                    padding: '8px 0',
                    textAlign: 'right',
                    fontWeight: 700,
                    fontFamily: 'monospace',
                  }}
                >
                  PKR {laborCost.toLocaleString()}
                </td>
              </tr>
              {resolvedParts.map((item, index) => {
                const unitPrice = item.price || 0;
                const itemTotal = unitPrice * item.qty;
                return (
                  <tr key={index} style={{ borderBottom: '1px solid #F4F4F5' }}>
                    <td style={{ padding: '8px 0', color: '#555', verticalAlign: 'top' }}>{item.qty}</td>
                    <td style={{ padding: '8px 0', verticalAlign: 'top', textAlign: 'left' }}>
                      <div style={{ fontWeight: 600, textTransform: 'uppercase' }}>{item.name}</div>
                      {item.model && (
                        <div
                          style={{
                            fontSize: 9,
                            color: 'var(--acc)',
                            fontWeight: 700,
                            marginTop: 2,
                            background: 'rgba(230,81,0,0.06)',
                            display: 'inline-block',
                            padding: '1px 5px',
                            borderRadius: 4,
                          }}
                        >
                          {item.model}
                        </div>
                      )}
                      {unitPrice > 0 && (
                        <div style={{ fontSize: 9, color: '#777', marginTop: 2 }}>
                          PKR {unitPrice.toLocaleString()} / unit
                        </div>
                      )}
                    </td>
                    <td
                      style={{
                        padding: '8px 0',
                        textAlign: 'right',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        verticalAlign: 'top',
                      }}
                    >
                      {itemTotal > 0 ? `PKR ${itemTotal.toLocaleString()}` : 'MATERIAL PART'}
                    </td>
                  </tr>
                );
              })}
              {partsCost > 0 && resolvedParts.length === 0 && (
                <tr style={{ borderBottom: '1px solid #F4F4F5' }}>
                  <td style={{ padding: '8px 0', color: '#555' }}>1</td>
                  <td style={{ padding: '8px 0', textTransform: 'uppercase', fontWeight: 600 }}>
                    SPARES & PARTS CHARGES
                  </td>
                  <td
                    style={{
                      padding: '8px 0',
                      textAlign: 'right',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                    }}
                  >
                    PKR {partsCost.toLocaleString()}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div
            style={{
              background: '#F8F9FA',
              borderRadius: 12,
              padding: '16px 20px',
              border: '1px solid #E4E4E7',
              marginTop: 14,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#000',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                TOTAL SERVICE BILL
              </span>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 900,
                  color: 'var(--acc)',
                  fontFamily: 'monospace',
                }}
              >
                PKR {(booking.final_price ?? subtotal).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(230,81,0,0.03)',
            borderRadius: 12,
            border: '1px solid rgba(230,81,0,0.15)',
            fontSize: 10,
            lineHeight: '1.5',
            color: '#555',
          }}
        >
          <div
            style={{
              fontWeight: 800,
              textTransform: 'uppercase',
              color: 'var(--acc)',
              marginBottom: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            Terminal Notice
          </div>
          Please present this booking receipt ticket at the service terminal counter for quick customer
          registration.
        </div>
      )}

      <div style={{ borderBottom: '1px dashed #E4E4E7', margin: '18px 0 14px 0' }} />

      <div style={{ textAlign: 'center', fontSize: 10, color: '#000' }}>
        <div style={{ fontWeight: 'bold', fontSize: 11, marginBottom: 6, fontFamily: 'monospace' }}>
          {formattedToday.toUpperCase()}
        </div>
        <div style={{ letterSpacing: '0.5px', marginTop: 10, fontWeight: 900, textTransform: 'uppercase' }}>
          THANK YOU FOR YOUR PATRONAGE!
        </div>
        <div style={{ fontSize: 9, color: '#666', marginTop: 4, fontWeight: 500 }}>
          CROWN EVE WISHES YOU A SAFE DRIVE.
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .printable-receipt-modal, .printable-receipt-modal * {
            visibility: visible !important;
          }
          .printable-receipt-modal {
            position: fixed !important;
            left: 50% !important;
            top: 0 !important;
            transform: translateX(-50%) !important;
            width: 100% !important;
            max-width: 380px !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
            z-index: 99999 !important;
          }
          .branch-modal, .mbk, .mf, .mh {
            background: transparent !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
};

const ServiceThermalReceipt = ({ type, booking, onClose }) => {
  const isBill = type === 'BILL';
  const title = isBill ? 'Service Final Bill' : 'Service Booking Ticket';

  return (
    <div
      className="service-receipt-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="service-receipt-dialog" onClick={(e) => e.stopPropagation()}>
        <header className="service-receipt-header">
          <div>
            <div className="service-receipt-title">{title}</div>
            <div className="service-receipt-subtitle">Ready for print</div>
          </div>
          <button
            type="button"
            className="service-receipt-close-icon"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </header>

        <div className="service-receipt-body-wrap">
          <ServiceThermalReceiptBody type={isBill ? 'BILL' : 'BOOKING'} booking={booking} />
        </div>

        <footer className="service-receipt-footer">
          <button type="button" className="service-receipt-btn service-receipt-btn--ghost" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="service-receipt-btn service-receipt-btn--print"
            onClick={() => window.print()}
          >
            <Printer size={14} strokeWidth={2.5} />
            Print Ticket
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ServiceThermalReceipt;
