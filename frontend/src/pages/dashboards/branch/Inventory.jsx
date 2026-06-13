// frontend/src/pages/dashboards/branch/Inventory.jsx
import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useFetch, apiFetch, toast, Icon, Modal, useDebounce } from "../../../components/branch/BranchShared";
import SearchInput from "../../../components/SearchInput";
import FilterRadioGroup from "../../../components/FilterRadioGroup";

const Inventory = () => {
  const { user } = useOutletContext();
  const branchId = user?.branchId;

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [inventoryType, setInventoryType] = useState(""); // "" (All), "BIKE", "PART"
  const [showLowOnly, setShowLowOnly] = useState(false);
  const ds = useDebounce(search);

  const params = new URLSearchParams({ branchId, page, limit: 50, type: inventoryType }).toString();
  const { data: bundle, loading, refetch } = useFetch(`/inventory/page-bundle?${params}`, [page, branchId, inventoryType], 0);
  const data = bundle ? { data: bundle.data, meta: bundle.meta } : null;
  const summary = bundle?.summary;
  const refetchSummary = refetch;

  const [editing, setEditing] = useState(null); // { id, stock, alertAt }
  const [saving, setSaving] = useState(false);

  const filtered = (data?.data || []).filter(i => {
    const matchesSearch = !ds || i.part?.name?.toLowerCase().includes(ds.toLowerCase());
    const isLow = i.stock <= i.alertAt;
    return matchesSearch && (!showLowOnly || isLow);
  });

  const quickEdit = async (id, delta) => {
    const item = (data?.data || []).find(i => i.id === id);
    if (!item) return;
    const newStock = Math.max(0, item.stock + delta);
    try {
      await apiFetch(`/inventory/${id}`, { method: "PUT", body: { stock: newStock, alertAt: item.alertAt } });
      toast(`Stock updated to ${newStock}`);
      refetch();
      refetchSummary();
    } catch (e) { toast(e.message, "e"); }
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await apiFetch(`/inventory/${editing.id}`, { method: "PUT", body: { stock: Number(editing.stock), alertAt: Number(editing.alertAt) } });
      toast("Inventory updated");
      setEditing(null);
      refetch();
      refetchSummary();
    } catch (e) { toast(e.message, "e"); }
    setSaving(false);
  };

  return (
    <div className="branch-page">
      <div className="ph">
        <div className="ph-l">
          <div className="eyebrow">Inventory</div>
          <div className="ptitle">STATION STOCK</div>
          <div className="psub">Local parts management · {data?.meta?.total || 0} SKUs tracked</div>
        </div>
        <div className="ph-r" style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-s btn-sm" onClick={() => refetch()}><Icon n="refresh" /> Reconcile</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="g3" style={{ marginBottom: 25 }}>
        <div className="card ci" style={{ display: "flex", alignItems: "center", gap: 15, background: "linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(34,197,94,0.05) 100%)", border: "1px solid rgba(34,197,94,0.2)" }}>
          <div style={{ width: 45, height: 45, borderRadius: 12, background: "rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#22c55e" }}>
            <Icon n="plus" size={20} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1 }}>Total Stock In</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#22c55e" }}>{summary?.weeklyIn || 0} <span style={{ fontSize: 12, fontWeight: 500, color: "var(--muted)" }}>units</span></div>
          </div>
        </div>
        <div className="card ci" style={{ display: "flex", alignItems: "center", gap: 15, background: "linear-gradient(135deg, rgba(14,165,233,0.1) 0%, rgba(14,165,233,0.05) 100%)", border: "1px solid rgba(14,165,233,0.2)" }}>
          <div style={{ width: 45, height: 45, borderRadius: 12, background: "rgba(14,165,233,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#0ea5e9" }}>
            <Icon n="orders" size={20} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1 }}>Total Stock Out</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#0ea5e9" }}>{summary?.weeklyOut || 0} <span style={{ fontSize: 12, fontWeight: 500, color: "var(--muted)" }}>units</span></div>
          </div>
        </div>
        <div className="card ci" style={{ display: "flex", alignItems: "center", gap: 15, background: "linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(239,68,68,0.05) 100%)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <div style={{ width: 45, height: 45, borderRadius: 12, background: "rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444" }}>
            <Icon n="reports" size={20} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1 }}>Low Stock Items</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#ef4444" }}>{summary?.lowStock || 0} <span style={{ fontSize: 12, fontWeight: 500, color: "var(--muted)" }}>alerts</span></div>
          </div>
        </div>
      </div>
      <div className="fbar" style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <SearchInput
          className="sw"
          style={{ flex: 1, minWidth: 250 }}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          label="Search inventory..."
        />
        
        <FilterRadioGroup
          name="inventory-type"
          value={inventoryType}
          onChange={(v) => { setInventoryType(v); setPage(1); }}
          compact
          options={[
            { value: "", label: "All" },
            { value: "BIKE", label: "Bikes" },
            { value: "PART", label: "Parts" },
          ]}
        />

        <button
          className={`btn ${showLowOnly ? "btn-p" : "btn-s"}`}
          onClick={() => { setShowLowOnly(!showLowOnly); setPage(1); }}
          style={{
            background: showLowOnly ? "rgba(239,68,68,0.2)" : "var(--surf)",
            color: showLowOnly ? "#ef4444" : "var(--muted)",
            borderColor: showLowOnly ? "#ef4444" : "var(--border)",
            fontWeight: 700,
            fontSize: 11
          }}
        >
          <Icon n="reports" size={14} /> {showLowOnly ? "Low Stock" : "Filter Low"}
        </button>
      </div>

      {loading ? (
        <div className="inv-grid">{Array.from({ length: 12 }).map((_, i) => <div key={i} className="sk" style={{ height: 160, borderRadius: 20 }} />)}</div>
      ) : (
        <div className="inv-grid">
          {filtered.map(item => (
            <div key={item.id} className={`inv-card ${item.stock <= item.alertAt ? "alert" : ""}`}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: item.stock <= item.alertAt ? "rgba(239,68,68,.12)" : "rgba(14,165,233,.08)", display: "flex", alignItems: "center", justifyContent: "center", color: item.stock <= item.alertAt ? "var(--red)" : "var(--acc)" }}>
                  <Icon n="inventory" size={14} />
                </div>
                {item.stock <= item.alertAt && <span className="badge bg-r" style={{ fontSize: 9 }}>LOW</span>}
              </div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{item.part?.name}</div>
              <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 12 }}>{item.part?.category}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>On Hand</div>
                  <div style={{ fontFamily: "var(--font-d)", fontSize: 26, lineHeight: 1, color: item.stock === 0 ? "var(--red)" : "inherit" }}>{item.stock}</div>
                </div>
                <div className="inv-ctrl">
                  <div className="inv-btn" onClick={() => quickEdit(item.id, -1)}>−</div>
                  <div className="inv-btn" onClick={() => quickEdit(item.id, +1)}>+</div>
                  <div className="inv-btn" onClick={() => setEditing({ id: item.id, stock: item.stock, alertAt: item.alertAt })} style={{ fontSize: 11 }}>⚙</div>
                </div>
              </div>
              <div style={{ fontSize: 9, color: "var(--muted)", marginTop: 8 }}>Alert threshold: {item.alertAt}</div>
            </div>
          ))}
          {filtered.length === 0 && <div className="empty" style={{ gridColumn: "1/-1" }}><Icon n="inventory" size={36} /><div className="empty-t">No inventory records</div></div>}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <div className="pag" style={{ background: "var(--surf)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)" }}>
          <div className="pag-info">Page {page} · {data?.meta?.total || 0} total items</div>
          <div className="pag-ctrl">
            <button className="pb" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
            <button className="pb" disabled={page >= (data?.meta?.totalPages || 1)} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      </div>

      {editing && (
        <Modal title="EDIT STOCK" onClose={() => setEditing(null)}
          footer={<>
            <button className="btn btn-s btn-sm" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn btn-p btn-sm" onClick={saveEdit} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
          </>}
        >
          <div className="fr">
            <div className="fg"><label>Current Stock</label><input type="number" min="0" value={editing.stock} onChange={e => setEditing(v => ({ ...v, stock: e.target.value }))} /></div>
            <div className="fg"><label>Alert Threshold</label><input type="number" min="0" value={editing.alertAt} onChange={e => setEditing(v => ({ ...v, alertAt: e.target.value }))} /></div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Inventory;
