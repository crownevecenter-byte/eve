// frontend/src/pages/dashboards/owner/Branches.jsx
import React, { useState } from "react";
import { useFetch, api, toast, Icon, Sk, Modal } from "../../../components/owner/OwnerShared";

/**
 * Branches Management Page
 * Allows Company Owner to manage global branch network.
 */
const BranchesPage = () => {
  // Fetch branches with a high limit to show all
  const { data: branchData, loading, refetch } = useFetch("/branches?limit=100");
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteAck, setDeleteAck] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ name: "", location: "" });
  const [saving, setSaving] = useState(false);

  const openDelete = (branch) => {
    setDeleteTarget(branch);
    setDeleteAck(false);
  };

  const closeDelete = () => {
    if (deleting) return;
    setDeleteTarget(null);
    setDeleteAck(false);
  };

  const openAdd = () => { 
    setForm({ name: "", location: "" }); 
    setEditTarget(null); 
    setShowModal(true); 
  };

  const openEdit = (b) => { 
    setForm({ name: b.name, location: b.location }); 
    setEditTarget(b); 
    setShowModal(true); 
  };

  const submit = async () => {
    if (!form.name || !form.location) return toast("Branch name and location are required", "error");
    setSaving(true);
    try {
      if (editTarget) {
        await api(`/branches/${editTarget.id}`, { method: "PUT", body: form });
        toast("Branch details updated successfully");
      } else {
        await api("/branches", { method: "POST", body: form });
        toast("New branch established in the network");
      }
      setShowModal(false);
      refetch();
    } catch (e) { 
      toast(e.message, "error"); 
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    setDeleting(true);
    try {
      await api(`/branches/${id}`, { method: "DELETE" });
      const fresh = await api(`/branches?limit=100&_t=${Date.now()}`);
      const stillThere = (fresh?.data || []).some((b) => b.id === id);
      if (stillThere) {
        throw new Error("Branch is still on the server after delete. Please refresh and try again.");
      }
      toast("Branch decommissioned from network");
      await refetch();
      setDeleteTarget(null);
      setDeleteAck(false);
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setDeleting(false);
    }
  };

  const branches = branchData?.data || [];

  return (
    <div className="page" id="branches-management-view">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Network Architecture</div>
          <div className="page-title">BRANCH NODES</div>
          <div className="page-sub">Global distribution and facility management — {branches.length} active nodes</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={openAdd}>
            <Icon name="plus" /> New Branch
          </button>
        </div>
      </div>

      {loading ? (
        <div className="branch-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="branch-card skeleton-card">
              <Sk h={180} r={24} />
            </div>
          ))}
        </div>
      ) : (
        <>
          {branches.length === 0 ? (
            <div className="empty-state-container">
              <div className="empty">
                <div className="empty-icon-wrap">
                  <Icon name="branches" size={48} />
                </div>
                <div className="empty-title">No Branch Nodes Found</div>
                <div className="empty-sub">Initialize your global network by adding your first branch location.</div>
                <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={openAdd}>
                  <Icon name="plus" /> Initialize First Branch
                </button>
              </div>
            </div>
          ) : (
            <div className="branch-grid">
              {branches.map(b => (
                <div key={b.id} className="branch-card premium-card">
                  <div className="branch-card-accent" style={{ background: "var(--accent)" }} />
                  
                  <div className="branch-card-header">
                    <div className="branch-icon-box">
                      <Icon name="branches" size={24} />
                    </div>
                    <div className="branch-main-info">
                      <h3 className="branch-name">{b.name}</h3>
                      <p className="branch-location">
                        <Icon name="search" size={12} /> {b.location}
                      </p>
                    </div>
                    <div className="branch-card-actions">
                      <button className="btn-icon" onClick={() => openEdit(b)} title="Edit Configuration">
                        <Icon name="edit" size={14} />
                      </button>
                      <button className="btn-icon danger" onClick={() => openDelete(b)} title="Decommission Branch">
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="branch-metrics">
                    <div className="metric-box">
                      <span className="metric-label">Personnel</span>
                      <span className="metric-value">{b._count?.users || 0}</span>
                    </div>
                    <div className="metric-box">
                      <span className="metric-label">Assets</span>
                      <span className="metric-value">{b._count?.products || 0}</span>
                    </div>
                  </div>

                  <div className="branch-card-footer">
                    <span className="node-id">NODE_ID: #{b.id.toString().padStart(3, '0')}</span>
                    <span className="timestamp">Active since {new Date(b.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showModal && (
        <Modal 
          title={editTarget ? "CONFIGURE BRANCH" : "INITIALIZE BRANCH"} 
          onClose={() => !saving && setShowModal(false)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={submit} disabled={saving}>
              {saving ? "Processing..." : (editTarget ? "Update Node" : "Initialize Node")}
            </button>
          </>}
        >
          <div className="premium-form">
            <div className="form-group">
              <label>Identifying Name</label>
              <input 
                value={form.name} 
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
                placeholder="e.g. Manhattan Central" 
                autoFocus
              />
              <small>Choose a unique identifier for this facility.</small>
            </div>
            <div className="form-group">
              <label>Geographic Location</label>
              <input 
                value={form.location} 
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))} 
                placeholder="City, Region or Full Address" 
              />
              <small>The physical operational address of this node.</small>
            </div>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <Modal
          title="DELETE BRANCH?"
          onClose={closeDelete}
          footer={
            <>
              <button className="btn btn-secondary" onClick={closeDelete} disabled={deleting}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => remove(deleteTarget.id)}
                disabled={!deleteAck || deleting}
              >
                {deleting ? "Deleting…" : "Delete Branch"}
              </button>
            </>
          }
        >
          <div
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: "var(--r-md)",
              padding: "16px",
              marginBottom: "18px",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <Icon name="trash" size={18} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: "var(--red)" }}>
                  Permanent deletion warning
                </div>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "var(--text)" }}>
                  If you delete <strong>{deleteTarget.name}</strong>, all{" "}
                  <strong>{deleteTarget._count?.products || 0} products</strong> in this branch will also be
                  permanently deleted, along with orders, inventory, appointments, accounts, and other linked data.
                </p>
              </div>
            </div>
          </div>

          <p style={{ margin: "0 0 14px", fontSize: 13, lineHeight: 1.55, color: "var(--muted)" }}>
            <strong style={{ color: "var(--text)" }}>Before deleting:</strong> transfer your products to another
            branch first (via Branch Dashboard → Products / Inventory), then come back and delete this branch.
          </p>

          <p style={{ margin: "0 0 16px", fontSize: 13, lineHeight: 1.55, color: "var(--muted)" }}>
            This action cannot be undone. Personnel on this branch will be unassigned, not deleted.
          </p>

          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              fontSize: 13,
              lineHeight: 1.45,
              cursor: deleting ? "not-allowed" : "pointer",
              userSelect: "none",
            }}
          >
            <input
              type="checkbox"
              checked={deleteAck}
              disabled={deleting}
              onChange={(e) => setDeleteAck(e.target.checked)}
              style={{ marginTop: 3, accentColor: "var(--accent)" }}
            />
            <span>
              I understand that all products and related branch data will be permanently deleted, or I have already
              transferred them to another branch.
            </span>
          </label>
        </Modal>
      )}
    </div>
  );
};

export default BranchesPage;
