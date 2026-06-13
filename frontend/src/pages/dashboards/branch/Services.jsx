import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useFetch, apiFetch, toast, Icon, Modal, Confirm, useDebounce, APPT_BADGE } from "../../../components/branch/BranchShared";
import ServiceThermalReceipt from "../../../components/branch/ServiceThermalReceipt";
import SearchInput from "../../../components/SearchInput";
import FilterRadioGroup from "../../../components/FilterRadioGroup";

const get6DigitId = (idString) => {
  if (!idString) return "000000";
  let hash = 0;
  for (let i = 0; i < idString.length; i++) {
    hash = idString.charCodeAt(i) + ((hash << 5) - hash);
  }
  const code = (Math.abs(hash) % 900000) + 100000;
  return String(code);
};

const Services = () => {
  const { user } = useOutletContext();
  const branchId = user?.branchId;

  const { data: bookings, loading, refetch } = useFetch(`/appointments?branchId=${branchId}&limit=100`, [branchId]);

  const [activeTab, setActiveTab] = useState("bookings");
  const [editAppt, setEditAppt] = useState(null);
  const [billAppt, setBillAppt] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [saving, setSaving]     = useState(false);
  const [invoice, setInvoice]   = useState(null);
  const [activeReceipt, setActiveReceipt] = useState(null);

  // Parts Search States
  const [partSearch, setPartSearch] = useState("");
  const [partResults, setPartResults] = useState([]);
  const debouncedPartSearch = useDebounce(partSearch, 300);

  // Filter States
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterDate, setFilterDate] = useState("");
  const [filterTime, setFilterTime] = useState("");

  const format12Hour = (timeStr) => {
    if (!timeStr) return "";
    if (timeStr === "ASAP") return "ASAP";
    const [hoursStr, minutesStr] = timeStr.split(":");
    let hours = parseInt(hoursStr, 10);
    const minutes = minutesStr || "00";
    if (isNaN(hours)) return timeStr;
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hoursFormatted = hours < 10 ? `0${hours}` : hours;
    return `${hoursFormatted}:${minutes} ${ampm}`;
  };

  useEffect(() => {
    const searchParts = async () => {
      if (!debouncedPartSearch || debouncedPartSearch.trim().length < 2) {
        setPartResults([]);
        return;
      }
      try {
        const res = await apiFetch(`/products?branchId=${branchId}&search=${encodeURIComponent(debouncedPartSearch)}&limit=10`);
        setPartResults(res.data || []);
      } catch (e) {
        console.error(e);
      }
    };
    searchParts();
  }, [debouncedPartSearch, branchId]);

  const addPartToBill = (product) => {
    if (!billAppt) return;
    if (product.stock_qty <= 0) {
      toast(`Insufficient stock for "${product.name}"`, "e");
      return;
    }
    const selectedParts = billAppt.selectedParts || [];
    const existingIndex = selectedParts.findIndex(p => p.id === product.id);
    let newParts = [];
    if (existingIndex > -1) {
      const maxStock = selectedParts[existingIndex].stock ?? product.stock_qty;
      if (selectedParts[existingIndex].qty + 1 > maxStock) {
        toast(`Only ${maxStock} unit(s) available in stock`, "e");
        return;
      }
      newParts = [...selectedParts];
      newParts[existingIndex].qty += 1;
    } else {
      newParts = [
        ...selectedParts,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          model: product.partDetail?.model || "",
          item_code: product.partDetail?.item_code || "",
          stock: product.stock_qty,
          qty: 1
        }
      ];
    }
    const partsTotal = newParts.reduce((sum, item) => sum + (item.price * item.qty), 0);
    setBillAppt({
      ...billAppt,
      selectedParts: newParts,
      parts: partsTotal
    });
    setPartSearch("");
    setPartResults([]);
  };

  const updatePartQty = (index, newQty) => {
    if (!billAppt) return;
    const selectedParts = [...(billAppt.selectedParts || [])];
    if (newQty < 1) return;
    selectedParts[index].qty = Number(newQty);
    const partsTotal = selectedParts.reduce((sum, item) => sum + (item.price * item.qty), 0);
    setBillAppt({
      ...billAppt,
      selectedParts,
      parts: partsTotal
    });
  };

  const removePartFromBill = (index) => {
    if (!billAppt) return;
    const selectedParts = (billAppt.selectedParts || []).filter((_, i) => i !== index);
    const partsTotal = selectedParts.reduce((sum, item) => sum + (item.price * item.qty), 0);
    setBillAppt({
      ...billAppt,
      selectedParts,
      parts: partsTotal
    });
  };

  const remove = async id => {
    try { await apiFetch(`/appointments/${id}`, { method: "DELETE" }); toast("Booking deleted"); refetch(); }
    catch (e) { toast(e.message, "e"); }
    setConfirmId(null);
  };

  const updateAppt = async () => {
    if (!editAppt) return;
    
    // Past scheduling validation
    if (editAppt.booking_date) {
      const selectedDate = new Date(editAppt.booking_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        toast("Cannot schedule appointments in a past date", "e");
        return;
      }
      
      if (selectedDate.getTime() === today.getTime() && editAppt.booking_time) {
        const [h, m] = editAppt.booking_time.split(":");
        const selectedDateTime = new Date();
        selectedDateTime.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
        
        if (selectedDateTime < new Date()) {
          toast("Cannot schedule appointments in a past time for today", "e");
          return;
        }
      }
    }

    setSaving(true);
    try {
      await apiFetch(`/appointments/${editAppt.id}`, { 
        method: "PUT", 
        body: { 
          status: editAppt.status,
          booking_date: editAppt.booking_date,
          booking_time: editAppt.booking_time
        } 
      });
      toast("Appointment updated successfully");
      setEditAppt(null); refetch();
    } catch (e) { toast(e.message, "e"); }
    setSaving(false);
  };

  // Handle both direct array or object-wrapped data
  const bookingList = Array.isArray(bookings) ? bookings : (bookings?.data || []);
  
  // Sort bookings oldest first
  const sortedBookings = [...bookingList].sort((a, b) => new Date(a.booking_date) - new Date(b.booking_date));
  const APPT_STATUSES  = ["PENDING", "BOOKED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

  const filteredBookings = sortedBookings.filter(b => {
    // 1. Status Filter
    if (filterStatus !== "ALL" && b.status?.toUpperCase() !== filterStatus) return false;
    
    // 2. Date Filter
    if (filterDate) {
      const bDateStr = new Date(b.booking_date).toISOString().split('T')[0];
      if (bDateStr !== filterDate) return false;
    }
    
    // 3. Time Filter
    if (filterTime) {
      const time12 = format12Hour(b.booking_time).toLowerCase();
      const time24 = (b.booking_time || "").toLowerCase();
      const searchTime = filterTime.toLowerCase();
      if (!time12.includes(searchTime) && !time24.includes(searchTime)) return false;
    }
    
    return true;
  });

  return (
    <div className="branch-page">
      <div className="ph">
        <div className="ph-l">
          <div className="eyebrow">Service Lab</div>
          <div className="ptitle">BOOKED SERVICES</div>
          <div className="psub">Overview of customer service requests</div>
        </div>
      </div>

      {loading ? (
        <div className="g4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="sk" style={{ height: 200, borderRadius: 24 }} />)}
        </div>
      ) : (
        <div className="tab-content">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 18 }}>Active Requests</div>
          </div>

          {/* Advanced Filtering Control Panel */}
          <div style={{ 
            background: 'var(--surf1)', 
            border: '1px solid var(--border)', 
            borderRadius: 20, 
            padding: 20, 
            marginBottom: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>
            {/* Status Tabs Row */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.05em' }}>Filter by Status</label>
              <FilterRadioGroup
                name="services-status"
                value={filterStatus}
                onChange={setFilterStatus}
                compact
                wrap
                options={[
                  { value: "ALL", label: "All Requests" },
                  ...APPT_STATUSES.map((s) => ({
                    value: s,
                    label: s.replace("_", " "),
                  })),
                ]}
              />
            </div>

            {/* Date & Time Filters Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div className="fg" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>Filter by Date</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="date" 
                    value={filterDate}
                    onChange={e => setFilterDate(e.target.value)}
                    style={{ width: '100%', borderRadius: 12, paddingRight: 40 }}
                  />
                  {filterDate && (
                    <button 
                      type="button" 
                      onClick={() => setFilterDate("")}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <div className="fg" style={{ marginBottom: 0 }}>
                <SearchInput
                  value={filterTime}
                  onChange={(e) => setFilterTime(e.target.value)}
                  label="Search time (e.g. AM, PM, 17:53...)"
                  clearable
                  onClear={() => setFilterTime('')}
                />
              </div>
            </div>
          </div>

          <div className="g4">
            {filteredBookings.map(b => (
              <div key={b.id} className="card ci" style={{ padding: 24, transition: "all .3s ease", border: "1px solid var(--border)", position: "relative", background: "var(--card)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, alignItems: "flex-start" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(14,165,233,.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--acc)" }}>
                    <Icon n="wrench" size={22} />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn-ico" onClick={() => setEditAppt({ 
                      id: b.id, 
                      status: b.status, 
                      booking_date: b.booking_date ? new Date(b.booking_date).toISOString().split('T')[0] : "", 
                      booking_time: b.booking_time || "" 
                    })}><Icon n="edit" size={14} /></button>
                    <button className="btn-ico dng" onClick={() => setConfirmId(b.id)}><Icon n="trash" size={14} /></button>
                  </div>
                </div>

                <div style={{ marginBottom: 15 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <span className={`badge ${APPT_BADGE[b.status] || "bg-y"}`} style={{ fontSize: 9, fontWeight: 700 }}>{b.status?.toUpperCase()}</span>
                    <span style={{ fontSize: 11, fontFamily: "var(--font-m)", fontWeight: 900, color: "var(--acc)", background: "rgba(230,81,0,0.06)", padding: "2px 8px", borderRadius: 6, letterSpacing: 0.5 }}>
                      #{get6DigitId(b.id)}
                    </span>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 18, color: "var(--text)" }}>{b.customer?.name}</div>
                  <div style={{ fontSize: 13, color: "var(--acc)", fontWeight: 700, marginTop: 4, marginBottom: 12 }}>{b.service?.name}</div>
                  
                  {/* Clickable Appointment Schedule Banner */}
                  <div 
                    onClick={() => setEditAppt({ 
                      id: b.id, 
                      status: b.status, 
                      booking_date: b.booking_date ? new Date(b.booking_date).toISOString().split('T')[0] : "", 
                      booking_time: b.booking_time || "" 
                    })}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 8, 
                      padding: '8px 12px', 
                      background: 'rgba(230, 81, 0, 0.05)', 
                      border: '1px dashed rgba(230, 81, 0, 0.2)', 
                      borderRadius: '10px', 
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'left'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(230, 81, 0, 0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(230, 81, 0, 0.05)'}
                  >
                    <Icon n="calendar" size={14} style={{ color: 'var(--acc)' }} />
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>
                      {new Date(b.booking_date).toLocaleDateString('en-GB')} {b.booking_time ? `@ ${format12Hour(b.booking_time)}` : "— Click to Schedule Time —"}
                    </div>
                    <Icon n="edit" size={10} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '14px', border: '1px solid var(--border)' }}>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Phone / Cell</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                      {b.customer_notes?.split('|')[0]?.replace('Cell:', '')?.trim() || "N/A"}
                    </div>
                  </div>
                  {b.customer_notes?.includes('WhatsApp:') && (
                    <a 
                      href={`https://wa.me/${b.customer_notes.split('WhatsApp:')[1].trim().replace(/\D/g, '')}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="btn-ico"
                      style={{ background: '#25D366', color: 'white', borderRadius: '10px', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(37, 211, 102, 0.2)' }}
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.964 9.964 0 001.333 4.993L2 22l5.233-1.237a9.994 9.994 0 004.773 1.217h.004c5.505 0 9.988-4.478 9.989-9.984 0-2.669-1.037-5.176-2.922-7.062A9.935 9.935 0 0012.012 2zM6.869 16.907l-.288-.454a8.255 8.255 0 01-1.265-4.467c0-4.547 3.702-8.249 8.253-8.249a8.196 8.196 0 015.835 2.419 8.196 8.196 0 012.422 5.835c0 4.547-3.702 8.249-8.253 8.249h-.003a8.223 8.223 0 01-4.215-1.164l-.304-.18-3.132.741.75-3.03z"/></svg>
                    </a>
                  )}
                </div>

                <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                  <button className="btn btn-s" style={{ flex: 1, justifyContent: 'center', height: 44 }} onClick={() => setEditAppt({ 
                    id: b.id, 
                    status: b.status, 
                    booking_date: b.booking_date ? new Date(b.booking_date).toISOString().split('T')[0] : "", 
                    booking_time: b.booking_time || "" 
                  })}>
                    <Icon n="calendar" /> SCHEDULE
                  </button>
                  <button className="btn btn-p" style={{ flex: 1, justifyContent: 'center', height: 44, background: '#111' }} onClick={() => setBillAppt({ ...b, labor: 0, parts: 0, selectedParts: [] })}>
                    <Icon n="reports" /> BILLING
                  </button>
                </div>

                <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                  <button 
                    className="btn btn-s" 
                    style={{ flex: 1, justifyContent: 'center', height: 36, fontSize: 10, border: '1px solid #FF4D00', color: '#FF4D00', background: 'transparent', borderRadius: 10, padding: 0 }} 
                    onClick={() => setActiveReceipt({ type: "BOOKING", booking: b })}
                  >
                    📅 BOOKING TICKET
                  </button>
                  {b.status === "COMPLETED" && (
                    <button 
                      className="btn btn-s" 
                      style={{ flex: 1, justifyContent: 'center', height: 36, fontSize: 10, background: 'rgba(37, 211, 102, 0.08)', color: '#25D366', border: '1px solid #25D366', borderRadius: 10, padding: 0 }} 
                      onClick={() => setActiveReceipt({ type: "BILL", booking: b })}
                    >
                      🧾 COMPLETE BILL
                    </button>
                  )}
                </div>
              </div>
            ))}
            {filteredBookings.length === 0 && <div className="empty" style={{ gridColumn: "1/-1" }}><Icon n="wrench" size={48} opacity={0.2} /><div className="empty-t">No service requests found</div></div>}
          </div>
        </div>
      )}
      {editAppt && (
        <Modal title="UPDATE STATUS & SCHEDULE" onClose={() => setEditAppt(null)}
          footer={<>
            <button className="btn btn-s btn-sm" onClick={() => setEditAppt(null)}>Cancel</button>
            <button className="btn btn-p btn-sm" onClick={updateAppt} disabled={saving}>{saving ? "Updating…" : "Save Changes"}</button>
          </>}
        >
          <div className="fg" style={{ marginBottom: 16 }}><label>Service Status</label>
            <select value={editAppt.status} onChange={e => setEditAppt(v => ({ ...v, status: e.target.value }))}>
              {APPT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="fg" style={{ marginBottom: 16 }}><label>Scheduled Date</label>
            <input 
              type="date" 
              value={editAppt.booking_date} 
              onChange={e => setEditAppt(v => ({ ...v, booking_date: e.target.value }))}
              style={{ width: '100%', borderRadius: '12px' }}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="fg"><label>Scheduled Time</label>
            <input 
              type="time" 
              value={editAppt.booking_time} 
              onChange={e => setEditAppt(v => ({ ...v, booking_time: e.target.value }))}
              style={{ width: '100%', borderRadius: '12px' }}
            />
          </div>
        </Modal>
      )}
      {billAppt && (
        <Modal title="GENERATE SERVICE BILL" onClose={() => setBillAppt(null)} wide={true}
          footer={<>
            <button className="btn btn-s btn-sm" onClick={() => setBillAppt(null)}>Cancel</button>
            <button className="btn btn-p btn-sm" style={{ background: '#111' }} onClick={async () => {
              setSaving(true);
              try {
                const total = (Number(billAppt.labor) || 0) + (Number(billAppt.parts) || 0);
                const partsListStr = (billAppt.selectedParts || []).map(p => {
                  const cleanedName = (p.name || "").replace(/[|,[\]]/g, "");
                  const cleanedModel = (p.model || "").replace(/[|,[\]]/g, "");
                  return `${cleanedName}|${cleanedModel}|${p.price || 0}|${p.qty || 1}`;
                }).join(", ");
                const finalNotes = partsListStr 
                  ? `${billAppt.customer_notes || ""} | Bill: Labor ${billAppt.labor}, Parts ${billAppt.parts} [${partsListStr}]`
                  : `${billAppt.customer_notes || ""} | Bill: Labor ${billAppt.labor}, Parts ${billAppt.parts}`;

                await apiFetch(`/appointments/${billAppt.id}`, { 
                  method: "PUT", 
                  body: { 
                    final_price: total,
                    status: "COMPLETED",
                    customer_notes: finalNotes,
                    partsUsed: (billAppt.selectedParts || []).map((p) => ({
                      productId: p.id,
                      quantity: p.qty,
                      price: p.price,
                      name: p.name,
                    })),
                  } 
                });
                toast("Bill generated & Status completed");
                setBillAppt(null); refetch();
              } catch (e) { toast(e.message, "e"); }
              setSaving(false);
            }} disabled={saving}>{saving ? "Generating…" : "Generate & Complete"}</button>
          </>}
        >
          <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth > 768 ? '1.2fr 1fr' : '1fr', gap: 24 }}>
            {/* Left Column: Product Search and Parts List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Product search box */}
              <div className="fg" style={{ position: 'relative' }}>
                <SearchInput
                  value={partSearch}
                  onChange={(e) => setPartSearch(e.target.value)}
                  label="Type to search spark plug, engine oil, tires..."
                />
                {/* Search results dropdown */}
                {partResults.length > 0 && (
                  <div style={{ 
                    position: 'absolute', 
                    top: '100%', 
                    left: 0, 
                    right: 0, 
                    zIndex: 1000, 
                    background: '#FFF', 
                    border: '1px solid var(--border)', 
                    borderRadius: 14, 
                    boxShadow: '0 12px 30px rgba(0,0,0,0.15)', 
                    maxHeight: 250, 
                    overflowY: 'auto',
                    marginTop: 4
                  }}>
                    {partResults.map(p => (
                      <div 
                        key={p.id} 
                        onClick={() => addPartToBill(p)}
                        style={{ 
                          padding: '12px 16px', 
                          borderBottom: '1px solid var(--border)', 
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'all 0.2s',
                          background: '#FFF'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--surf2)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFF'}
                      >
                        <div style={{ flex: 1, paddingRight: 16, textAlign: 'left' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 800, color: '#111', fontSize: 13 }}>{p.name}</span>
                            {p.partDetail?.item_code && (
                              <span style={{ fontSize: 9, fontWeight: 700, background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: 4, color: 'var(--muted)' }}>
                                {p.partDetail.item_code}
                              </span>
                            )}
                            {p.partDetail?.model && (
                              <span style={{ fontSize: 9, fontWeight: 700, background: 'rgba(230,81,0,0.08)', padding: '2px 6px', borderRadius: 4, color: 'var(--acc)' }}>
                                {p.partDetail.model}
                              </span>
                            )}
                          </div>
                          {(p.description || p.partDetail?.description) && (
                            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, fontWeight: 500, lineHeight: '1.3' }}>
                              {p.description || p.partDetail?.description}
                            </div>
                          )}
                          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2, fontWeight: 700, textTransform: 'uppercase' }}>
                            Category: {p.category?.name || 'General'}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', minWidth: 100 }}>
                          <div style={{ color: 'var(--acc)', fontWeight: 900, fontSize: 14 }}>
                            PKR {p.price.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected parts listing */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>Selected Parts</label>
                <div style={{ 
                  flex: 1, 
                  border: '1px solid var(--border)', 
                  borderRadius: 16, 
                  overflow: 'hidden', 
                  background: 'var(--surf1)',
                  minHeight: 180,
                  maxHeight: 280,
                  overflowY: 'auto'
                }}>
                  {(!billAppt.selectedParts || billAppt.selectedParts.length === 0) ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 24, color: 'var(--muted)' }}>
                      <Icon n="inventory" size={28} style={{ marginBottom: 8, opacity: 0.4 }} />
                      <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>No parts added yet</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', divideY: '1px solid var(--border)' }}>
                      {(billAppt.selectedParts || []).map((item, idx) => (
                        <div key={item.id} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between', 
                          padding: '12px 16px',
                          borderBottom: '1px solid var(--border)',
                          fontSize: 12,
                          background: 'var(--card)'
                        }}>
                          <div style={{ flex: 1, marginRight: 12, textAlign: 'left' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 800, color: 'var(--text)' }}>{item.name}</span>
                              {item.model && (
                                <span style={{ fontSize: 8, fontWeight: 700, background: 'rgba(230,81,0,0.08)', padding: '1px 4px', borderRadius: 4, color: 'var(--acc)' }}>
                                  {item.model}
                                </span>
                              )}
                              {item.item_code && (
                                <span style={{ fontSize: 8, fontWeight: 700, background: 'rgba(0,0,0,0.05)', padding: '1px 4px', borderRadius: 4, color: 'var(--muted)' }}>
                                  {item.item_code}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>PKR {item.price.toLocaleString()} / unit</div>
                          </div>
                          
                          {/* Quantity control */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 16 }}>
                            <button 
                              type="button" 
                              onClick={() => updatePartQty(idx, item.qty - 1)}
                              style={{ width: 24, height: 24, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surf2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, fontWeight: 900 }}
                            >-</button>
                            <input 
                              type="number" 
                              value={item.qty} 
                              onChange={e => updatePartQty(idx, Number(e.target.value))}
                              style={{ width: 36, textAlign: 'center', padding: '2px 0', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11, fontWeight: 800 }}
                            />
                            <button 
                              type="button" 
                              onClick={() => updatePartQty(idx, item.qty + 1)}
                              style={{ width: 24, height: 24, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surf2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, fontWeight: 900 }}
                            >+</button>
                          </div>

                          <div style={{ textAlign: 'right', marginRight: 16, minWidth: 80 }}>
                            <div style={{ fontWeight: 800, color: 'var(--acc)' }}>PKR {(item.price * item.qty).toLocaleString()}</div>
                          </div>

                          <button 
                            type="button" 
                            onClick={() => removePartFromBill(idx)}
                            className="btn-ico dng" 
                            style={{ padding: 6, borderRadius: 8 }}
                          >
                            <Icon n="trash" size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Customer Details, Labor & Totals */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: 16, background: 'var(--surf2)', borderRadius: 16, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 4 }}>Customer Details</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text)' }}>{billAppt.customer?.name}</div>
                <div style={{ fontSize: 13, color: 'var(--acc)', fontWeight: 700, marginTop: 2 }}>{billAppt.service?.name}</div>
              </div>
              
              <div className="fg">
                <label style={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Labor Charges (PKR)</label>
                <input 
                  type="number" 
                  value={billAppt.labor} 
                  onChange={e => setBillAppt({...billAppt, labor: e.target.value})} 
                  placeholder="Enter labor/service fee..." 
                  style={{ width: '100%', borderRadius: 14 }}
                />
              </div>

              <div className="fg">
                <label style={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Parts / Material Charges (PKR)</label>
                <input 
                  type="number" 
                  value={billAppt.parts} 
                  disabled={billAppt.selectedParts && billAppt.selectedParts.length > 0} 
                  onChange={e => setBillAppt({...billAppt, parts: e.target.value})} 
                  placeholder="Auto-calculated from selected parts..." 
                  style={{ width: '100%', borderRadius: 14, background: (billAppt.selectedParts && billAppt.selectedParts.length > 0) ? 'var(--surf2)' : 'inherit' }}
                />
              </div>

              <div style={{ padding: 24, background: '#111', borderRadius: 24, color: 'white', textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', marginTop: 'auto' }}>
                <div style={{ fontSize: 9, fontWeight: 700, opacity: 0.5, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Total Service Bill</div>
                <div style={{ fontFamily: 'var(--font-d)', fontSize: 36, letterSpacing: 1, fontWeight: 900 }}>
                  PKR {((Number(billAppt.labor) || 0) + (Number(billAppt.parts) || 0)).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
      {confirmId && <Confirm msg="Remove this booking record?" onYes={() => remove(confirmId)} onNo={() => setConfirmId(null)} />}
      {activeReceipt && (
        <ServiceThermalReceipt
          type={activeReceipt.type}
          booking={activeReceipt.booking}
          onClose={() => setActiveReceipt(null)}
        />
      )}
    </div>
  );
};

export default Services;
