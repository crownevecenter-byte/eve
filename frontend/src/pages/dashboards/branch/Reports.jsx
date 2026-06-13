// frontend/src/pages/dashboards/branch/Reports.jsx
import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useFetch, Icon, Sk } from "../../../components/branch/BranchShared";
import FilterRadioGroup from "../../../components/FilterRadioGroup";

const Reports = () => {
  const { user } = useOutletContext();
  const branchId = user?.branchId;

  const [period, setPeriod] = useState("7d");
  const fetchSkip = "branchId=undefined";
  const { data: bundle, loading: sl } = useFetch(
    branchId ? `/reports/branch-analytics-bundle?branchId=${branchId}&period=${period}` : fetchSkip,
    [branchId, period]
  );
  const summary = bundle?.summary;
  const chart = bundle?.chart;
  const branchReport = bundle?.branchReport;
  const sales = bundle?.sales;

  const maxChart = chart ? Math.max(...chart.map(d => d.revenue || d._sum?.total || 0), 1) : 1;

  return (
    <div className="branch-page">
      <div className="ph">
        <div className="ph-l">
          <div className="eyebrow">Analytics</div>
          <div className="ptitle">LOCAL INTEL</div>
          <div className="psub">Performance metrics and sales breakdown for this branch</div>
        </div>
        <div className="ph-r">
          <FilterRadioGroup
            name="branch-reports-period"
            value={period}
            onChange={setPeriod}
            compact
            options={[
              { value: "7d", label: "7 Days" },
              { value: "30d", label: "30 Days" },
            ]}
          />
          <button className="btn btn-s btn-sm"><Icon n="download" /> Export</button>
        </div>
      </div>

      {/* KPI row */}
      <div className="sg" style={{ marginBottom: 20 }}>
        <div className="sc">
          <div className="sc-label">Total Revenue</div>
          <div className="sc-val">{sl ? "—" : `PKR ${((summary?.totalRevenue || 0) / 1000).toFixed(1)}K`}</div>
          <div className="sc-trend t-up">All time</div>
        </div>
        <div className="sc">
          <div className="sc-label">Total Orders</div>
          <div className="sc-val">{sl ? "—" : summary?.totalOrders || 0}</div>
        </div>
        <div className="sc">
          <div className="sc-label">Avg Order Value</div>
          <div className="sc-val">{sl ? "—" : `PKR ${(summary?.avgOrderValue || 0).toFixed(0)}`}</div>
        </div>
        <div className="sc">
          <div className="sc-label">Completed</div>
          <div className="sc-val">{sl ? "—" : summary?.completedOrders || 0}</div>
          <div className="sc-trend t-up">Fulfilled</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Revenue chart */}
        <div className="card ci">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
            <span>Revenue Trend ({period})</span>
          </div>
          {!chart ? <Sk h={140} r={8} /> : (
            <div className="bar-wrap">
              {chart.map((d, i) => {
                const val = d.revenue || d._sum?.total || 0;
                const pct = (val / maxChart) * 100;
                return (
                  <div key={i} className="bar-col">
                    <div className="bar-vl">PKR {(val / 1000).toFixed(1)}K</div>
                    <div className="bar-fill" style={{ height: `${Math.max(pct, 2)}%` }} />
                    <div className="bar-lb">{d.date ? new Date(d.date).toLocaleDateString("en", { month: "short", day: "numeric" }) : `D${i + 1}`}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Branch report stats */}
        <div className="card ci">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Branch Breakdown</div>
          {!branchReport ? <Sk h={140} r={8} /> : (
            <div>
              {[
                { label: "Total Orders",       val: branchReport.totalOrders || 0 },
                { label: "Completed Orders",   val: branchReport.completedOrders || 0 },
                { label: "Pending Orders",     val: branchReport.pendingOrders || 0 },
                { label: "Revenue",            val: `PKR ${(branchReport.revenue || 0).toFixed(2)}` },
                { label: "Appointments",       val: branchReport.totalAppointments || 0 },
              ].map(({ label, val }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 13, color: "var(--muted)" }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--acc)" }}>{val}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sales table */}
      {sales && (
        <div className="card">
          <div style={{ padding: "18px 18px 0", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Sales Breakdown</div>
          <table>
            <thead><tr><th>Product</th><th>Units Sold</th><th>Revenue</th></tr></thead>
            <tbody>
              {(Array.isArray(sales) ? sales : []).map((s, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{s.productName || s.name || `Item ${i + 1}`}</td>
                  <td style={{ fontFamily: "var(--font-m)", fontSize: 12 }}>{s.quantity || s.units || "—"}</td>
                  <td style={{ fontWeight: 700, color: "var(--acc)" }}>PKR {(s.revenue || s.total || 0).toLocaleString()}</td>
                </tr>
              ))}
              {(Array.isArray(sales) ? sales : []).length === 0 && (
                <tr><td colSpan={3}><div className="empty"><Icon n="reports" size={32} /><div className="empty-t">No sales data</div></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Reports;
