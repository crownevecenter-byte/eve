// frontend/src/pages/dashboards/customer/Orders.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Package } from "lucide-react";
import CustomerPageHeader from "../../../components/customer/CustomerPageHeader";
import { CustomerLoading, CustomerEmpty, CustomerCount } from "../../../components/customer/CustomerUI";
import { Badge } from "../../../components/customer/CustomerShared";
import NeuCardMarquee from "../../../components/customer/NeuCardMarquee";
import FilterRadioGroup from "../../../components/FilterRadioGroup";
import api from "../../../services/api";

const Orders = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("All");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/orders/my")
      .then(r => { const d = r?.data?.data ?? r?.data; setOrders(Array.isArray(d) ? d : []); })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = (Array.isArray(orders) ? orders : []).filter(o => {
    if (!o) return false;
    if (tab === "All") return true;
    if (tab === "Active") return ["PENDING", "PROCESSING", "PREPARING"].includes(String(o.status).toUpperCase());
    if (tab === "Completed") return String(o.status).toUpperCase() === "COMPLETED";
    if (tab === "Cancelled") return String(o.status).toUpperCase() === "CANCELLED";
    return true;
  });

  return (
    <div className="ce-page">
      <CustomerPageHeader
        eyebrow="Account"
        title="My Orders"
        subtitle="Track, manage and view your purchase history."
      />

      <FilterRadioGroup
        name="customer-orders-tab"
        value={tab}
        onChange={setTab}
        compact
        wrap
        options={["All", "Active", "Completed", "Cancelled"]}
        style={{ marginBottom: 20 }}
      />

      <div className="card">
        <div className="ch">
          <div className="ct">Recent Transactions</div>
          <CustomerCount count={filtered.length} suffix="orders" />
        </div>

        {loading ? (
          <CustomerLoading message="Loading orders…" />
        ) : filtered.length === 0 ? (
          <CustomerEmpty
            icon={Package}
            title="No orders found"
            description={`You don't have any orders in the ${tab.toLowerCase()} category yet.`}
            actionLabel="Start Shopping"
            onAction={() => navigate("/my/shop")}
          />
        ) : (
          <>
            <div className="ce-table-wrap" style={{ overflowX: "auto" }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(o => (
                    <tr key={o.id}>
                      <td className="mono" style={{ color: "var(--orange)" }}>#{o.id}</td>
                      <td>{new Date(o.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}</td>
                      <td>
                        <div className="tm">{o.items?.length || 0} Item{o.items?.length !== 1 ? "s" : ""}</div>
                        <div className="ts">{o.items?.[0]?.product?.name || "—"}{o.items?.length > 1 ? "..." : ""}</div>
                      </td>
                      <td className="mono" style={{ fontWeight: 600 }}>PKR {Number(o.total).toLocaleString()}</td>
                      <td><Badge status={o.status} /></td>
                      <td>
                        <button type="button" className="ca" onClick={() => navigate(`/my/track/${o.id}`)}>Track →</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="ce-order-cards">
              {filtered.map(o => (
                <div key={o.id} className="ce-order-card">
                  <NeuCardMarquee
                    words={[`#${o.id}`, String(o.status || "Order"), `#${o.id}`]}
                    className="ce-neu-marquee--sm ce-neu-marquee--xs"
                  />
                  <div className="ce-order-card-body">
                  <div className="ce-order-card-top">
                    <span className="ce-order-card-id">#{o.id}</span>
                    <Badge status={o.status} />
                  </div>
                  <div className="tm">{new Date(o.createdAt).toLocaleDateString("en-PK")}</div>
                  <div className="ts" style={{ marginBottom: 8 }}>
                    {o.items?.length || 0} items · PKR {Number(o.total).toLocaleString()}
                  </div>
                  <button type="button" className="ca" onClick={() => navigate(`/my/track/${o.id}`)}>Track order →</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Orders;
