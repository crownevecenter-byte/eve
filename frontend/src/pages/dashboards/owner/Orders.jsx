// frontend/src/pages/dashboards/owner/Orders.jsx
import React, { useState } from "react";
import { useFetch, Icon, TableSk, OrderBadge } from "../../../components/owner/OwnerShared";

const OrdersPage = () => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [branchId, setBranchId] = useState("");
  const params = new URLSearchParams({ page, limit: 15, ...(status && { status }), ...(branchId && { branchId }) }).toString();
  const { data: pageInit, loading } = useFetch(`/orders/page-init?${params}`, [page, status, branchId]);
  const data = pageInit?.orders;
  const branchData = pageInit?.branches;

  const statuses = ["PENDING", "PROCESSING", "COMPLETED", "CANCELLED"];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Operations</div>
          <div className="page-title">ALL ORDERS</div>
          <div className="page-sub">Network-wide order overview — {data?.meta?.total || 0} total</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary"><Icon name="download" /> Export</button>
        </div>
      </div>

      <div className="filter-bar">
        <select style={{ width: 180 }} value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
          <option value="">All Statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select style={{ width: 180 }} value={branchId} onChange={e => { setBranchId(e.target.value); setPage(1) }}>
          <option value="">All Branches</option>
          {branchData?.data?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      <div className="table-wrap">
        {loading ? <TableSk rows={10} cols={6} /> : (
          <table>
            <thead><tr><th>Order #</th><th>Type</th><th>Branch</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {data?.data?.map(o => (
                <tr key={o.id}>
                  <td><span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700 }}>#{o.id}</span></td>
                  <td><span className={`badge ${o.type === "ONLINE" ? "badge-blue" : "badge-purple"}`}>{o.type}</span></td>
                  <td style={{ fontSize: 13, color: "var(--muted)" }}>{o.branch?.name || "—"}</td>
                  <td style={{ fontSize: 13 }}>{o.customer?.name || "—"}</td>
                  <td style={{ fontWeight: 700, color: "var(--accent)" }}>PKR {Number(o.total).toLocaleString()}</td>
                  <td><OrderBadge status={o.status} /></td>
                  <td style={{ fontSize: 12, color: "var(--muted)" }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {data?.data?.length === 0 && <tr><td colSpan={7}><div className="empty"><Icon name="orders" /><div className="empty-title">No orders found</div></div></td></tr>}
            </tbody>
          </table>
        )}
        <div className="pagination">
          <div className="pagination-info">Showing {data?.data?.length || 0} of {data?.meta?.total || 0}</div>
          <div className="pagination-controls">
            <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
            <button className="page-btn" disabled={page >= (data?.meta?.totalPages || 1)} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
