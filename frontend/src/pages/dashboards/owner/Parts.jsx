// frontend/src/pages/dashboards/owner/Parts.jsx
import React, { useState } from "react";
import { useFetch, useDebounce, api, toast, Icon, TableSk, Modal, Confirm } from "../../../components/owner/OwnerShared";
import SearchInput from "../../../components/SearchInput";

const PartsPage = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("");
  const ds = useDebounce(search);
  const params = new URLSearchParams({ page, limit: 12, ...(ds && { search: ds }), ...(category && { category }) }).toString();
  const { data, loading, refetch } = useFetch(`/parts?${params}`, [page, ds, category]);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [form, setForm] = useState({ name: "", category: "", price: "", stock: "" });
  const [saving, setSaving] = useState(false);

  const openAdd = () => { setForm({ name: "", category: "", price: "", stock: "" }); setEditTarget(null); setShowModal(true); };
  const openEdit = p => { setForm({ name: p.name, category: p.category, price: p.price, stock: p.stock }); setEditTarget(p); setShowModal(true); };

  const submit = async () => {
    if (!form.name || !form.category || !form.price) return toast("Fill required fields", "error");
    setSaving(true);
    try {
      const body = { name: form.name, category: form.category, price: parseFloat(form.price), stock: parseInt(form.stock) || 0 };
      if (editTarget) { await api(`/parts/${editTarget.id}`, { method: "PUT", body }); toast("Part updated"); }
      else { await api("/parts", { method: "POST", body }); toast("Part created"); }
      setShowModal(false); refetch();
    } catch (e) { toast(e.message, "error"); }
    setSaving(false);
  };

  const remove = async id => {
    try { await api(`/parts/${id}`, { method: "DELETE" }); toast("Part deleted"); refetch(); }
    catch (e) { toast(e.message, "error"); }
    setConfirmId(null);
  };

  const categories = [...new Set(data?.data?.map(p => p.category) || [])];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Inventory</div>
          <div className="page-title">PARTS CATALOG</div>
          <div className="page-sub">Global parts master list — {data?.meta?.total || 0} SKUs</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={openAdd}><Icon name="plus" /> Add SKU</button>
        </div>
      </div>

      <div className="filter-bar">
        <SearchInput
          className="search-wrap"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          label="Search by name…"
        />
        <select style={{ width: 180 }} value={category} onChange={e => { setCategory(e.target.value); setPage(1) }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="table-wrap">
        {loading ? <TableSk rows={8} cols={5} /> : (
          <table>
            <thead><tr><th>Component</th><th>Category</th><th>Price</th><th>Base Stock</th><th style={{ textAlign: "right" }}>Actions</th></tr></thead>
            <tbody>
              {data?.data?.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}><Icon name="parts" size={16} /></div>
                      <span style={{ fontWeight: 600 }}>{p.name}</span>
                    </div>
                  </td>
                  <td><span className="badge badge-blue">{p.category}</span></td>
                  <td style={{ fontWeight: 700, color: "var(--accent)" }}>${parseFloat(p.price).toFixed(2)}</td>
                  <td>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>{p.stock}</span>
                    {p.stock < 10 && <span className="badge badge-red" style={{ marginLeft: 8 }}>Low</span>}
                  </td>
                  <td><div className="td-actions">
                    <button className="btn-icon" onClick={() => openEdit(p)}><Icon name="edit" size={14} /></button>
                    <button className="btn-icon danger" onClick={() => setConfirmId(p.id)}><Icon name="trash" size={14} /></button>
                  </div></td>
                </tr>
              ))}
              {data?.data?.length === 0 && <tr><td colSpan={5}><div className="empty"><Icon name="parts" /><div className="empty-title">No parts found</div></div></td></tr>}
            </tbody>
          </table>
        )}
        <div className="pagination">
          <div className="pagination-info">Showing {data?.data?.length || 0} of {data?.meta?.total || 0}</div>
          <div className="pagination-controls">
            <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
            {Array.from({ length: Math.min(data?.meta?.totalPages || 1, 5) }).map((_, i) => (
              <button key={i} className={`page-btn ${page === i + 1 ? "active" : ""}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
            ))}
            <button className="page-btn" disabled={page >= (data?.meta?.totalPages || 1)} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      </div>

      {showModal && (
        <Modal title={editTarget ? "EDIT PART" : "NEW PART"} onClose={() => setShowModal(false)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submit} disabled={saving}>{saving ? "Saving…" : "Save Part"}</button>
          </>}
        >
          <div className="form-group"><label>Part Name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Brake Pad Set" /></div>
          <div className="form-row">
            <div className="form-group"><label>Category *</label><input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Brakes" /></div>
            <div className="form-group"><label>Price (USD) *</label><input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" /></div>
          </div>
          <div className="form-group"><label>Base Stock</label><input type="number" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="0" /></div>
        </Modal>
      )}
      {confirmId && <Confirm msg="Delete this part from the global catalog?" onConfirm={() => remove(confirmId)} onCancel={() => setConfirmId(null)} />}
    </div>
  );
};

export default PartsPage;
