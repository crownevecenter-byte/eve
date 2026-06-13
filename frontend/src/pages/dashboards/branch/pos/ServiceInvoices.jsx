// frontend/src/pages/dashboards/branch/pos/ServiceInvoices.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../../services/api';
import { Icon } from '../../../../components/branch/BranchShared';
import { Plus, X, MessageCircle, Home, FileText, Calendar, Edit2, Trash2 } from 'lucide-react';
import { useDebounce } from '../../../../hooks/useDebounce';
import SearchInput from '../../../../components/SearchInput';
import {
  getWalkInCustomerName,
  getWalkInCustomerPhone,
  generateServiceId,
  formatDate,
  formatTime12Hour
} from './utils';
import './ServiceInvoices.css';

const ServiceInvoices = ({ user, queryClient, onPrintReceipt }) => {
  const [svForm, setSvForm] = useState({
    customerId: '',
    labor: 0,
    selectedParts: [],
    customerNotes: '',
    bookingDate: new Date().toISOString().split('T')[0],
    bookingTime: new Date().toTimeString().slice(0, 5)
  });

  const [svPartSearch, setSvPartSearch] = useState('');
  const [svCustomerSearch, setSvCustomerSearch] = useState('');
  const [svHistorySearch, setSvHistorySearch] = useState('');
  const [showNewServiceModal, setShowNewServiceModal] = useState(false);

  const debouncedSvPartSearch = useDebounce(svPartSearch, 300);
  const debouncedSvCustomerSearch = useDebounce(svCustomerSearch, 300);

  const { data: svCustomers, isLoading: loadingSvCustomers } = useQuery({
    queryKey: ['sv-customers', debouncedSvCustomerSearch],
    queryFn: () => api.get('/walk-in-customers', {
      params: { branchId: user?.branchId, search: debouncedSvCustomerSearch, limit: 50 }
    }).then(r => r.data),
    enabled: !!debouncedSvCustomerSearch
  });

  const { data: svParts, isLoading: loadingSvParts } = useQuery({
    queryKey: ['sv-parts', debouncedSvPartSearch],
    queryFn: () => api.get('/products', {
      params: { branchId: user?.branchId, search: debouncedSvPartSearch, limit: 10 }
    }).then(r => r.data),
    enabled: !!debouncedSvPartSearch
  });

  const { data: svHistory, refetch: refetchSvHistory } = useQuery({
    queryKey: ['sv-history', user?.branchId],
    queryFn: () => api.get('/appointments', { params: { branchId: user?.branchId } }).then(r => r.data),
    enabled: !!user?.branchId
  });

  const handleSvDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this service invoice?")) {
      try {
        await api.delete('/appointments/' + id);
        refetchSvHistory();
      } catch (err) {
        alert("Failed to delete: " + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleSvComplete = async (id, currentStatus) => {
    if (currentStatus === 'COMPLETED') return alert("This service is already completed!");
    if (window.confirm("Mark this service as COMPLETED?")) {
      try {
        await api.put('/appointments/' + id, { status: 'COMPLETED' });
        refetchSvHistory();
      } catch (err) {
        alert("Failed to complete: " + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleSvSubmit = async (e) => {
    e.preventDefault();
    if (!svForm.customerId && !svCustomerSearch.trim()) return alert("Please select or type a customer name");

    try {
      let customerName = "Walk-in Customer";
      let customerPhone = "";
      
      if (svCustomerSearch.trim()) {
        const match = svCustomerSearch.match(/(.*?)\s*\(([^)]+)\)/);
        if (match) {
          customerName = match[1].trim();
          customerPhone = match[2].trim();
        } else {
          customerName = svCustomerSearch.trim();
        }
      }

      const partsTotal = svForm.selectedParts.reduce((sum, p) => sum + (p.price * p.qty), 0);
      const grandTotal = (parseFloat(svForm.labor) || 0) + partsTotal;

      const partsListStr = svForm.selectedParts.map(p => `${p.name}|${p.model || ""}|${p.price}|${p.qty}`).join(", ");
      const finalNotes = partsListStr 
        ? `Walk-in Service: ${customerName} (${customerPhone}) | Remarks: ${svForm.customerNotes || ""} | Bill: Labor ${svForm.labor}, Parts ${partsTotal} [${partsListStr}]`
        : `Walk-in Service: ${customerName} (${customerPhone}) | Remarks: ${svForm.customerNotes || ""} | Bill: Labor ${svForm.labor}, Parts ${partsTotal}`;

      const payload = {
        branchId: Number(user?.branchId),
        booking_date: svForm.bookingDate,
        booking_time: svForm.bookingTime,
        status: "COMPLETED",
        customer_notes: finalNotes,
        final_price: grandTotal,
        partsUsed: svForm.selectedParts.map((p) => ({
          productId: p.id,
          quantity: p.qty,
          price: p.price,
          name: p.name,
        })),
      };

      await api.post('/appointments', payload);
      alert("Walk-in service ticket created — parts stock updated!");
      setSvForm({
        customerId: '',
        labor: 0,
        selectedParts: [],
        customerNotes: '',
        bookingDate: new Date().toISOString().split('T')[0],
        bookingTime: new Date().toTimeString().slice(0, 5)
      });
      setSvCustomerSearch("");
      setSvPartSearch("");
      setShowNewServiceModal(false);
      refetchSvHistory();
      queryClient.invalidateQueries({ queryKey: ['sv-parts'] });
      queryClient.invalidateQueries({ queryKey: ['pos-products-list'] });
    } catch (err) {
      alert("Failed to submit service invoice: " + (err.response?.data?.message || err.message));
    }
  };

  const addPartToSv = (product) => {
    if (product.stock_qty <= 0) {
      alert(`Insufficient stock! "${product.name}" is out of stock.`);
      return;
    }
    setSvForm(prev => {
      const exists = prev.selectedParts.find(p => p.id === product.id);
      if (exists) {
        if (exists.qty + 1 > (exists.stock ?? product.stock_qty)) {
          alert(`Insufficient stock! Only ${exists.stock ?? product.stock_qty} unit(s) available.`);
          return prev;
        }
        return {
          ...prev,
          selectedParts: prev.selectedParts.map(p => p.id === product.id ? { ...p, qty: p.qty + 1 } : p)
        };
      }
      return {
        ...prev,
        selectedParts: [...prev.selectedParts, {
          id: product.id,
          name: product.name,
          price: product.price,
          qty: 1,
          stock: product.stock_qty,
          model: product.partDetail?.model || ""
        }]
      };
    });
    setSvPartSearch("");
  };

  const updateSvPartQty = (id, delta) => {
    setSvForm(prev => {
      let overStock = false;
      const newParts = prev.selectedParts.map(p => {
        if (p.id !== id) return p;
        const nextQty = p.qty + delta;
        if (nextQty > (p.stock ?? 0)) {
          overStock = true;
          return p;
        }
        return { ...p, qty: Math.max(1, nextQty) };
      });
      if (overStock) {
        alert("Insufficient stock! Cannot exceed available quantity.");
        return prev;
      }
      return { ...prev, selectedParts: newParts };
    });
  };

  const removeSvPart = (id) => {
    setSvForm(prev => ({
      ...prev,
      selectedParts: prev.selectedParts.filter(p => p.id !== id)
    }));
  };

  const partsTotal = svForm.selectedParts.reduce((sum, p) => sum + (p.price * p.qty), 0);
  const grandTotal = (parseFloat(svForm.labor) || 0) + partsTotal;

  const svHistoryList = Array.isArray(svHistory) ? svHistory : (svHistory?.data || []);
  let sortedHistory = [...svHistoryList].sort((a, b) => {
    const dateA = new Date((a.booking_date || "") + "T" + (a.booking_time || "00:00"));
    const dateB = new Date((b.booking_date || "") + "T" + (b.booking_time || "00:00"));
    return dateB - dateA;
  });

  if (svHistorySearch.trim()) {
    sortedHistory = sortedHistory.filter(item => {
      const displayId = generateServiceId(item.id);
      return displayId.includes(svHistorySearch.trim());
    });
  }

  return (
    <div className="service-invoices-container flex flex-col h-full space-y-6">
      {/* Service Invoices History Dashboard */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-[#F3E5DC] shadow-sm max-w-[1400px] mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-[#F3E5DC] gap-4">
          <div>
            <h2 className="text-2xl font-black text-[#2D1A12] uppercase tracking-tight">Service Invoices</h2>
            <p className="text-[10px] font-bold text-[#8D7A71] uppercase tracking-[0.2em] mt-1">Manage and track walk-in customer services</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <SearchInput
              className="w-full sm:w-64"
              variant="pos"
              pill
              value={svHistorySearch}
              onChange={(e) => setSvHistorySearch(e.target.value)}
              label="Search Service ID..."
            />
            <button 
              onClick={() => setShowNewServiceModal(true)}
              className="w-full sm:w-auto whitespace-nowrap bg-[#E65100] text-white px-8 py-3.5 rounded-full font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={16} /> New Service Invoice
            </button>
          </div>
        </div>

        {sortedHistory.length === 0 ? (
          <div className="text-center py-16 bg-[#FFFAF8] rounded-[2rem] border border-dashed border-[#F3E5DC]">
            <div className="text-4xl mb-4">🔧</div>
            <p className="font-black text-[#2D1A12] uppercase tracking-wider text-sm">No Service History Found</p>
            <p className="text-xs text-[#8D7A71] mt-1">Try adjusting your search or issue a new service invoice.</p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#F3E5DC] text-[9px] font-black text-[#8D7A71] uppercase tracking-[0.2em]">
                  <th className="px-6 py-4 whitespace-nowrap">ID &amp; Status</th>
                  <th className="px-6 py-4 whitespace-nowrap">Customer Info</th>
                  <th className="px-6 py-4 whitespace-nowrap">Service Details</th>
                  <th className="px-6 py-4 text-center min-w-[240px]">Actions</th>
                  <th className="px-4 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {sortedHistory.map((item) => {
                  const name = getWalkInCustomerName(item.customer_notes);
                  const phone = getWalkInCustomerPhone(item.customer_notes);
                  const serviceName = item.service?.name || "Maintenance & Tuning";
                  const displayId = generateServiceId(item.id);
                  const formattedDate = formatDate(item.booking_date);
                  const formattedTime = formatTime12Hour(item.booking_time);
                  const isCompleted = item.status === "COMPLETED";

                  return (
                    <tr key={item.id} className="border-b border-[#F3E5DC] last:border-none hover:bg-[#FFFAF8] transition-colors group">
                      {/* ID & Status */}
                      <td className="px-6 py-5 align-middle">
                        <div className="flex flex-col items-start gap-2.5">
                          <span className="px-3 py-1.5 rounded-lg text-[11px] font-black text-[#E65100] bg-[#FFF6F0] uppercase tracking-wider">
                            #{displayId}
                          </span>
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${isCompleted ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                            {isCompleted ? "COMPLETED" : item.status}
                          </span>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-6 py-5 align-middle">
                        <h3 className="font-black text-sm text-[#2D1A12] leading-tight mb-2.5 truncate max-w-[200px]">{name}</h3>
                        <div className="flex items-center gap-2">
                          <div className="bg-white border border-[#F3E5DC] px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-[#8D7A71] shadow-sm">{phone || "N/A"}</div>
                          {phone && (
                            <a href={`https://wa.me/${phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-all shadow-sm shadow-emerald-500/20 hover:scale-105 active:scale-95">
                              <MessageCircle size={14} fill="currentColor" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Service & Date */}
                      <td className="px-6 py-5 align-middle">
                        <p className="font-bold text-xs text-[#E65100] mb-2 truncate max-w-[200px]">{serviceName}</p>
                        <div className="bg-[#FFF6F0] border border-[#F3E5DC] border-dashed rounded-lg px-2.5 py-1.5 flex items-center gap-2 text-[10px] font-bold text-[#2D1A12] w-max mb-2">
                          <Home size={12} className="text-[#8D7A71]" />
                          <span>{formattedDate} @ {formattedTime}</span>
                        </div>
                        <div className="font-black text-xs text-[#2D1A12]">PKR {item.final_price?.toLocaleString() || 0}</div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-5 align-middle">
                        <div className="flex flex-col gap-2 w-full max-w-[240px] mx-auto">
                          <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => alert("Scheduling module coming soon")} className="bg-[#FFF6F0] text-[#2D1A12] py-2 rounded-lg font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-[#FFE0CC] transition-colors">
                              <Home size={12} /> Schedule
                            </button>
                            <button onClick={() => onPrintReceipt(item, 'BILL')} className="bg-[#1A1A1A] text-white py-2 rounded-lg font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-black transition-colors shadow-sm">
                              <FileText size={12} /> Billing
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => onPrintReceipt(item, 'TICKET')} className="bg-white border border-[#E65100] text-[#E65100] py-2 rounded-lg font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-[#FFF6F0] transition-colors">
                              <Calendar size={12} /> Ticket
                            </button>
                            <button onClick={() => handleSvComplete(item.id, item.status)} className="bg-white border border-emerald-500 text-emerald-500 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-emerald-50 transition-colors">
                              <FileText size={12} /> Complete
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Edit/Delete */}
                      <td className="px-4 py-5 align-middle pr-6">
                        <div className="flex flex-col gap-2 justify-center items-end">
                           <button onClick={() => alert("Edit invoice coming soon")} className="w-8 h-8 rounded-xl bg-[#FFF6F0] text-[#E65100] flex items-center justify-center hover:bg-[#FFE0CC] transition-colors shadow-sm">
                             <Edit2 size={13} />
                           </button>
                           <button onClick={() => handleSvDelete(item.id)} className="w-8 h-8 rounded-xl bg-[#FFF6F0] text-[#E65100] flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors shadow-sm">
                             <Trash2 size={13} />
                           </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Service Invoice Modal */}
      {showNewServiceModal && (
        <div className="svc-modal-overlay" onClick={() => setShowNewServiceModal(false)}>
          <div className="svc-modal" onClick={(e) => e.stopPropagation()}>
            <header className="svc-modal__header">
              <div className="svc-modal__header-text">
                <h2>Walk-in Customer Service Bay</h2>
                <p>Generate new maintenance service invoice</p>
              </div>
              <button type="button" className="svc-modal__close" onClick={() => setShowNewServiceModal(false)} aria-label="Close">
                <X size={16} />
              </button>
            </header>

            <form onSubmit={handleSvSubmit} className="svc-modal__form">
              <div className="svc-modal__body">
                <div className="svc-section">
                  <label className="svc-section__label">Walk-in Customer *</label>
                  <div className="svc-input-wrap">
                    <SearchInput
                      variant="pos"
                      value={svCustomerSearch}
                      onChange={(e) => {
                        setSvCustomerSearch(e.target.value);
                        if (svForm.customerId) setSvForm({ ...svForm, customerId: '' });
                      }}
                      label="Search walk-in customer by name or phone..."
                    />
                    {svCustomerSearch && !svForm.customerId && (
                      <div className="svc-dropdown">
                        {loadingSvCustomers ? (
                          <div className="svc-dropdown__empty">Searching...</div>
                        ) : svCustomers?.data?.length === 0 ? (
                          <div className="svc-dropdown__empty">Customer not found</div>
                        ) : (
                          (svCustomers?.data || []).map((c) => (
                            <div
                              key={c.id}
                              className="svc-dropdown__item"
                              onClick={() => {
                                setSvForm({ ...svForm, customerId: c.id });
                                setSvCustomerSearch(`${c.first_name} ${c.last_name} (${c.phone})`);
                              }}
                            >
                              <div className="font-black text-[#2D1A12] text-sm uppercase">{c.first_name} {c.last_name}</div>
                              <div className="text-[10px] font-bold text-[#8D7A71] tracking-widest">{c.phone}</div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="svc-section">
                  <label className="svc-section__label">Add Spare Parts Used (Optional)</label>
                  <div className="svc-input-wrap">
                    <SearchInput
                      variant="pos"
                      value={svPartSearch}
                      onChange={(e) => setSvPartSearch(e.target.value)}
                      label="Type to search branch spare parts used in service..."
                    />
                    {svPartSearch && (
                      <div className="svc-dropdown">
                        {loadingSvParts ? (
                          <div className="svc-dropdown__empty">Searching...</div>
                        ) : svParts?.data?.length === 0 ? (
                          <div className="svc-dropdown__empty">No matching spare parts found</div>
                        ) : (
                          (svParts?.data || []).map((p) => (
                            <div key={p.id} className="svc-dropdown__item flex justify-between items-center" onClick={() => addPartToSv(p)}>
                              <div>
                                <div className="font-black text-[#2D1A12] text-sm uppercase">{p.name}</div>
                                <div className="text-[10px] font-bold text-[#8D7A71]">Model: {p.partDetail?.model || 'N/A'} · Stock: {p.stock_qty}</div>
                              </div>
                              <div className="text-[#E65100] font-black text-xs">PKR {p.price.toLocaleString()}</div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {svForm.selectedParts.length > 0 && (
                  <div className="svc-section" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '0.85rem 1rem 0.5rem' }}>
                      <label className="svc-section__label" style={{ marginBottom: 0 }}>Selected Parts Applied</label>
                    </div>
                    <table className="svc-parts-table">
                      <thead>
                        <tr>
                          <th>Part</th>
                          <th style={{ textAlign: 'center' }}>Qty</th>
                          <th style={{ textAlign: 'right' }}>Unit</th>
                          <th style={{ textAlign: 'right' }}>Total</th>
                          <th style={{ textAlign: 'center' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {svForm.selectedParts.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <div className="font-black text-[#2D1A12] text-xs uppercase">{item.name}</div>
                              <div className="text-[9px] font-bold text-[#8D7A71]">Model: {item.model || 'Standard'}</div>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div className="flex items-center justify-center gap-2">
                                <button type="button" className="svc-qty-btn" onClick={() => updateSvPartQty(item.id, -1)}>−</button>
                                <span className="font-black text-xs w-5 text-center">{item.qty}</span>
                                <button type="button" className="svc-qty-btn" onClick={() => updateSvPartQty(item.id, 1)}>+</button>
                              </div>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>PKR {item.price.toLocaleString()}</td>
                            <td style={{ textAlign: 'right', fontWeight: 900, color: '#E65100' }}>PKR {(item.price * item.qty).toLocaleString()}</td>
                            <td style={{ textAlign: 'center' }}>
                              <button type="button" onClick={() => removeSvPart(item.id)} className="text-red-400 hover:text-red-600">
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="svc-grid-2">
                  <div className="svc-section">
                    <label className="svc-section__label">Labor / Service Charges (PKR)</label>
                    <input
                      type="number"
                      min="0"
                      value={svForm.labor}
                      onChange={(e) => setSvForm({ ...svForm, labor: e.target.value })}
                      className="svc-input svc-input--no-icon"
                    />
                    <label className="svc-section__label" style={{ marginTop: '0.85rem' }}>Job Remarks / Technician Notes</label>
                    <textarea
                      value={svForm.customerNotes}
                      onChange={(e) => setSvForm({ ...svForm, customerNotes: e.target.value })}
                      placeholder="Describe maintenance actions, diagnostic results..."
                      className="svc-textarea"
                    />
                  </div>

                  <div className="svc-section" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div className="svc-grid-2">
                      <div>
                        <label className="svc-section__label">Tuning Date</label>
                        <input
                          type="date"
                          value={svForm.bookingDate}
                          onChange={(e) => setSvForm({ ...svForm, bookingDate: e.target.value })}
                          className="svc-input svc-input--no-icon"
                        />
                      </div>
                      <div>
                        <label className="svc-section__label">Tuning Time</label>
                        <input
                          type="time"
                          value={svForm.bookingTime}
                          onChange={(e) => setSvForm({ ...svForm, bookingTime: e.target.value })}
                          className="svc-input svc-input--no-icon"
                        />
                      </div>
                    </div>
                    <div className="svc-totals" style={{ marginTop: 'auto' }}>
                      <div className="svc-totals__row">
                        <span>Labor / Tuning</span>
                        <span>PKR {(parseFloat(svForm.labor) || 0).toLocaleString()}</span>
                      </div>
                      <div className="svc-totals__row">
                        <span>Spare Parts Cost</span>
                        <span>PKR {partsTotal.toLocaleString()}</span>
                      </div>
                      <hr className="svc-totals__divider" />
                      <div className="svc-totals__grand">
                        <span>Total Service Bill</span>
                        <span>PKR {grandTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <footer className="svc-modal__footer">
                <button type="button" className="svc-btn-cancel" onClick={() => setShowNewServiceModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="svc-btn-submit">
                  <Icon n="check" size={18} /> Generate Service Invoice
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceInvoices;
