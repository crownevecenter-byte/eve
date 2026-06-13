// frontend/src/pages/dashboards/branch/Appointments.jsx
import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useFetch, apiFetch, toast, Icon, Modal, TblSk, APPT_BADGE } from "../../../components/branch/BranchShared";
import FilterRadioGroup from "../../../components/FilterRadioGroup";

const Appointments = () => {
  const { user } = useOutletContext();
  const branchId = user?.branchId;

  const [view, setView]     = useState("list");
  const [page, setPage]     = useState(1);
  const [statusF, setStatusF] = useState("");
  const params = new URLSearchParams({ branchId, page, limit: 12, ...(statusF && { status: statusF }) }).toString();
  const { data: pageInit, loading, refetch } = useFetch(`/appointments/page-init?${params}`, [page, statusF, branchId]);
  const data = pageInit?.appointments;
  const employees = pageInit?.technicians;
  const [editAppt, setEditAppt] = useState(null);
  const [saving, setSaving]     = useState(false);

  const technicianList = Array.isArray(employees) ? employees : [];
  const APPT_STATUSES  = ["PENDING", "BOOKED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

  const updateAppt = async () => {
    if (!editAppt) return;
    setSaving(true);
    try {
      await apiFetch(`/appointments/${editAppt.id}`, { method: "PUT", body: { status: editAppt.status, techId: editAppt.techId ? Number(editAppt.techId) : undefined } });
      toast("Appointment updated");
      setEditAppt(null); refetch();
    } catch (e) { toast(e.message, "e"); }
    setSaving(false);
  };

  // Build a mini calendar day-dot map from current data
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const apptDays = new Set((data?.data || []).map(a => new Date(a.scheduledAt).getDate()));

  return (
    <div className="branch-page">
      <div className="ph">
        <div className="ph-l">
          <div className="eyebrow">Bookings</div>
          <div className="ptitle">SERVICE BAY</div>
          <div className="psub">Managing technical appointments · {data?.meta?.total || 0} total</div>
        </div>
        <div className="ph-r">
          <FilterRadioGroup
            name="appointments-view"
            value={view}
            onChange={setView}
            compact
            options={[
              { value: "list", label: "List" },
              { value: "calendar", label: "Calendar" },
            ]}
          />
        </div>
      </div>

      {/* Status filter */}
      <div className="fbar">
        <FilterRadioGroup
          name="appointments-status"
          value={statusF}
          onChange={(v) => { setStatusF(v); setPage(1); }}
          compact
          wrap
          options={[
            { value: "", label: "All" },
            ...APPT_STATUSES.map((s) => ({ value: s, label: s })),
          ]}
        />
      </div>

      {view === "list" ? (
        <div className="tw">
          {loading ? <TblSk rows={8} /> : (
            <table>
              <thead><tr><th>Service</th><th>Customer</th><th>Technician</th><th>Scheduled</th><th>Status</th><th style={{ textAlign: "right" }}>Manage</th></tr></thead>
              <tbody>
                {data?.data?.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600 }}>{a.service?.name}</td>
                    <td style={{ fontSize: 12 }}>
                      <div style={{ fontWeight: 700 }}>{a.customer?.name}</div>
                      {a.customer_notes && (
                        <div style={{ color: 'var(--muted)', fontSize: 10, marginTop: 4 }}>
                          {a.customer_notes}
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: 12, color: a.technician ? "inherit" : "var(--muted)" }}>{a.technician?.name || "Unassigned"}</td>
                    <td style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-m)" }}>
                      {new Date(a.scheduledAt).toLocaleDateString()} {new Date(a.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td><span className={`badge ${APPT_BADGE[a.status] || "bg-b"}`}>{a.status}</span></td>
                    <td>
                      <div className="tda">
                        <button className="btn-ico act" onClick={() => setEditAppt({ id: a.id, status: a.status, techId: a.techId || "" })}><Icon n="edit" size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {data?.data?.length === 0 && <tr><td colSpan={6}><div className="empty"><Icon n="appointments" size={36} /><div className="empty-t">No appointments</div></div></td></tr>}
              </tbody>
            </table>
          )}
          <div className="pag">
            <div className="pag-info">Showing {data?.data?.length || 0} of {data?.meta?.total || 0}</div>
            <div className="pag-ctrl">
              <button className="pb" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
              <button className="pb" disabled={page >= (data?.meta?.totalPages || 1)} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card ci">
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <div style={{ fontFamily: "var(--font-d)", fontSize: 28, letterSpacing: ".05em" }}>
              {today.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 8 }}>
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: 9, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".1em" }}>{d}</div>
            ))}
          </div>
          <div className="cal-grid">
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday = day === today.getDate();
              const hasAppt = apptDays.has(day);
              return (
                <div key={day} className={`cal-day ${isToday ? "today" : ""}`}>
                  {day}
                  {hasAppt && <div className="dot" />}
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 14, fontSize: 11, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, background: "var(--acc)", borderRadius: "50%" }} /> Blue dots indicate appointment days
          </div>
        </div>
      )}

      {editAppt && (
        <Modal title="UPDATE APPOINTMENT" onClose={() => setEditAppt(null)}
          footer={<>
            <button className="btn btn-s btn-sm" onClick={() => setEditAppt(null)}>Cancel</button>
            <button className="btn btn-p btn-sm" onClick={updateAppt} disabled={saving}>{saving ? "Saving…" : "Update"}</button>
          </>}
        >
          <div className="fg"><label>Status</label>
            <select value={editAppt.status} onChange={e => setEditAppt(v => ({ ...v, status: e.target.value }))}>
              {APPT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="fg"><label>Assign Technician</label>
            <select value={editAppt.techId} onChange={e => setEditAppt(v => ({ ...v, techId: e.target.value }))}>
              <option value="">— Unassigned —</option>
              {technicianList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Appointments;
