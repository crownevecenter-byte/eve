// frontend/src/pages/dashboards/owner/Dashboard.jsx
import React from "react";
import { useFetch, Icon, Sk, TableSk, OrderBadge } from "../../../components/owner/OwnerShared";

const DashboardPage = () => {
  const { data: bundle, loading } = useFetch("/reports/owner-dashboard");

  const branchCount = bundle?.branchCount ?? 0;
  const partsCount = bundle?.partsCount ?? 0;
  const orderCount = bundle?.orderCount ?? 0;
  const revenue = bundle?.revSummary;
  const topBranches = bundle?.topBranches ?? [];
  const compareData = bundle?.compareData;
  const recentOrders = bundle?.recentOrders ?? [];

  const compareArray = Array.isArray(compareData) ? compareData : [];
  const maxRev = compareArray.length > 0 ? Math.max(...compareArray.map(b => b.revenue || 0), 1) : 1;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Enterprise Control</div>
          <div className="page-title">NETWORK COMMAND</div>
          <div className="page-sub">Real-time monitoring for the Crown Eve branch network</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="live-badge">
            <span className="live-dot" />
            Live Network Active
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => window.location.reload()}>
            <Icon name="refresh" size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: "rgba(232,71,10,0.1)", color: "var(--accent)" }}>
            <Icon name="dollar" size={20} />
          </div>
          <div className="stat-card-label">Global Revenue</div>
          <div className="stat-card-value">PKR {((revenue?.totalRevenue || 0) / 1000).toFixed(1)}K</div>
          <div className="stat-card-trend trend-up">↑ All branches</div>
          <div className="stat-card-glow" style={{ background: "var(--accent)" }} />
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: "rgba(59,130,246,0.1)", color: "var(--blue)" }}>
            <Icon name="branches" size={20} />
          </div>
          <div className="stat-card-label">Total Branches</div>
          <div className="stat-card-value">{loading ? "—" : branchCount}</div>
          <div className="stat-card-trend" style={{ color: "var(--blue)" }}>Active network nodes</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: "rgba(34,197,94,0.1)", color: "var(--green)" }}>
            <Icon name="orders" size={20} />
          </div>
          <div className="stat-card-label">Total Orders</div>
          <div className="stat-card-value">{loading ? "—" : orderCount}</div>
          <div className="stat-card-trend trend-up">Network-wide</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: "rgba(168,85,247,0.1)", color: "var(--purple)" }}>
            <Icon name="parts" size={20} />
          </div>
          <div className="stat-card-label">Parts SKUs</div>
          <div className="stat-card-value">{loading ? "—" : partsCount}</div>
          <div className="stat-card-trend" style={{ color: "var(--purple)" }}>Global catalog</div>
        </div>
      </div>

      <div className="dashboard-compare-grid">
        <div className="card card-inner">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Branch Revenue Comparison</div>
          </div>
          {loading || !compareData ? <Sk h={160} r={8} /> : (
            <div>
              {compareArray.map(b => (
                <div key={b.name} className="compare-row">
                  <div style={{ width: 110, fontSize: 12, fontWeight: 600, flexShrink: 0, color: "var(--muted)" }}>{b.name}</div>
                  <div className="compare-bar-track">
                    <div className="compare-bar-fill" style={{ width: `${(b.revenue / maxRev) * 100}%` }} />
                  </div>
                  <div style={{ width: 80, textAlign: "right", fontSize: 12, fontWeight: 700, color: "var(--accent)", flexShrink: 0 }}>
                    PKR {(b.revenue / 1000).toFixed(1)}K
                  </div>
                </div>
              ))}
              {compareArray.length === 0 && <div className="empty"><Icon name="branches" size={36} /><div className="empty-title">No data</div></div>}
            </div>
          )}
        </div>

        <div className="card card-inner">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>Top Branches by Orders</div>
          {loading || !bundle ? <Sk h={160} r={8} /> : topBranches.map((b, i) => (
            <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < topBranches.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: i === 0 ? "var(--accent)" : "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{b.name}</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>{b.location}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>{b._count?.orders} orders</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div style={{ padding: "20px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Recent Orders (Network-wide)</div>
          <span className="badge badge-blue">Live</span>
        </div>
        {loading ? <TableSk rows={5} cols={5} /> : (
          <div style={{ overflowX: 'auto', paddingBottom: '10px' }}>
            <table style={{ minWidth: '600px' }}>
              <thead>
                <tr>
                  <th>Order #</th><th>Branch</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.slice(0, 6).map(o => (
                  <tr key={o.id}>
                    <td><span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>#{o.id}</span></td>
                    <td style={{ fontSize: 13, color: "var(--muted)" }}>{o.branch?.name || "—"}</td>
                    <td style={{ fontSize: 13 }}>{
                      o.customer?.name
                      || (o.walkInCustomer
                        ? `${o.walkInCustomer.first_name || ""} ${o.walkInCustomer.last_name || ""}`.trim()
                        : null)
                      || o.customer_name
                      || "—"
                    }</td>
                    <td style={{ fontWeight: 700, color: "var(--accent)" }}>PKR {(o.total ?? 0).toFixed(2)}</td>
                    <td><OrderBadge status={o.status} /></td>
                    <td style={{ fontSize: 12, color: "var(--muted)" }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {recentOrders.length === 0 && <tr><td colSpan={6}><div className="empty"><Icon name="orders" /><div className="empty-title">No orders</div></div></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
