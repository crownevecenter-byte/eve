import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const BRANCH_COLORS = ["#E8470A", "#3B82F6", "#22C55E", "#A855F7", "#EAB308", "#EF4444"];

const formatDate = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en", { month: "short", day: "numeric" });
};

const formatPkr = (value) => {
  const n = Number(value) || 0;
  if (n >= 1000) return `PKR ${(n / 1000).toFixed(1)}K`;
  return `PKR ${n.toLocaleString()}`;
};

const BranchTooltip = ({ active, payload, label, branches }) => {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        background: "#FFF3EE",
        border: "1px solid #FFD9C8",
        borderRadius: 12,
        padding: "10px 12px",
        fontSize: 12,
        boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 8, color: "#111" }}>{formatDate(label)}</div>
      {branches.map((branch, index) => {
        const revenue = payload.find((p) => p.dataKey === `rev_${branch.id}`)?.value || 0;
        const orders = payload.find((p) => p.dataKey === `ord_${branch.id}`)?.value || 0;
        return (
          <div key={branch.id} style={{ marginBottom: 6, color: "#333" }}>
            <span style={{ color: BRANCH_COLORS[index % BRANCH_COLORS.length], fontWeight: 700 }}>
              {branch.name}
            </span>
            <div>Revenue: {formatPkr(revenue)}</div>
            <div>Orders: {orders}</div>
          </div>
        );
      })}
    </div>
  );
};

const BranchPerformanceLineChart = ({ data, height = 220 }) => {
  const branches = data?.branches || [];
  const series = data?.series || [];

  if (!branches.length || !series.length) {
    return (
      <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 13 }}>
        No branch performance data for this period
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#E8E8E8" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="#666"
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="revenue"
            stroke="#666"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v)}
            width={42}
          />
          <YAxis
            yAxisId="orders"
            orientation="right"
            stroke="#666"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={28}
          />
          <Tooltip content={<BranchTooltip branches={branches} />} />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            formatter={(value) => <span style={{ color: "#444" }}>{value}</span>}
          />
          {branches.map((branch, index) => {
            const color = BRANCH_COLORS[index % BRANCH_COLORS.length];
            return (
              <Line
                key={`rev-${branch.id}`}
                yAxisId="revenue"
                type="monotone"
                dataKey={`rev_${branch.id}`}
                name={`${branch.name} · PKR`}
                stroke={color}
                strokeWidth={2.5}
                dot={{ r: 3, fill: color }}
                activeDot={{ r: 5 }}
              />
            );
          })}
          {branches.map((branch, index) => {
            const color = BRANCH_COLORS[index % BRANCH_COLORS.length];
            return (
              <Line
                key={`ord-${branch.id}`}
                yAxisId="orders"
                type="monotone"
                dataKey={`ord_${branch.id}`}
                name={`${branch.name} · Orders`}
                stroke={color}
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={false}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BranchPerformanceLineChart;
