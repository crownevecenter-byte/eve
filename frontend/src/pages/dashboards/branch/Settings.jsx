// frontend/src/pages/dashboards/branch/Settings.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { useFetch, apiFetch, toast, Icon, Modal, TblSk } from "../../../components/branch/BranchShared";

const Settings = () => {
  const { user } = useOutletContext();
  const branchId = user?.branchId;

  // 1. Branch Details Logic
  const { data: settingsBundle, loading: bLoading, refetch: bRefetch } = useFetch(
    `/branches/${branchId}/settings-bundle`,
    [branchId]
  );
  const branch = settingsBundle?.branch;
  const banks = settingsBundle?.banks;
  const [bForm, setBForm] = useState({ phone: "", whatsapp: "", address: "", mapLink: "" });
  const [bSaving, setBSaving] = useState(false);

  useEffect(() => {
    if (branch) {
      const [address, mapLink] = (branch.location || "").split("|");
      setBForm({
        phone: branch.phone || "",
        whatsapp: branch.whatsapp || "",
        address: address?.trim() || "",
        mapLink: mapLink?.trim() || ""
      });
    }
  }, [branch]);

  const saveBranch = async () => {
    setBSaving(true);
    try {
      const payload = {
        phone: bForm.phone,
        whatsapp: bForm.whatsapp,
        location: `${bForm.address.trim()}|${bForm.mapLink.trim()}`
      };
      await apiFetch(`/branches/${branchId}`, { method: "PUT", body: payload });
      toast("Branch details updated");
      bRefetch();
    } catch (e) { toast(e.message, "e"); }
    setBSaving(false);
  };

  // 2. Bank Accounts Logic
  const bkLoading = bLoading;
  const bkRefetch = bRefetch;
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [bkForm, setBkForm] = useState({ name: "", account_title: "", account_number: "", branchId });
  const [bkSaving, setBkSaving] = useState(false);

  const handleOpenBank = (bank = null) => {
    setEditing(bank);
    setBkForm(bank || { name: "", account_title: "", account_number: "", branchId });
    setShowModal(true);
  };

  const handleSaveBank = async () => {
    setBkSaving(true);
    try {
      if (editing) {
        await apiFetch(`/banks/${editing.id}`, { method: "PUT", body: bkForm });
        toast("Bank updated");
      } else {
        await apiFetch("/banks", { method: "POST", body: { ...bkForm, branchId: Number(branchId) } });
        toast("Bank added");
      }
      bkRefetch();
      setShowModal(false);
    } catch (e) { toast(e.message, "e"); }
    setBkSaving(false);
  };

  const handleDeleteBank = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await apiFetch(`/banks/${id}`, { method: "DELETE" });
      toast("Bank deleted");
      bkRefetch();
    } catch (e) { toast(e.message, "e"); }
  };

  return (
    <div className="branch-page">
      <div className="ph">
        <div className="ph-l">
          <div className="eyebrow">Administration</div>
          <div className="ptitle">SYSTEM SETTINGS</div>
          <div className="psub">Manage branch details and financial accounts</div>
        </div>
      </div>

      <div className="dash-row">
        {/* Branch Details Form */}
        <div className="card" style={{ flex: 1 }}>
          <div className="ch"><div className="ct">Branch Details</div></div>
          <div className="ci">
            {bLoading ? <TblSk rows={3} /> : (
              <>
                <div className="fgrid">
                  <div className="fg"><label>Cell Number</label><input className="fi" value={bForm.phone} onChange={e => setBForm({...bForm, phone: e.target.value})} placeholder="03xx xxxxxxx" /></div>
                  <div className="fg"><label>WhatsApp Number</label><input className="fi" value={bForm.whatsapp} onChange={e => setBForm({...bForm, whatsapp: e.target.value})} placeholder="923xxxxxxxxx" /></div>
                </div>
                <div className="fg"><label>Physical Location / Address</label><textarea className="fi" value={bForm.address} onChange={e => setBForm({...bForm, address: e.target.value})} placeholder="e.g. 225 E State St, Montrose, MI 48457" /></div>
                <div className="fg" style={{ marginTop: 12 }}><label>Google Maps Location Link</label><input className="fi" value={bForm.mapLink} onChange={e => setBForm({...bForm, mapLink: e.target.value})} placeholder="e.g. https://maps.app.goo.gl/oZXrwc9EY9rT13j58" /></div>
                
                {bForm.mapLink && (
                  <div style={{ marginTop: 14, background: 'rgba(230,81,0,0.04)', border: '1px dashed rgba(230,81,0,0.2)', padding: '10px 14px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>📍</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>Google Maps Location Bound</div>
                      <a href={bForm.mapLink} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--acc)', fontWeight: 700, textDecoration: 'none' }}>
                        Test Pinned Link &rarr;
                      </a>
                    </div>
                  </div>
                )}

                <button className="btn btn-primary" style={{ marginTop: 20 }} disabled={bSaving} onClick={saveBranch}>{bSaving ? "Saving..." : "Update Details"}</button>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 32 }}>
        <div className="ph" style={{ marginBottom: 16 }}>
          <div className="ph-l"><div className="ct" style={{ fontSize: 20 }}>Bank Accounts</div></div>
          <div className="ph-r">
            <button className="btn btn-s btn-sm" onClick={() => handleOpenBank()}><Icon n="plus" /> Add Account</button>
          </div>
        </div>
        
        <div className="tw">
          {bkLoading ? <TblSk rows={3} /> : (
            <table>
              <thead><tr><th>Bank Name</th><th>Account Title</th><th>Account Number</th><th style={{ textAlign: "right" }}>Actions</th></tr></thead>
              <tbody>
                {banks?.data?.map(b => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 700 }}>{b.name}</td>
                    <td>{b.account_title}</td>
                    <td className="mono">{b.account_number}</td>
                    <td>
                      <div className="tda" style={{ justifyContent: "flex-end" }}>
                        <button className="btn-ico" onClick={() => handleOpenBank(b)}><Icon n="edit" /></button>
                        <button className="btn-ico dng" onClick={() => handleDeleteBank(b.id)}><Icon n="trash" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!banks?.data || banks?.data?.length === 0) && <tr><td colSpan={4}><div className="empty">No bank accounts added.</div></td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <Modal title={editing ? "Edit Bank" : "Add Bank"} onClose={() => setShowModal(false)}>
          <div className="fgrid">
            <div className="fg"><label>Bank Name</label><input className="fi" value={bkForm.name} onChange={e => setBkForm({...bkForm, name: e.target.value})} placeholder="e.g. Meezan Bank" /></div>
            <div className="fg"><label>Account Title</label><input className="fi" value={bkForm.account_title} onChange={e => setBkForm({...bkForm, account_title: e.target.value})} placeholder="Account holder name" /></div>
          </div>
          <div className="fg" style={{ marginTop: 12 }}><label>Account Number / IBAN</label><input className="fi" value={bkForm.account_number} onChange={e => setBkForm({...bkForm, account_number: e.target.value})} placeholder="0000 0000 0000" /></div>
          
          <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" style={{ flex: 1 }} disabled={bkSaving} onClick={handleSaveBank}>{bkSaving ? "Saving..." : "Save Bank"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Settings;
