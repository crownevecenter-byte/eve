// frontend/src/pages/public/TrackOrder.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import '../../styles/customer.css';
import { STATUS_TIMELINE, STATUS_BADGE } from "../../components/customer/CustomerShared";

const PublicTrackOrder = () => {
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const [searchId, setSearchId] = useState(paramId || "");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrder = useCallback((orderId) => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    setOrder(null);
    api.get(`/orders/${orderId}`)
      .then(res => setOrder(res.data))
      .catch(() => setError("Order not found. Check your order ID."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (paramId) fetchOrder(paramId); }, [paramId, fetchOrder]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchId.trim()) fetchOrder(searchId.trim());
  };

  const getSteps = (o) => {
    const isPaid = o.payment_status === 'PAID';
    const s = o.status;
    return [
      { label: "Order Placed", done: true, active: s === 'PENDING' && !isPaid },
      { label: "Payment Verified", done: isPaid, active: s === 'PENDING' && isPaid },
      { label: "Being Prepared", done: ['PROCESSING', 'SHIPPED', 'COMPLETED'].includes(s), active: s === 'PROCESSING' },
      { label: "Shipped", done: ['SHIPPED', 'COMPLETED'].includes(s), active: s === 'SHIPPED' },
      { label: "Delivered", done: s === 'COMPLETED', active: s === 'COMPLETED' }
    ];
  };

  const steps = order ? getSteps(order) : [];
  const total = order?.total ?? order?.items?.reduce((s, i) => s + (i.price ?? 0) * (i.quantity ?? 1), 0) ?? 0;

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(`Hi, I need help with my Order #${order.id}. Current status: ${order.status}`);
    window.open(`https://wa.me/923219240325?text=${msg}`, '_blank');
  };

  return (
    <div id="customer-dashboard-shell">
      <div className="main-wrap">
        <div className="page-wrap">
          <div className="pg-hd" style={{ textAlign: 'center', display: 'block', marginBottom: '40px', paddingTop: '60px' }}>
            <h1 style={{ fontSize: '56px', letterSpacing: '-1px', marginBottom: '8px' }}>
              Track Your Build
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--muted2)', maxWidth: '500px', margin: '0 auto' }}>
              Enter your order reference ID below to see live progress and delivery updates.
            </p>
          </div>

          <div className="card" style={{ maxWidth: '600px', margin: '0 auto 40px', padding: '24px' }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <input
                  className="fi"
                  placeholder="Enter Order ID"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  style={{ height: '48px' }}
                />
              </div>
              <button className="btn btn-primary" type="submit" style={{ height: '48px', padding: '0 24px' }}>
                Track Progress
              </button>
            </form>
          </div>

          {loading && <div className="card" style={{ maxWidth: 800, margin: "0 auto", textAlign: "center", padding: 40, color: "var(--muted2)" }}>Fetching order…</div>}
          {error && <div className="card" style={{ maxWidth: 800, margin: "0 auto", textAlign: "center", padding: 40, color: "var(--red)" }}>{error}</div>}

          {order && (
            <div className="g73">
              <div className="card">
                <div className="ch">
                  <div className="ct">Live Build Status</div>
                  <div className={`badge ${STATUS_BADGE[order.status]?.cls || "bg-b"}`}>{STATUS_BADGE[order.status]?.label || order.status}</div>
                </div>
                <div className="timeline" style={{ padding: "10px 0" }}>
                  {steps.map((s, i) => (
                    <div key={s.label} className="tl-item">
                      <div className="tl-left">
                        <div className={`tl-dot ${s.done ? "done" : ""} ${s.active ? "active" : ""}`} />
                        {i < steps.length - 1 && <div className={`tl-line ${s.done ? "done" : ""}`} />}
                      </div>
                      <div className="tl-content">
                        <div className="tl-title" style={{ fontSize: '14px', fontWeight: 700 }}>{s.label}</div>
                        <div className="tl-date" style={{ fontSize: '11px' }}>
                          {s.done ? "Completed" : s.active ? "Current Action" : "Pending"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="card" style={{ marginBottom: '20px' }}>
                  <div className="ch"><div className="ct">Build Summary</div></div>
                  {(order.items || []).map((item, idx) => (
                    <div key={idx} style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "center" }}>
                      <div style={{ width: 44, height: 44, background: "var(--black3)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🏍️</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{item.product?.name || item.name || "Product"}</div>
                        <div style={{ fontSize: 11, color: "var(--muted2)" }}>Qty: {item.quantity}</div>
                      </div>
                    </div>
                  ))}
                  <div className="divider" />
                  <div className="trow">
                    <span style={{ fontSize: 12, color: "var(--muted2)" }}>Order ID</span>
                    <span className="mono" style={{ fontWeight: 600 }}>#{String(order.id || searchId).padStart(6, '0')}</span>
                  </div>
                  <div className="trow">
                    <span style={{ fontSize: 12, color: "var(--muted2)" }}>Placed</span>
                    <span style={{ fontSize: 12 }}>{new Date(order.createdAt).toLocaleDateString("en-PK", { dateStyle: "medium" })}</span>
                  </div>
                  {order.tracking_id && (
                    <div className="trow">
                      <span style={{ fontSize: 12, color: "var(--muted2)" }}>Tracking ID</span>
                      <span className="mono" style={{ color: "var(--orange)", fontWeight: 700 }}>{order.tracking_id}</span>
                    </div>
                  )}
                  <div className="trow" style={{ marginTop: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>Total</span>
                    <span className="mono" style={{ fontSize: 20, fontWeight: 700, color: "var(--orange)" }}>PKR {total.toLocaleString()}</span>
                  </div>
                </div>

                <div className="card" style={{ marginBottom: '20px' }}>
                  <div className="ch"><div className="ct">Branch Info</div></div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ fontSize: 13 }}>
                      <strong style={{ color: "var(--muted2)", fontSize: 11, display: "block", marginBottom: 2 }}>Branch Name</strong>
                      {order.branch?.name}
                    </div>
                    <div style={{ fontSize: 13 }}>
                      <strong style={{ color: "var(--muted2)", fontSize: 11, display: "block", marginBottom: 2 }}>Contact Number</strong>
                      {order.branch?.phone || "N/A"}
                    </div>
                    {order.branch?.whatsapp && (
                      <div style={{ fontSize: 13 }}>
                        <strong style={{ color: "var(--muted2)", fontSize: 11, display: "block", marginBottom: 2 }}>WhatsApp</strong>
                        {order.branch?.whatsapp}
                      </div>
                    )}
                    <div style={{ fontSize: 13 }}>
                      <strong style={{ color: "var(--muted2)", fontSize: 11, display: "block", marginBottom: 2 }}>Location</strong>
                      {order.branch?.location}
                    </div>
                    {order.branch?.banks?.[0] && (
                      <div style={{ background: "rgba(232, 71, 10, 0.03)", padding: 10, borderRadius: 8, marginTop: 5, border: "1px dashed var(--orange)" }}>
                        <strong style={{ color: "var(--orange)", fontSize: 10, textTransform: "uppercase" }}>Primary Bank</strong>
                        <div style={{ fontWeight: 700, fontSize: 12 }}>{order.branch.banks[0].name}</div>
                        <div className="mono" style={{ fontSize: 12 }}>{order.branch.banks[0].account_number}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>{order.branch.banks[0].account_title}</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card">
                  <div className="ch"><div className="ct">Need Help?</div></div>
                  <p style={{ fontSize: '12px', color: 'var(--muted2)', lineHeight: 1.6, marginBottom: '16px' }}>
                    Click below to chat with the **{order.branch?.name}** support team on WhatsApp.
                  </p>
                  <button className="btn btn-primary" style={{ width: '100%', background: '#25D366', borderColor: '#25D366', color: '#fff' }} onClick={() => {
                    const wa = order.branch?.whatsapp || "923219240325";
                    const msg = encodeURIComponent(`Hi ${order.branch?.name}, I need help with my Order #${order.id}. Current status: ${order.status}`);
                    window.open(`https://wa.me/${wa}?text=${msg}`, '_blank');
                  }}>
                    Contact via WhatsApp
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicTrackOrder;
