// frontend/src/pages/dashboards/branch/Suppliers.jsx
import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useFetch, apiFetch, toast, Icon, Modal, TblSk } from "../../../components/branch/BranchShared";

const Suppliers = () => {
  const { user } = useOutletContext();
  const branchId = user?.branchId;

  const { data: suppliersRes, loading, refetch } = useFetch(
    branchId ? `/suppliers?limit=50&page=1` : null,
    [branchId]
  );
  const suppliers = suppliersRes?.data ?? suppliersRes ?? [];

  const [showSupModal, setShowSupModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [showPOModal, setShowPOModal] = useState(null);
  const [partsData, setPartsData] = useState(null);
  const [partsLoading, setPartsLoading] = useState(false);
  const [supForm, setSupForm] = useState({ name: "", contact: "" });
  const [poForm, setPoForm] = useState({ items: [{ partId: "", quantity: 1, cost: "" }] });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!showPOModal) {
      setPartsData(null);
      return;
    }
    let cancelled = false;
    setPartsLoading(true);
    apiFetch("/parts?limit=50&page=1")
      .then((data) => {
        if (!cancelled) setPartsData(data);
      })
      .catch((e) => {
        if (!cancelled) toast(e.message, "e");
      })
      .finally(() => {
        if (!cancelled) setPartsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showPOModal]);

  const openRegisterModal = () => {
    setEditingSupplier(null);
    setSupForm({ name: "", contact: "" });
    setShowSupModal(true);
  };

  const openEditModal = (supplier) => {
    setEditingSupplier(supplier);
    setSupForm({ name: supplier.name, contact: supplier.contact });
    setShowSupModal(true);
  };

  const closeSupModal = () => {
    setShowSupModal(false);
    setEditingSupplier(null);
    setSupForm({ name: "", contact: "" });
  };

  const submitSupplier = async () => {
    if (!supForm.name || !supForm.contact) return toast("Name and contact required", "e");
    setSaving(true);
    try {
      if (editingSupplier) {
        await apiFetch(`/suppliers/${editingSupplier.id}`, {
          method: "PUT",
          body: { name: supForm.name, contact: supForm.contact },
        });
        toast("Supplier updated");
      } else {
        await apiFetch("/suppliers", { method: "POST", body: { ...supForm, branchId: Number(branchId) } });
        toast("Supplier registered");
      }
      closeSupModal();
      refetch();
    } catch (e) {
      toast(e.message, "e");
    }
    setSaving(false);
  };

  const deleteSupplier = async (supplier) => {
    if (!window.confirm(`Delete supplier "${supplier.name}"? This cannot be undone.`)) return;
    try {
      await apiFetch(`/suppliers/${supplier.id}`, { method: "DELETE" });
      toast("Supplier deleted");
      refetch();
    } catch (e) {
      toast(e.message, "e");
    }
  };

  const addPOItem = () => setPoForm((f) => ({ ...f, items: [...f.items, { partId: "", quantity: 1, cost: "" }] }));
  const removePOItem = (i) => setPoForm((f) => ({ ...f, items: f.items.filter((_, j) => j !== i) }));
  const updatePOItem = (i, key, val) =>
    setPoForm((f) => ({ ...f, items: f.items.map((it, j) => (j === i ? { ...it, [key]: val } : it)) }));

  const submitPO = async () => {
    const items = poForm.items.filter((i) => i.partId && i.cost);
    if (!items.length) return toast("Add at least one item", "e");
    setSaving(true);
    try {
      const total = items.reduce((acc, i) => acc + parseFloat(i.cost) * parseInt(i.quantity || 1, 10), 0);
      await apiFetch("/purchases", {
        method: "POST",
        body: {
          supplierId: showPOModal.id,
          branchId: Number(branchId),
          total,
          items: items.map((i) => ({
            partId: Number(i.partId),
            quantity: Number(i.quantity) || 1,
            cost: parseFloat(i.cost),
          })),
        },
      });
      toast("Purchase order created");
      setShowPOModal(null);
    } catch (e) {
      toast(e.message, "e");
    }
    setSaving(false);
  };

  return (
    <div className="branch-page">
      <div className="ph">
        <div className="ph-l">
          <div className="eyebrow">Supply Chain</div>
          <div className="ptitle">SUPPLIERS</div>
          <div className="psub">Authorized part providers · {(Array.isArray(suppliers) ? suppliers : []).length} registered</div>
        </div>
        <div className="ph-r">
          <button className="btn btn-p" onClick={openRegisterModal}>
            <Icon n="plus" /> Register Supplier
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="sk" style={{ height: 160, borderRadius: 20 }} />
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
          {(Array.isArray(suppliers) ? suppliers : []).map((s) => (
            <div key={s.id} className="card ci" style={{ transition: "border-color .2s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: "rgba(234,179,8,.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--yellow)",
                  }}
                >
                  <Icon n="truck" size={18} />
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    className="btn-ico"
                    title="Edit supplier"
                    onClick={() => openEditModal(s)}
                  >
                    <Icon n="edit" size={13} />
                  </button>
                  <button
                    type="button"
                    className="btn-ico dng"
                    title="Delete supplier"
                    onClick={() => deleteSupplier(s)}
                  >
                    <Icon n="trash" size={13} />
                  </button>
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>{s.contact}</div>
              <button
                className="btn btn-s btn-sm"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => {
                  setPoForm({ items: [{ partId: "", quantity: 1, cost: "" }] });
                  setShowPOModal(s);
                }}
              >
                <Icon n="truck" /> Create Purchase Order
              </button>
            </div>
          ))}
          {(Array.isArray(suppliers) ? suppliers : []).length === 0 && (
            <div className="empty" style={{ gridColumn: "1/-1" }}>
              <Icon n="truck" size={36} />
              <div className="empty-t">No suppliers registered</div>
            </div>
          )}
        </div>
      )}

      {showSupModal && (
        <Modal
          title={editingSupplier ? "EDIT SUPPLIER" : "REGISTER SUPPLIER"}
          onClose={closeSupModal}
          footer={
            <>
              <button className="btn btn-s btn-sm" onClick={closeSupModal}>
                Cancel
              </button>
              <button className="btn btn-p btn-sm" onClick={submitSupplier} disabled={saving}>
                {saving ? "Saving…" : editingSupplier ? "Save Changes" : "Register"}
              </button>
            </>
          }
        >
          <div className="fg">
            <label>Company Name *</label>
            <input
              value={supForm.name}
              onChange={(e) => setSupForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. ProCycle Parts Ltd."
            />
          </div>
          <div className="fg">
            <label>Contact (Phone / Email) *</label>
            <input
              value={supForm.contact}
              onChange={(e) => setSupForm((f) => ({ ...f, contact: e.target.value }))}
              placeholder="e.g. +1 555 0123"
            />
          </div>
        </Modal>
      )}

      {showPOModal && (
        <Modal
          title={`PURCHASE ORDER — ${showPOModal.name}`}
          onClose={() => setShowPOModal(null)}
          wide
          footer={
            <>
              <button className="btn btn-s btn-sm" onClick={() => setShowPOModal(null)}>
                Cancel
              </button>
              <button className="btn btn-p btn-sm" onClick={submitPO} disabled={saving}>
                {saving ? "Creating…" : "Create PO"}
              </button>
            </>
          }
        >
          <div
            style={{
              marginBottom: 10,
              fontWeight: 700,
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: ".1em",
              color: "var(--muted)",
            }}
          >
            Order Items
          </div>
          {partsLoading && <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>Loading parts…</div>}
          {poForm.items.map((item, i) => (
            <div key={i} className="fr3" style={{ marginBottom: 8, alignItems: "center" }}>
              <select value={item.partId} onChange={(e) => updatePOItem(i, "partId", e.target.value)}>
                <option value="">— Part —</option>
                {partsData?.data?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updatePOItem(i, "quantity", e.target.value)}
                placeholder="Qty"
              />
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.cost}
                  onChange={(e) => updatePOItem(i, "cost", e.target.value)}
                  placeholder="Unit cost"
                />
                <button className="btn-ico dng" onClick={() => removePOItem(i)}>
                  <Icon n="trash" size={13} />
                </button>
              </div>
            </div>
          ))}
          <button className="btn btn-s btn-sm" style={{ marginTop: 6 }} onClick={addPOItem}>
            <Icon n="plus" /> Add Item
          </button>
          {poForm.items.some((i) => i.cost && i.quantity) && (
            <div
              style={{
                marginTop: 14,
                padding: "12px 14px",
                background: "var(--surf2)",
                borderRadius: "var(--r-md)",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Total: $
              {poForm.items
                .reduce((acc, i) => acc + (parseFloat(i.cost) || 0) * (parseInt(i.quantity, 10) || 1), 0)
                .toFixed(2)}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

export default Suppliers;
