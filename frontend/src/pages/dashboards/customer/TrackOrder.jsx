// frontend/src/pages/dashboards/customer/TrackOrder.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Package } from "lucide-react";
import api from "../../../services/api";
import { STATUS_TIMELINE, STATUS_BADGE } from "../../../components/customer/CustomerShared";
import CustomerPageHeader from "../../../components/customer/CustomerPageHeader";
import { CustomerLoading, CustomerAlert } from "../../../components/customer/CustomerUI";

const TrackOrder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/orders/${id}`)
      .then(res => setOrder(res.data))
      .catch(() => setError("Order not found."))
      .finally(() => setLoading(false));
  }, [id]);

  const steps = order ? (STATUS_TIMELINE[order.status] || STATUS_TIMELINE.PENDING) : [];
  const badge = order ? (STATUS_BADGE[order.status] || { label: order.status, cls: "bg-b" }) : null;
  const total = order?.total ?? order?.items?.reduce((s, i) => s + (i.price ?? 0) * (i.quantity ?? 1), 0) ?? 0;

  return (
    <div className="ce-page">
      <CustomerPageHeader
        eyebrow={
          <button type="button" className="ca" onClick={() => navigate(-1)} style={{ marginBottom: 0 }}>
            ← Back to Orders
          </button>
        }
        title={<>Track Order <span style={{ color: "var(--orange)" }}>#{String(id).padStart(6, "0")}</span></>}
        subtitle="Real-time updates for your Crown Eve purchase."
        actions={
          badge ? (
            <div className="ce-track-status">
              <span className="ce-meta-label">Current Status</span>
              <span className={`badge ${badge.cls}`}>{badge.label}</span>
            </div>
          ) : null
        }
      />

      {loading && <CustomerLoading message="Loading order…" />}
      {error && <CustomerAlert type="error">{error}</CustomerAlert>}

      {order && (
        <div className="g73">
          <div className="card">
            <div className="ch"><div className="ct">Live Timeline</div></div>
            <div className="timeline" style={{ padding: "10px 0" }}>
              {steps.map((s, i) => (
                <div key={s.label} className="tl-item">
                  <div className="tl-left">
                    <div className={`tl-dot ${s.done ? "done" : ""} ${s.active ? "active" : ""}`} />
                    {i < steps.length - 1 && <div className={`tl-line ${s.done ? "done" : ""}`} />}
                  </div>
                  <div className="tl-content">
                    <div className="tl-title">{s.label}</div>
                    <div className="tl-date">
                      {s.done && i === 0
                        ? new Date(order.createdAt).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })
                        : s.done ? "Completed" : "Pending"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="ch"><div className="ct">Order Summary</div></div>
              {(order.items || []).map((item, idx) => (
                <div key={idx} className="ce-line-item">
                  <div className="ce-line-item-icon">
                    <Package size={20} strokeWidth={1.5} />
                  </div>
                  <div className="ce-line-item-body">
                    <div className="ce-line-item-title">{item.product?.name || item.name || "Product"}</div>
                    <div className="ce-line-item-sub">Qty: {item.quantity}</div>
                  </div>
                  <div className="ce-line-item-price">
                    PKR {((item.price ?? 0) * (item.quantity ?? 1)).toLocaleString()}
                  </div>
                </div>
              ))}
              <div className="divider" />
              <div className="trow">
                <span className="ce-muted">Order ID</span>
                <span className="mono" style={{ fontWeight: 600 }}>#{String(id).padStart(6, "0")}</span>
              </div>
              <div className="trow">
                <span className="ce-muted">Placed</span>
                <span style={{ fontSize: 12 }}>{new Date(order.createdAt).toLocaleDateString("en-PK", { dateStyle: "medium" })}</span>
              </div>
              {order.branch?.name && (
                <div className="trow">
                  <span className="ce-muted">Branch</span>
                  <span style={{ fontSize: 12 }}>{order.branch.name}</span>
                </div>
              )}
              <div className="trow" style={{ marginTop: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>Total Paid</span>
                <span className="ce-order-total" style={{ fontSize: 24 }}>PKR {total.toLocaleString()}</span>
              </div>
            </div>

            <div className="card">
              <div className="ch"><div className="ct">Need Help?</div></div>
              <p className="ce-muted" style={{ lineHeight: 1.6, marginBottom: 16 }}>Contact our support team for help with your order.</p>
              <button type="button" className="btn btn-ghost btn-xs" style={{ width: "100%" }}>Contact Support</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackOrder;
