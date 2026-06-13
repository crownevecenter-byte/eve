// pos/SaleInvoices.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../../services/api';
import { Icon } from '../../../../components/branch/BranchShared';
import { Trash2 } from 'lucide-react';
import { useDebounce } from '../../../../hooks/useDebounce';
import SearchInput from '../../../../components/SearchInput';
import './SaleInvoices.css';

const SaleInvoices = ({ user, queryClient, onInvoiceGenerated }) => {
  const [siForm, setSiForm] = useState({
    type: 'bike',
    items: [],
    customerKind: 'walkin', // walkin | online
    customerId: '',
    paymentMethod: 'CASH',
    amount: '',
    bankId: ''
  });
  const [siItemSearch, setSiItemSearch] = useState('');
  const [siCustomerSearch, setSiCustomerSearch] = useState('');
  const debouncedSiItemSearch = useDebounce(siItemSearch, 300);
  const debouncedSiCustomerSearch = useDebounce(siCustomerSearch, 300);

  const { data: siItems, isLoading: loadingSiItems } = useQuery({
    queryKey: ['si-items', siForm.type, debouncedSiItemSearch],
    queryFn: () => api.get('/products', {
      params: { branchId: user?.branchId, product_type: siForm.type, search: debouncedSiItemSearch, limit: 50, lite: '1' }
    }).then(r => r.data),
    enabled: !!debouncedSiItemSearch
  });

  const { data: siCustomers, isLoading: loadingSiCustomers } = useQuery({
    queryKey: ['si-customers', siForm.customerKind, debouncedSiCustomerSearch],
    queryFn: () => {
      if (siForm.customerKind === 'online') {
        return api.get('/users/online-customers', {
          params: { search: debouncedSiCustomerSearch, limit: 50 }
        }).then(r => r.data);
      }
      return api.get('/walk-in-customers', {
        params: { branchId: user?.branchId, search: debouncedSiCustomerSearch, limit: 50 }
      }).then(r => r.data);
    },
    enabled: !!debouncedSiCustomerSearch
  });

  const handleSiSubmit = async (e) => {
    e.preventDefault();
    if (siForm.items.length === 0) return alert('Please add at least one product');
    if (!siForm.customerId) return alert('Please select a customer');
    if (!siForm.amount || siForm.amount <= 0) return alert('Please enter a valid amount');
    try {
      const payload = {
        branchId: user?.branchId,
        ...(siForm.customerKind === 'walkin'
          ? { walkInCustomerId: siForm.customerId }
          : { customerId: siForm.customerId }),
        bankId: siForm.paymentMethod === 'BANK' ? siForm.bankId : null,
        payment_method: siForm.paymentMethod,
        total: parseFloat(siForm.amount),
        type: 'POS',
        items: siForm.items.map(item => ({
          productId: item.id,
          quantity: item.qty,
          price: item.price
        }))
      };
      const res = await api.post('/orders', payload);
      const selected = siCustomers?.data?.find((c) => c.id === siForm.customerId);
      const customerMeta =
        siForm.customerKind === 'online'
          ? {
              kind: 'online',
              name: selected?.name,
              email: selected?.email,
              label: 'Online Customer',
            }
          : {
              kind: 'walkin',
              name: selected ? `${selected.first_name} ${selected.last_name}`.trim() : siCustomerSearch.split(' (')[0],
              phone: selected?.phone || selected?.cnic,
              label: 'Store Sale',
            };
      onInvoiceGenerated({
        ...res.data,
        customerMeta,
        saleCategory: siForm.type,
        branchName: user?.branchName,
        issuedBy: user?.name,
      });
      setSiForm({ ...siForm, items: [], amount: '', bankId: '', customerId: '' });
      setSiItemSearch('');
      setSiCustomerSearch('');
      queryClient.invalidateQueries(['si-items']);
      queryClient.invalidateQueries(['si-customers']);
    } catch (err) {
      alert('Failed to generate invoice: ' + (err.response?.data?.message || err.message));
    }
  };

  const addItemToSi = (product) => {
    if (product.stock_qty <= 0) {
      alert(`Insufficient Stock! "${product.name}" cannot be sold because its stock quantity is 0.`);
      return;
    }
    setSiForm(prev => {
      const exists = prev.items.find(i => i.id === product.id);
      if (exists) {
        if (exists.qty + 1 > product.stock_qty) {
          alert(`Insufficient Stock! Cannot add more. Only ${product.stock_qty} unit(s) available.`);
          return prev;
        }
        const newItems = prev.items.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
        return { ...prev, items: newItems, amount: newItems.reduce((s, i) => s + i.price * i.qty, 0) };
      }
      const newItem = {
        id: product.id, name: product.name, price: product.price, qty: 1,
        stock: product.stock_qty,
        model: product.partDetail?.model || product.bikeDetail?.motor_type || 'N/A',
        description: product.partDetail?.description || product.bikeDetail?.battery_type || ''
      };
      const newItems = [...prev.items, newItem];
      return { ...prev, items: newItems, amount: newItems.reduce((s, i) => s + i.price * i.qty, 0) };
    });
    setSiItemSearch('');
  };

  const updateItemQty = (id, delta) => {
    setSiForm(prev => {
      let isOverStock = false;
      const newItems = prev.items.map(i => {
        if (i.id === id) {
          const targetQty = i.qty + delta;
          if (targetQty > i.stock) {
            isOverStock = true;
            return i;
          }
          const q = Math.max(1, targetQty);
          return { ...i, qty: q };
        }
        return i;
      });
      if (isOverStock) {
        alert("Insufficient Stock! Cannot exceed available stock.");
        return prev;
      }
      return { ...prev, items: newItems, amount: newItems.reduce((s, i) => s + i.price * i.qty, 0) };
    });
  };

  const removeItemFromSi = (id) => {
    setSiForm(prev => {
      const newItems = prev.items.filter(i => i.id !== id);
      return { ...prev, items: newItems, amount: newItems.reduce((s, i) => s + i.price * i.qty, 0) };
    });
  };

  return (
    <div className="sale-invoices-container flex flex-col h-full space-y-4 md:space-y-6">
      <div className="pos-card p-4 sm:p-6 md:p-8 max-w-5xl mx-auto w-full min-w-0">
        <div className="mb-6 md:mb-10 text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#2D1A12] uppercase tracking-tight">Generate Sale Invoice</h2>
          <p className="text-[9px] sm:text-[10px] font-bold text-[#8D7A71] uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-2">Professional Billing Terminal</p>
        </div>

        <form onSubmit={handleSiSubmit} className="space-y-6 md:space-y-10">
          {/* Category Toggle */}
          <div className="space-y-3 md:space-y-4">
            <label className="text-[10px] font-black text-[#8D7A71] uppercase tracking-[0.2em] ml-2">Product Category</label>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 p-2 bg-[#FFFAF8] border border-[#F3E5DC] rounded-2xl sm:rounded-[2rem] w-full sm:w-fit">
              <button type="button" onClick={() => setSiForm({ ...siForm, type: 'bike' })}
                className={`w-full sm:w-auto px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-[1.5rem] font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${siForm.type === 'bike' ? 'bg-[#E65100] text-white shadow-lg shadow-[#E65100]/20' : 'text-[#8D7A71] hover:bg-white'}`}>
                <Icon n="dashboard" size={16} /> Electric Bikes
              </button>
              <button type="button" onClick={() => setSiForm({ ...siForm, type: 'part' })}
                className={`w-full sm:w-auto px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-[1.5rem] font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${siForm.type === 'part' ? 'bg-[#E65100] text-white shadow-lg shadow-[#E65100]/20' : 'text-[#8D7A71] hover:bg-white'}`}>
                <Icon n="inventory" size={16} /> Spare Parts
              </button>
            </div>
          </div>

          {/* Item Search */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-[#8D7A71] uppercase tracking-[0.2em] ml-2">Quick Add {siForm.type === 'bike' ? 'Bike' : 'Part'}</label>
            <div className="relative">
              <SearchInput
                variant="pos"
                value={siItemSearch}
                onChange={(e) => setSiItemSearch(e.target.value)}
                label={`Search ${siForm.type} by name, model or description...`}
              />
              {siItemSearch && (
                <div className="absolute z-20 left-0 right-0 mt-2 bg-white border border-[#F3E5DC] rounded-3xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto custom-scrollbar">
                  {loadingSiItems ? (
                    <div className="p-6 text-center animate-pulse text-[#8D7A71] text-xs font-bold uppercase">Searching database...</div>
                  ) : siItems?.data?.length === 0 ? (
                    <div className="p-6 text-center text-[#8D7A71] text-xs font-bold uppercase">No matching items found</div>
                  ) : siItems?.data?.map(item => (
                    <div key={item.id} onClick={() => addItemToSi(item)}
                      className="px-6 py-4 hover:bg-[#FFFAF8] cursor-pointer border-b border-[#F3E5DC] last:border-none group">
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-black text-[#2D1A12] text-sm uppercase group-hover:text-[#E65100] transition-colors">{item.name}</div>
                        <div className="text-[#E65100] font-black text-xs">PKR {item.price.toLocaleString()}</div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-[10px] font-bold text-[#8D7A71] uppercase tracking-tighter">
                          Model: <span className="text-[#2D1A12]">{item.partDetail?.model || item.bikeDetail?.motor_type || 'Standard'}</span> •{' '}
                          Stock: <span className={item.stock_qty > 0 ? 'text-emerald-600' : 'text-red-600'}>{item.stock_qty} Units</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected Items Table */}
          {siForm.items.length > 0 && (
            <div className="space-y-4">
              <label className="text-[10px] font-black text-[#8D7A71] uppercase tracking-[0.2em] ml-2">Invoice Items</label>
              <div className="pos-table-wrap bg-[#FFFAF8] border border-[#F3E5DC] rounded-2xl sm:rounded-3xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F3E5DC]/30 border-b border-[#F3E5DC]">
                      <th className="px-6 py-4 text-[10px] font-black text-[#8D7A71] uppercase tracking-widest">Item Description</th>
                      <th className="px-6 py-4 text-[10px] font-black text-[#8D7A71] uppercase tracking-widest text-center">Qty</th>
                      <th className="px-6 py-4 text-[10px] font-black text-[#8D7A71] uppercase tracking-widest text-right">Unit Price</th>
                      <th className="px-6 py-4 text-[10px] font-black text-[#8D7A71] uppercase tracking-widest text-right">Total</th>
                      <th className="px-6 py-4 text-[10px] font-black text-[#8D7A71] uppercase tracking-widest text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {siForm.items.map(item => (
                      <tr key={item.id} className="border-b border-[#F3E5DC] last:border-none">
                        <td className="px-6 py-4">
                          <div className="font-black text-[#2D1A12] text-xs uppercase">{item.name}</div>
                          <div className="text-[9px] font-bold text-[#8D7A71] uppercase tracking-tighter">Model: {item.model}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-3">
                            <button type="button" onClick={() => updateItemQty(item.id, -1)} className="w-6 h-6 rounded-full bg-white border border-[#F3E5DC] flex items-center justify-center text-xs font-black hover:bg-[#F3E5DC]">−</button>
                            <span className="font-black text-xs w-6 text-center">{item.qty}</span>
                            <button type="button" onClick={() => updateItemQty(item.id, 1)} className="w-6 h-6 rounded-full bg-white border border-[#F3E5DC] flex items-center justify-center text-xs font-black hover:bg-[#F3E5DC]">+</button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-xs">PKR {item.price.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right font-black text-xs text-[#E65100]">PKR {(item.price * item.qty).toLocaleString()}</td>
                        <td className="px-6 py-4 text-center">
                          <button type="button" onClick={() => removeItemFromSi(item.id)} className="text-red-400 hover:text-red-600 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
            {/* Customer Select */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-[#8D7A71] uppercase tracking-[0.2em] ml-2">Customer Type</label>
              <div className="flex flex-col xs:flex-row gap-2 p-1 bg-[#FFFAF8] border border-[#F3E5DC] rounded-2xl w-full sm:w-fit">
                <button type="button" onClick={() => { setSiForm({ ...siForm, customerKind: 'walkin', customerId: '' }); setSiCustomerSearch(''); }}
                  className={`w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${siForm.customerKind === 'walkin' ? 'bg-[#E65100] text-white' : 'text-[#8D7A71]'}`}>
                  Walk-in / Offline
                </button>
                <button type="button" onClick={() => { setSiForm({ ...siForm, customerKind: 'online', customerId: '' }); setSiCustomerSearch(''); }}
                  className={`w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${siForm.customerKind === 'online' ? 'bg-[#E65100] text-white' : 'text-[#8D7A71]'}`}>
                  Online Customer
                </button>
              </div>
              <label className="text-[10px] font-black text-[#8D7A71] uppercase tracking-[0.2em] ml-2">Assign Customer</label>
              <div className="relative">
                <SearchInput
                  variant="pos"
                  value={siCustomerSearch}
                  onChange={(e) => {
                    setSiCustomerSearch(e.target.value);
                    if (siForm.customerId) setSiForm({ ...siForm, customerId: '' });
                  }}
                  label={siForm.customerKind === 'online' ? 'Search name or email...' : 'Search name or phone...'}
                />
                {siCustomerSearch && !siForm.customerId && (
                  <div className="absolute z-10 left-0 right-0 mt-2 bg-white border border-[#F3E5DC] rounded-3xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar">
                    {loadingSiCustomers ? (
                      <div className="p-6 text-center animate-pulse text-[#8D7A71] text-xs font-bold uppercase">Fetching records...</div>
                    ) : siCustomers?.data?.length === 0 ? (
                      <div className="p-6 text-center text-[#8D7A71] text-xs font-bold uppercase">Customer not found</div>
                    ) : siCustomers?.data?.map(cust => (
                      <div key={cust.id} onClick={() => {
                        if (siForm.customerKind === 'online') {
                          setSiForm({ ...siForm, customerId: cust.id });
                          setSiCustomerSearch(`${cust.name} (${cust.email})`);
                        } else {
                          setSiForm({ ...siForm, customerId: cust.id });
                          setSiCustomerSearch(`${cust.first_name} ${cust.last_name} (${cust.phone})`);
                        }
                      }}
                        className="px-6 py-4 hover:bg-[#FFFAF8] cursor-pointer border-b border-[#F3E5DC] last:border-none">
                        {siForm.customerKind === 'online' ? (
                          <>
                            <div className="font-black text-[#2D1A12] text-sm uppercase">{cust.name}</div>
                            <div className="text-[10px] font-bold text-[#8D7A71] tracking-widest">{cust.email}</div>
                          </>
                        ) : (
                          <>
                            <div className="font-black text-[#2D1A12] text-sm uppercase">{cust.first_name} {cust.last_name}</div>
                            <div className="text-[10px] font-bold text-[#8D7A71] tracking-widest">{cust.phone}</div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-[9px] text-[#8D7A71] ml-2">Ledger: DR Customer Account · CR Sales Account on save</p>
            </div>

            {/* Total Summary */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-[#8D7A71] uppercase tracking-[0.2em] ml-2">Invoice Summary</label>
              <div className="bg-[#E65100] p-5 sm:p-8 rounded-2xl sm:rounded-[2rem] text-white shadow-xl shadow-[#E65100]/20">
                <div className="text-[10px] font-bold text-[#FFFAF8]/80 uppercase tracking-[0.2em] mb-2">Total Bill Amount</div>
                <div className="relative">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-white/80 font-black text-lg sm:text-xl">PKR</span>
                  <input type="number" value={siForm.amount} onChange={e => setSiForm({ ...siForm, amount: e.target.value })} placeholder="0"
                    className="w-full bg-transparent border-b-2 border-white/30 py-2 pl-10 sm:pl-12 pr-4 outline-none focus:border-white font-black text-2xl sm:text-4xl text-white placeholder-white/30 transition-colors" />
                </div>
              </div>
            </div>
          </div>

          <button type="submit"
            className="w-full bg-[#2D1A12] text-white py-4 sm:py-6 rounded-2xl sm:rounded-[2.5rem] font-black text-xs sm:text-sm uppercase tracking-widest shadow-2xl hover:bg-[#E65100] hover:scale-[1.01] active:scale-95 transition-all mt-4 sm:mt-6 flex items-center justify-center gap-3 sm:gap-4">
            <Icon n="check" size={20} /> Complete Sale &amp; Print Invoice
          </button>
        </form>
      </div>
    </div>
  );
};

export default SaleInvoices;
