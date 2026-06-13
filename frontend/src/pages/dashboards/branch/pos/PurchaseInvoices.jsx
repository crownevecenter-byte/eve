// pos/PurchaseInvoices.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../../services/api';
import { Icon } from '../../../../components/branch/BranchShared';
import { Trash2 } from 'lucide-react';
import { useDebounce } from '../../../../hooks/useDebounce';
import SearchInput from '../../../../components/SearchInput';
import './PurchaseInvoices.css';

const PurchaseInvoices = ({ user, queryClient }) => {
  const [piForm, setPiForm] = useState({
    supplierId: '', remarks: '', documentNo: '', purchaseNo: '', partyInvoiceNo: '', items: []
  });
  const [piProductSearch, setPiProductSearch] = useState('');
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [loadSuppliers, setLoadSuppliers] = useState(false);
  const [newSupplierForm, setNewSupplierForm] = useState({ name: '', contact: '' });
  const debouncedPiProductSearch = useDebounce(piProductSearch, 300);

  const { data: piSuppliers } = useQuery({
    queryKey: ['pi-suppliers', user?.branchId],
    queryFn: () => api.get('/suppliers', { params: { limit: 200 } }).then((r) => r.data?.data ?? r.data ?? []),
    enabled: !!user?.branchId && loadSuppliers,
  });

  const { data: piProducts, isLoading: loadingPiProducts } = useQuery({
    queryKey: ['pi-products', debouncedPiProductSearch],
    queryFn: () => api.get('/products', {
      params: { branchId: user?.branchId, search: debouncedPiProductSearch, limit: 50, lite: '1' }
    }).then(r => r.data),
    enabled: !!debouncedPiProductSearch
  });

  const handlePiSubmit = async (e) => {
    e.preventDefault();
    if (!piForm.supplierId) return alert('Please select a supplier');
    if (piForm.items.length === 0) return alert('Please add at least one product');
    const invalidItem = piForm.items.find(i => !i.cost || i.cost <= 0);
    if (invalidItem) return alert(`Please enter a valid cost for ${invalidItem.name}`);
    try {
      const total = piForm.items.reduce((sum, item) => sum + (parseFloat(item.cost) * parseInt(item.quantity)), 0);
      const payload = {
        supplierId: Number(piForm.supplierId),
        branchId: Number(user?.branchId),
        total,
        remarks: piForm.remarks || null,
        documentNo: piForm.documentNo || null,
        purchaseNo: piForm.purchaseNo || null,
        partyInvoiceNo: piForm.partyInvoiceNo || null,
        items: piForm.items.map(item => ({
          productId: item.productId,
          quantity: Number(item.quantity),
          cost: parseFloat(item.cost),
          engineNo: item.engineNo || null,
          chassisNo: item.chassisNo || null,
          stockType: item.productType === 'bike' ? 'New' : 'Standard'
        }))
      };
      await api.post('/purchases', payload);
      alert('Purchase invoice registered and stock successfully updated!');
      setPiForm({ supplierId: '', remarks: '', documentNo: '', purchaseNo: '', partyInvoiceNo: '', items: [] });
      setPiProductSearch('');
      queryClient.invalidateQueries(['pos-products-list']);
    } catch (err) {
      alert('Failed to create purchase invoice: ' + (err.response?.data?.message || err.message));
    }
  };

  const addProductToPi = (product) => {
    setPiForm(prev => {
      const exists = prev.items.find(i => i.productId === product.id);
      if (exists) return { ...prev, items: prev.items.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i) };
      return {
        ...prev, items: [...prev.items, {
          productId: product.id, name: product.name,
          model: product.partDetail?.model || product.bikeDetail?.motor_type || 'N/A',
          quantity: 1, cost: product.partDetail?.cp_price || product.price * 0.7,
          engineNo: '', chassisNo: '', productType: product.product_type
        }]
      };
    });
    setPiProductSearch('');
  };

  const updatePiItem = (productId, key, val) => setPiForm(prev => ({ ...prev, items: prev.items.map(i => i.productId === productId ? { ...i, [key]: val } : i) }));
  const removePiItem = (productId) => setPiForm(prev => ({ ...prev, items: prev.items.filter(i => i.productId !== productId) }));

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    if (!newSupplierForm.name || !newSupplierForm.contact) return alert('Name and contact are required');
    try {
      const res = await api.post('/suppliers', { ...newSupplierForm, branchId: user?.branchId });
      alert('Supplier registered successfully!');
      setPiForm(prev => ({ ...prev, supplierId: res.data.id }));
      setNewSupplierForm({ name: '', contact: '' });
      setShowAddSupplierModal(false);
      queryClient.invalidateQueries(['pi-suppliers']);
    } catch (err) {
      alert('Failed to register supplier: ' + (err.response?.data?.message || err.message));
    }
  };

  const piTotal = piForm.items.reduce((sum, item) => sum + ((parseFloat(item.cost) || 0) * parseInt(item.quantity || 1)), 0);

  return (
    <div className="purchase-invoices-container flex flex-col h-full space-y-6">
      <div className="bg-white p-8 rounded-[2.5rem] border border-[#F3E5DC] shadow-sm max-w-5xl mx-auto w-full">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-black text-[#2D1A12] uppercase tracking-tight">Purchase Invoice &amp; Stock Inflow</h2>
          <p className="text-[10px] font-bold text-[#8D7A71] uppercase tracking-[0.3em] mt-2">Procure electric bikes &amp; spare parts</p>
        </div>

        <form onSubmit={handlePiSubmit} className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center ml-2">
                <label className="text-[10px] font-black text-[#8D7A71] uppercase tracking-[0.2em]">Select Supplier *</label>
                <button type="button" onClick={() => setShowAddSupplierModal(true)} className="text-[10px] font-black text-[#E65100] hover:underline uppercase tracking-widest">+ Register New</button>
              </div>
              <select
                required
                value={piForm.supplierId}
                onFocus={() => setLoadSuppliers(true)}
                onChange={e => setPiForm({ ...piForm, supplierId: e.target.value })}
                className="w-full bg-[#FFFAF8] border border-[#F3E5DC] rounded-3xl py-4 px-6 outline-none focus:ring-2 focus:ring-[#E65100]/20 font-bold text-sm">
                <option value="">Choose Supplier...</option>
                {(piSuppliers || []).map(s => <option key={s.id} value={s.id}>{s.name} ({s.contact})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#8D7A71] uppercase tracking-[0.2em] ml-2">Document No</label>
                <input type="text" value={piForm.documentNo} onChange={e => setPiForm({ ...piForm, documentNo: e.target.value })} placeholder="e.g. DOC-123"
                  className="w-full bg-[#FFFAF8] border border-[#F3E5DC] rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-[#E65100]/20 font-bold text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#8D7A71] uppercase tracking-[0.2em] ml-2">Party Invoice No</label>
                <input type="text" value={piForm.partyInvoiceNo} onChange={e => setPiForm({ ...piForm, partyInvoiceNo: e.target.value })} placeholder="e.g. INV-998"
                  className="w-full bg-[#FFFAF8] border border-[#F3E5DC] rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-[#E65100]/20 font-bold text-sm" />
              </div>
            </div>
          </div>

          {/* Product Search */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-[#8D7A71] uppercase tracking-[0.2em] ml-2">Search Products to Purchase</label>
            <div className="relative">
              <SearchInput
                variant="pos"
                value={piProductSearch}
                onChange={(e) => setPiProductSearch(e.target.value)}
                label="Search branch bikes or parts by name or model..."
              />
              {piProductSearch && (
                <div className="absolute z-20 left-0 right-0 mt-2 bg-white border border-[#F3E5DC] rounded-3xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto custom-scrollbar">
                  {loadingPiProducts ? (
                    <div className="p-6 text-center animate-pulse text-[#8D7A71] text-xs font-bold uppercase">Searching products...</div>
                  ) : piProducts?.data?.length === 0 ? (
                    <div className="p-6 text-center text-[#8D7A71] text-xs font-bold uppercase">No matching products found</div>
                  ) : (piProducts?.data || []).map(p => (
                    <div key={p.id} onClick={() => addProductToPi(p)}
                      className="px-6 py-4 hover:bg-[#FFFAF8] cursor-pointer border-b border-[#F3E5DC] last:border-none flex justify-between items-center group">
                      <div>
                        <div className="font-black text-[#2D1A12] text-sm uppercase group-hover:text-[#E65100] transition-colors">{p.name}</div>
                        <div className="text-[10px] font-bold text-[#8D7A71] uppercase tracking-tighter">Type: {p.product_type} • Current Stock: {p.stock_qty} Units</div>
                      </div>
                      <div className="text-[#E65100] font-black text-xs">PKR {p.price.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          {piForm.items.length > 0 && (
            <div className="space-y-4">
              <label className="text-[10px] font-black text-[#8D7A71] uppercase tracking-[0.2em] ml-2">Invoice Procurement Items</label>
              <div className="bg-[#FFFAF8] border border-[#F3E5DC] rounded-3xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F3E5DC]/30 border-b border-[#F3E5DC]">
                      <th className="px-6 py-4 text-[10px] font-black text-[#8D7A71] uppercase tracking-widest">Item Description</th>
                      <th className="px-6 py-4 text-[10px] font-black text-[#8D7A71] uppercase tracking-widest text-center" style={{ width: 140 }}>Qty</th>
                      <th className="px-6 py-4 text-[10px] font-black text-[#8D7A71] uppercase tracking-widest" style={{ width: 180 }}>Unit Cost (PKR)</th>
                      <th className="px-6 py-4 text-[10px] font-black text-[#8D7A71] uppercase tracking-widest text-right">Total Cost</th>
                      <th className="px-6 py-4 text-[10px] font-black text-[#8D7A71] uppercase tracking-widest text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {piForm.items.map(item => (
                      <tr key={item.productId} className="border-b border-[#F3E5DC] last:border-none">
                        <td className="px-6 py-4 space-y-3">
                          <div>
                            <div className="font-black text-[#2D1A12] text-xs uppercase">{item.name}</div>
                            <div className="text-[9px] font-bold text-[#8D7A71] uppercase tracking-tighter">Model: {item.model} • Type: {item.productType}</div>
                          </div>
                          {item.productType === 'bike' && (
                            <div className="grid grid-cols-2 gap-2 pt-2">
                              <input type="text" value={item.engineNo} onChange={e => updatePiItem(item.productId, 'engineNo', e.target.value)} placeholder="Engine Number" className="bg-white border border-[#F3E5DC] rounded-xl px-3 py-1.5 text-[10px] font-bold outline-none" />
                              <input type="text" value={item.chassisNo} onChange={e => updatePiItem(item.productId, 'chassisNo', e.target.value)} placeholder="Chassis Number" className="bg-white border border-[#F3E5DC] rounded-xl px-3 py-1.5 text-[10px] font-bold outline-none" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-3">
                            <button type="button" onClick={() => updatePiItem(item.productId, 'quantity', Math.max(1, item.quantity - 1))} className="w-6 h-6 rounded-full bg-white border border-[#F3E5DC] flex items-center justify-center text-xs font-black hover:bg-[#F3E5DC]">−</button>
                            <span className="font-black text-xs w-6 text-center">{item.quantity}</span>
                            <button type="button" onClick={() => updatePiItem(item.productId, 'quantity', item.quantity + 1)} className="w-6 h-6 rounded-full bg-white border border-[#F3E5DC] flex items-center justify-center text-xs font-black hover:bg-[#F3E5DC]">+</button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <input type="number" value={item.cost} onChange={e => updatePiItem(item.productId, 'cost', e.target.value)} placeholder="Unit Cost" className="w-full bg-white border border-[#F3E5DC] rounded-xl py-2 px-3 outline-none font-bold text-xs" />
                        </td>
                        <td className="px-6 py-4 text-right font-black text-xs text-[#E65100]">PKR {((parseFloat(item.cost) || 0) * item.quantity).toLocaleString()}</td>
                        <td className="px-6 py-4 text-center">
                          <button type="button" onClick={() => removePiItem(item.productId)} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#8D7A71] uppercase tracking-[0.2em] ml-2">Remarks / Notes</label>
              <textarea value={piForm.remarks} onChange={e => setPiForm({ ...piForm, remarks: e.target.value })} placeholder="Add inventory memo or transaction comments..."
                className="w-full bg-[#FFFAF8] border border-[#F3E5DC] rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-[#E65100]/20 font-bold text-sm min-h-[110px]" />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-[#8D7A71] uppercase tracking-[0.2em] ml-2">Grand Procurement Total</label>
              <div className="bg-[#2D1A12] p-8 rounded-[2rem] text-white shadow-xl flex flex-col justify-center">
                <div className="text-[10px] font-bold text-[#FFFAF8]/60 uppercase tracking-[0.2em] mb-1">Total Bill to Supplier</div>
                <div className="text-3xl font-black text-white">PKR {piTotal.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <button type="submit" className="w-full bg-[#E65100] text-white py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-[1.01] active:scale-95 transition-all mt-6 flex items-center justify-center gap-4">
            <Icon n="check" size={20} /> Register Purchase Invoice &amp; Update Stock
          </button>
        </form>
      </div>

      {/* Add Supplier Modal */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddSupplierModal(false)} />
          <div className="relative bg-white w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl flex flex-col">
            <header className="px-10 py-7 border-b border-[#F3E5DC] flex justify-between items-center bg-[#FFFAF8]">
              <h2 className="text-xl font-black text-[#2D1A12]">REGISTER SUPPLIER</h2>
              <button className="w-8 h-8 bg-white border border-[#F3E5DC] rounded-full flex items-center justify-center text-[#8D7A71]" onClick={() => setShowAddSupplierModal(false)}>
                <Icon n="close" size={16} />
              </button>
            </header>
            <form onSubmit={handleCreateSupplier} className="p-10 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#8D7A71] uppercase tracking-widest">Supplier / Company Name *</label>
                <input required type="text" value={newSupplierForm.name} onChange={e => setNewSupplierForm({ ...newSupplierForm, name: e.target.value })} placeholder="e.g. ProCycle Electric Parts" className="w-full bg-[#FFFAF8] border border-[#F3E5DC] rounded-2xl py-3.5 px-5 outline-none font-bold text-xs" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#8D7A71] uppercase tracking-widest">Contact Info (Phone/Email) *</label>
                <input required type="text" value={newSupplierForm.contact} onChange={e => setNewSupplierForm({ ...newSupplierForm, contact: e.target.value })} placeholder="e.g. +92 300 1234567" className="w-full bg-[#FFFAF8] border border-[#F3E5DC] rounded-2xl py-3.5 px-5 outline-none font-bold text-xs" />
              </div>
              <button type="submit" className="w-full bg-[#E65100] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg">Save Supplier</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseInvoices;
