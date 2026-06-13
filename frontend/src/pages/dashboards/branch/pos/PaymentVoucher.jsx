// frontend/src/pages/dashboards/branch/pos/PaymentVoucher.jsx
import React, { useState, useEffect } from 'react';
import api from '../../../../services/api';
import { useVoucherPageInit } from '../../../../hooks/useVoucherPageInit';
import { Search, FileText, Send, List, ShieldCheck } from 'lucide-react';
import './Vouchers.css';

const PaymentVoucher = ({ user }) => {
  const [formData, setFormData] = useState({
    fromCategoryId: '',
    toCategoryId: '',
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    ref_no: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: init, isLoading: loadingHistory, refetch: refetchInit } = useVoucherPageInit('PAYMENT', user?.branchId);

  const categories = init?.categories?.data || [];
  const accounts = init?.accounts?.data || [];
  const vouchersHistory = init?.history?.data || [];
  const nextVoucherNo = init?.nextNo?.nextNo || 'Fetching...';

  // Filter accounts based on selected category
  const fromAccountsFiltered = accounts.filter(acc => 
    acc.status === 'ACTIVE' && 
    (formData.fromCategoryId ? acc.categoryId === formData.fromCategoryId : true)
  );
  
  const toAccountsFiltered = accounts.filter(acc => 
    acc.status === 'ACTIVE' && 
    acc.id !== formData.fromAccountId &&
    (formData.toCategoryId ? acc.categoryId === formData.toCategoryId : true)
  );

  // Auto-clear selected account if its category changes and it no longer matches
  useEffect(() => {
    if (formData.fromAccountId) {
      const acc = accounts.find(a => a.id === formData.fromAccountId);
      if (acc && formData.fromCategoryId && acc.categoryId !== formData.fromCategoryId) {
        setFormData(prev => ({ ...prev, fromAccountId: '' }));
      }
    }
  }, [formData.fromCategoryId, accounts, formData.fromAccountId]);

  useEffect(() => {
    if (formData.toAccountId) {
      const acc = accounts.find(a => a.id === formData.toAccountId);
      if (acc && formData.toCategoryId && acc.categoryId !== formData.toCategoryId) {
        setFormData(prev => ({ ...prev, toAccountId: '' }));
      }
    }
  }, [formData.toCategoryId, accounts, formData.toAccountId]);


  // Calculate balances
  const selectedFromAccount = accounts.find(acc => acc.id === formData.fromAccountId);
  const currentFromBalance = selectedFromAccount ? selectedFromAccount.current_balance : 0;

  const selectedToAccount = accounts.find(acc => acc.id === formData.toAccountId);
  const currentToBalance = selectedToAccount ? selectedToAccount.current_balance : 0;

  // Formatting helper for Dr / Cr display
  const formatBalance = (bal, accountId) => {
    if (!accountId) return '0.00';
    if (bal === 0) return '0.00';

    const account = accounts.find(a => a.id === accountId);
    const cat = categories.find(c => c.id === account?.categoryId);
    const catName = cat ? cat.name.toLowerCase() : '';

    const isDebitNature = 
      catName.includes('bank') ||
      catName.includes('cash') ||
      catName.includes('asset') ||
      catName.includes('expense') ||
      catName.includes('customer') ||
      catName.includes('purchase');

    let type = '';
    if (isDebitNature) {
      type = bal > 0 ? 'Dr' : 'Cr';
    } else {
      type = bal > 0 ? 'Cr' : 'Dr';
    }

    return `${Math.abs(bal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${type}`;
  };

  // Filter History by Search
  const filteredHistory = vouchersHistory.filter(v => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      v.voucher_no.toLowerCase().includes(term) ||
      (v.ref_no && v.ref_no.toLowerCase().includes(term)) ||
      (v.description && v.description.toLowerCase().includes(term)) ||
      (v.fromAccount?.account_name?.toLowerCase().includes(term)) ||
      (v.toAccount?.account_name?.toLowerCase().includes(term)) ||
      v.amount.toString().includes(term)
    );
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fromAccountId) return alert("Please select a From Account");
    if (!formData.toAccountId) return alert("Please select a To Account");
    if (!formData.amount || parseFloat(formData.amount) <= 0) return alert("Please enter a positive amount");

    // Get category names to save in voucher metadata
    const fromCat = categories.find(c => c.id === formData.fromCategoryId)?.name || 'N/A';
    const toCat = categories.find(c => c.id === formData.toCategoryId)?.name || 'N/A';

    setSubmitting(true);
    try {
      await api.post('/vouchers', {
        voucher_type: 'PAYMENT',
        category: fromCat,
        to_type: toCat,
        fromAccountId: formData.fromAccountId,
        toAccountId: formData.toAccountId,
        amount: parseFloat(formData.amount),
        ref_no: formData.ref_no,
        description: formData.description,
        date: formData.date,
        branchId: user?.branchId
      });

      alert("Payment Voucher posted successfully! Live balances updated.");
      setFormData(prev => ({
        ...prev,
        toCategoryId: '',
        toAccountId: '',
        amount: '',
        ref_no: '',
        description: '',
      }));
      refetchInit();
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full p-2 pb-10">
      
      {/* Main Voucher Form Card - Full Width */}
      <div className="w-full bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden flex flex-col font-sans">
        
        {/* Modern Professional Red Header */}
        <div className="bg-gradient-to-r from-[#D32F2F] to-[#B71C1C] px-8 py-5 flex justify-between items-center shadow-inner">
          <div>
            <span className="text-[10px] font-black text-red-100/80 uppercase tracking-widest">Outward Transaction</span>
            <h1 className="text-white text-2xl font-black italic tracking-wide drop-shadow-md flex items-center gap-2 mt-0.5">
              <FileText size={24} className="text-red-100" /> Payment Voucher
            </h1>
          </div>
          <div className="bg-black/20 px-4 py-2 rounded-xl border border-white/20 text-sm font-black text-white uppercase tracking-wider shadow-inner">
            Voucher# PV-Auto
          </div>
        </div>

        {/* Form Body Container */}
        <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-6">
          
          {/* Two Columns Grid - Spaced out nicely for full width */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-12 gap-y-6">
            
            {/* --- LEFT COLUMN --- */}
            <div className="flex flex-col gap-5 bg-[#FFFAF8] p-6 rounded-2xl border border-red-50">
              
              <div className="flex items-center">
                <label className="w-32 text-right pr-4 font-bold text-[#8D7A71] text-xs uppercase tracking-wider">Voucher#:</label>
                <input 
                  type="text" 
                  disabled 
                  value={nextVoucherNo} 
                  className="flex-1 bg-white border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-gray-500 font-bold shadow-sm"
                />
              </div>

              <div className="flex items-center">
                <label className="w-32 text-right pr-4 font-bold text-[#8D7A71] text-xs uppercase tracking-wider">From Type <span className="text-red-500 font-black">*</span>:</label>
                <select 
                  required
                  value={formData.fromCategoryId}
                  onChange={e => setFormData({ ...formData, fromCategoryId: e.target.value })}
                  className="flex-1 bg-white border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm font-bold text-[#2D1A12] shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                >
                  <option value="">-- Select Cash/Bank --</option>
                  {categories.filter(cat => cat.name.toLowerCase().includes('cash') || cat.name.toLowerCase().includes('bank')).map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <label className="w-32 text-right pr-4 font-bold text-[#8D7A71] text-xs uppercase tracking-wider">From Account <span className="text-red-500 font-black">*</span>:</label>
                <select 
                  required
                  value={formData.fromAccountId}
                  onChange={e => setFormData({ ...formData, fromAccountId: e.target.value })}
                  className="flex-1 bg-white border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm font-bold text-[#2D1A12] shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                >
                  <option value="">Select Account...</option>
                  {fromAccountsFiltered.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.account_name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <label className="w-32 text-right pr-4 font-bold text-[#8D7A71] text-xs uppercase tracking-wider">Balance:</label>
                <input 
                  type="text" 
                  disabled 
                  value={formatBalance(currentFromBalance, formData.fromAccountId)} 
                  className="flex-1 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-right text-[#D32F2F] font-black shadow-inner"
                />
              </div>

              <div className="flex items-center">
                <label className="w-32 text-right pr-4 font-bold text-[#8D7A71] text-xs uppercase tracking-wider">Amount (PKR) <span className="text-red-500 font-black">*</span>:</label>
                <input 
                  required
                  type="number" 
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className="flex-1 bg-white border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-right font-black text-[#2D1A12] shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                />
              </div>
            </div>

            {/* --- RIGHT COLUMN --- */}
            <div className="flex flex-col gap-5 bg-[#F9FAFB] p-6 rounded-2xl border border-gray-100">
              
              <div className="flex items-center">
                <label className="w-32 text-right pr-4 font-bold text-[#8D7A71] text-xs uppercase tracking-wider">Date <span className="text-red-500 font-black">*</span>:</label>
                <input 
                  required
                  type="date" 
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="flex-1 bg-white border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm font-bold text-[#2D1A12] shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                />
              </div>

              <div className="flex items-center">
                <label className="w-32 text-right pr-4 font-bold text-[#8D7A71] text-xs uppercase tracking-wider">To Type <span className="text-red-500 font-black">*</span>:</label>
                <select 
                  required
                  value={formData.toCategoryId}
                  onChange={e => setFormData({ ...formData, toCategoryId: e.target.value })}
                  className="flex-1 bg-white border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm font-bold text-[#2D1A12] shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                >
                  <option value="">-- All Categories --</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <label className="w-32 text-right pr-4 font-bold text-[#8D7A71] text-xs uppercase tracking-wider">To Account <span className="text-red-500 font-black">*</span>:</label>
                <select 
                  required
                  value={formData.toAccountId}
                  onChange={e => setFormData({ ...formData, toAccountId: e.target.value })}
                  className="flex-1 bg-white border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm font-bold text-[#2D1A12] shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                >
                  <option value="">Select Account...</option>
                  {toAccountsFiltered.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.account_name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <label className="w-32 text-right pr-4 font-bold text-[#8D7A71] text-xs uppercase tracking-wider">Balance:</label>
                <input 
                  type="text" 
                  disabled 
                  value={formatBalance(currentToBalance, formData.toAccountId)} 
                  className="flex-1 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-right font-black text-[#E65100] shadow-inner"
                />
              </div>

              <div className="flex items-center">
                <label className="w-32 text-right pr-4 font-bold text-[#8D7A71] text-xs uppercase tracking-wider">Ref # <span className="text-red-500 font-black">*</span>:</label>
                <input 
                  required
                  type="text" 
                  value={formData.ref_no}
                  onChange={e => setFormData({ ...formData, ref_no: e.target.value })}
                  placeholder="e.g. Chq-8484"
                  className="flex-1 bg-white border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm font-bold text-[#2D1A12] shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                />
              </div>
            </div>

          </div>

          {/* Description - Full Width */}
          <div className="flex items-center mt-2 px-2">
            <label className="w-28 xl:w-32 text-right pr-4 font-bold text-[#8D7A71] text-xs uppercase tracking-wider">Description:</label>
            <input 
              type="text" 
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Payment purpose or remarks..."
              className="flex-1 bg-white border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm font-bold text-[#2D1A12] shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
            />
          </div>

          {/* Bottom Action Bar */}
          <div className="mt-4 border-t border-[#F3E5DC] pt-6 flex justify-end gap-4">
            <button 
              type="button" 
              className="px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest text-[#8D7A71] bg-[#F9FAFB] border border-[#E5E7EB] hover:bg-gray-100 transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={submitting}
              className="px-10 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest text-white bg-[#D32F2F] hover:bg-[#B71C1C] shadow-lg shadow-red-500/30 transition-all active:scale-95 flex items-center gap-2"
            >
              {submitting ? 'Saving...' : <><Send size={16} /> Post Payment Voucher</>}
            </button>
          </div>

        </form>
      </div>
      
    </div>
  );
};

export default PaymentVoucher;
