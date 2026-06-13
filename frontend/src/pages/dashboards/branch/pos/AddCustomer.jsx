import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../../services/api';
import { Icon } from "../../../../components/branch/BranchShared";
import { Plus } from "lucide-react";
import SearchInput from '../../../../components/SearchInput';
import './AddCustomer.css';

const AddCustomer = ({ user }) => {
  const [customerSearch, setCustomerSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [custForm, setCustForm] = useState({ 
    first_name: "", last_name: "", cnic: "", phone: "", whatsapp: "", address: "", email: "" 
  });

  const { data: customers, isLoading: loadingCustomers, refetch: refetchCustomers } = useQuery({
    queryKey: ['pos-customers-list', customerSearch],
    queryFn: () => api.get('/walk-in-customers', {
      params: { branchId: user?.branchId, search: customerSearch }
    }).then(r => r.data),
    enabled: !!user?.branchId && (customerSearch.trim().length >= 2 || showAddForm),
  });

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    try {
      await api.post('/walk-in-customers', { 
        ...custForm, 
        branchId: user?.branchId
      });
      alert("Walk-in customer registered successfully!");
      setShowAddForm(false);
      setCustForm({ first_name: "", last_name: "", cnic: "", phone: "", whatsapp: "", address: "", email: "" });
      refetchCustomers();
    } catch (err) {
      alert("Failed to register customer: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6 add-customer-container">
      <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-6 rounded-3xl border border-[#F3E5DC] shadow-sm">
        <div className="flex items-center gap-4 flex-1">
          <SearchInput
            className="flex-1 max-w-md"
            variant="pos"
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            label="Search customers by name or phone..."
          />
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="bg-[#E65100] text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-lg shadow-[#E65100]/20 hover:scale-105 transition-all"
        >
          <Plus size={18} /> Register Walk-in Customer
        </button>
      </div>

      <div className="flex-1 bg-white rounded-[2.5rem] border border-[#F3E5DC] shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#FFFAF8] border-b border-[#F3E5DC]">
                <th className="px-8 py-6 text-[10px] font-black text-[#8D7A71] uppercase tracking-[0.2em]">Customer Identity</th>
                <th className="px-8 py-6 text-[10px] font-black text-[#8D7A71] uppercase tracking-[0.2em]">Contact Details</th>
                <th className="px-8 py-6 text-[10px] font-black text-[#8D7A71] uppercase tracking-[0.2em]">Location</th>
                <th className="px-8 py-6 text-[10px] font-black text-[#8D7A71] uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3E5DC]">
              {loadingCustomers ? (
                <tr><td colSpan="4" className="px-8 py-12 text-center animate-pulse text-[#8D7A71]">Loading database...</td></tr>
              ) : (customers?.data || []).length === 0 ? (
                <tr><td colSpan="4" className="px-8 py-12 text-center text-[#8D7A71]">No customers found in record.</td></tr>
              ) : (customers.data.map(c => (
                <tr key={c.id} className="hover:bg-[#FFFAF8]/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#FFFAF8] border border-[#F3E5DC] rounded-2xl flex items-center justify-center text-[#E65100] font-black text-lg">
                        {c.name?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <div className="font-black text-[#2D1A12] text-sm">{c.first_name} {c.last_name}</div>
                        <div className="text-[10px] font-bold text-[#8D7A71] uppercase tracking-widest mt-0.5">ID: {c.id.slice(0,8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-[#2D1A12] flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {c.phone}
                      </div>
                      {c.whatsapp && (
                        <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-2">
                           WA: {c.whatsapp}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-xs font-bold text-[#8D7A71] uppercase tracking-widest">{c.address || "Walk-in"}</div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="text-[10px] font-black text-[#E65100] hover:underline uppercase tracking-widest">Select to Invoice</button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddForm(false)} />
          <div className="relative bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
            <header className="px-12 py-8 border-b border-[#F3E5DC] flex justify-between items-center bg-[#FFFAF8]">
              <div>
                <h2 className="text-2xl font-black text-[#2D1A12]">REGISTER CUSTOMER</h2>
                <p className="text-[10px] font-bold text-[#8D7A71] uppercase tracking-[0.2em] mt-1">Walk-in Customer Profile</p>
              </div>
              <button className="w-10 h-10 bg-white border border-[#F3E5DC] rounded-full flex items-center justify-center text-[#8D7A71]" onClick={() => setShowAddForm(false)}>
                <Icon n="close" size={20} />
              </button>
            </header>
            
            <form onSubmit={handleAddCustomer} className="p-12 overflow-y-auto space-y-8 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#8D7A71] uppercase tracking-widest ml-1">First Name *</label>
                  <input required type="text" value={custForm.first_name} onChange={e => setCustForm({...custForm, first_name: e.target.value})} placeholder="e.g. Ali" className="w-full bg-[#FFFAF8] border border-[#F3E5DC] rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-[#E65100]/20 font-bold text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#8D7A71] uppercase tracking-widest ml-1">Last Name</label>
                  <input type="text" value={custForm.last_name} onChange={e => setCustForm({...custForm, last_name: e.target.value})} placeholder="e.g. Khan" className="w-full bg-[#FFFAF8] border border-[#F3E5DC] rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-[#E65100]/20 font-bold text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#8D7A71] uppercase tracking-widest ml-1">Phone Number *</label>
                  <input required type="tel" value={custForm.phone} onChange={e => setCustForm({...custForm, phone: e.target.value})} placeholder="03XXXXXXXXX" className="w-full bg-[#FFFAF8] border border-[#F3E5DC] rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-[#E65100]/20 font-bold text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#8D7A71] uppercase tracking-widest ml-1">WhatsApp</label>
                  <input type="tel" value={custForm.whatsapp} onChange={e => setCustForm({...custForm, whatsapp: e.target.value})} placeholder="03XXXXXXXXX" className="w-full bg-[#FFFAF8] border border-[#F3E5DC] rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-[#E65100]/20 font-bold text-sm" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#8D7A71] uppercase tracking-widest ml-1">Address / Location</label>
                <input type="text" value={custForm.address} onChange={e => setCustForm({...custForm, address: e.target.value})} placeholder="e.g. DHA Phase 1" className="w-full bg-[#FFFAF8] border border-[#F3E5DC] rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-[#E65100]/20 font-bold text-sm" />
              </div>

              <button type="submit" className="w-full bg-[#E65100] text-white py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-[#E65100]/20 hover:scale-[1.02] active:scale-95 transition-all mt-4">Save Customer Record</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddCustomer;
