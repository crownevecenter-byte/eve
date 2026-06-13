// frontend/src/pages/dashboards/owner/Purchases.jsx
import React from "react";
import { useFetch, Icon, TableSk } from "../../../components/owner/OwnerShared";

const PurchasesPage = () => {
  const { data, loading } = useFetch("/purchases");

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Supply Chain</div>
          <div className="page-title">PURCHASES</div>
          <div className="page-sub">All supplier purchase records across branches</div>
        </div>
      </div>

      <div className="table-wrap">
        {loading ? <TableSk rows={8} cols={5} /> : (
          <table>
            <thead><tr><th>Purchase #</th><th>Branch</th><th>Supplier</th><th>Total</th><th>Items</th><th>Date</th></tr></thead>
            <tbody>
              {(Array.isArray(data) ? data : data?.data || []).map(p => (
                <tr key={p.id}>
                  <td><span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700 }}>#{p.id}</span></td>
                  <td style={{ fontSize: 13, color: "var(--muted)" }}>{p.branch?.name || "—"}</td>
                  <td style={{ fontSize: 13 }}>{p.supplier?.name || "—"}</td>
                  <td style={{ fontWeight: 700, color: "var(--accent)" }}>PKR {Number(p.total).toLocaleString()}</td>
                  <td style={{ fontSize: 12, color: "var(--muted)" }}>{p.items?.length || 0} parts</td>
                  <td style={{ fontSize: 12, color: "var(--muted)" }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {(Array.isArray(data) ? data : data?.data || []).length === 0 && (
                <tr><td colSpan={6}><div className="empty"><Icon name="purchases" /><div className="empty-title">No purchases found</div></div></td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PurchasesPage;
