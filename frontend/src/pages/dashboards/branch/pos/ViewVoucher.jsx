import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../../services/api';
import { Search, Printer, CheckCircle2, Trash2 } from 'lucide-react';
import SearchInput from '../../../../components/SearchInput';

const ViewVoucher = ({ user }) => {
  const [voucherType, setVoucherType] = useState('PAYMENT');
  const [searchVoucherNo, setSearchVoucherNo] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['view-voucher', user?.branchId, voucherType, submittedSearch],
    queryFn: () => api.get('/vouchers', { 
      params: { 
        branchId: user?.branchId, 
        voucher_type: voucherType,
        voucher_no: submittedSearch
      } 
    }).then(r => r.data),
    enabled: !!user?.branchId && !!submittedSearch
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchVoucherNo.trim()) return;
    setSubmittedSearch(searchVoucherNo.trim());
  };

  const [isDeleting, setIsDeleting] = useState(false);

  const voucher = data?.data && data.data.length > 0 ? data.data[0] : null;

  const handleDelete = async () => {
    if (!voucher) return;
    if (!window.confirm("CRITICAL WARNING: Are you sure you want to completely delete this voucher? This action will strictly reverse the double-entry account balances and permanently erase the record from the ledger. This cannot be undone.")) return;

    setIsDeleting(true);
    try {
      await api.delete(`/vouchers/${voucher.id}`);
      alert("Voucher successfully deleted and ledger balances correctly reversed.");
      setSubmittedSearch('');
      setSearchVoucherNo('');
    } catch (err) {
      alert("Error deleting voucher: " + (err.response?.data?.message || err.message));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full p-2 pb-10">
      
      {/* Compact Search Header */}
      <div className="w-full bg-white border border-[#E5E7EB] rounded-xl shadow-sm flex flex-col font-sans print:hidden">
        <form onSubmit={handleSearch} className="p-4 flex flex-col sm:flex-row gap-4 items-end bg-[#FAFAFA] rounded-xl">
          <div className="flex-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Voucher Type</label>
            <select 
              value={voucherType}
              onChange={(e) => { setVoucherType(e.target.value); setSubmittedSearch(''); }}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-800 shadow-sm outline-none focus:border-gray-400 transition-all"
            >
              <option value="PAYMENT">Payment Voucher</option>
              <option value="RECEIPT">Receipt Voucher</option>
              <option value="JOURNAL">Journal Voucher</option>
            </select>
          </div>
          
          <div className="flex-[2]">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Voucher Number</label>
            <SearchInput
              value={searchVoucherNo}
              onChange={(e) => setSearchVoucherNo(e.target.value)}
              label="e.g. PV-20260519-1"
            />
          </div>

          <button 
            type="submit"
            className="bg-gray-800 text-white px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-widest shadow-sm hover:bg-gray-900 active:scale-95 transition-all flex items-center justify-center gap-2 h-[38px]"
          >
            <Search size={14} /> Search
          </button>
        </form>
      </div>

      {/* Result Area */}
      {isLoading && (
        <div className="py-10 text-center text-gray-400 font-bold animate-pulse text-sm">Searching...</div>
      )}

      {!isLoading && submittedSearch && !voucher && (
        <div className="w-full bg-white border border-dashed border-gray-300 rounded-xl py-12 flex flex-col items-center text-center shadow-sm">
          <h3 className="text-sm font-black text-gray-700 uppercase tracking-wider">Not Found</h3>
          <p className="text-[10px] font-bold text-gray-500 mt-1">No {voucherType} matches "{submittedSearch}".</p>
        </div>
      )}

      {voucher && (
        <div className="w-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col font-sans relative print:shadow-none print:border-none print:rounded-none mt-2">
          
          {/* Action Bar */}
          <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex justify-between items-center print:hidden">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Verified Record</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => window.print()} className="bg-white border border-gray-200 text-gray-600 px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2">
                <Printer size={14} /> Print
              </button>
              <button 
                onClick={handleDelete} 
                disabled={isDeleting}
                className="bg-red-50 text-red-600 border border-red-200 px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-red-100 hover:text-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Trash2 size={14} /> {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>

          {/* Compact Body */}
          <div className="p-6">
            
            {/* Header Info */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-lg font-black text-gray-800 tracking-tight">CROWN EVE</h2>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{voucher.voucher_type} VOUCHER</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-black text-gray-800 uppercase">NO. {voucher.voucher_no.includes('-') ? voucher.voucher_no.split('-')[1] : voucher.voucher_no}</div>
                <div className="text-[10px] font-bold text-gray-500 mt-0.5">{new Date(voucher.date || voucher.createdAt).toLocaleDateString()} | {new Date(voucher.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
              </div>
            </div>

            {/* Elegant Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest w-1/2">Account Name</th>
                    <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Debit (PKR)</th>
                    <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Credit (PKR)</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {/* Debit Row */}
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-3">
                      <div className="font-bold text-gray-800 uppercase">{voucher.toAccount?.account_name || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-black text-gray-800">
                      {voucher.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-400">-</td>
                  </tr>
                  
                  {/* Credit Row */}
                  <tr className="border-b border-gray-200">
                    <td className="px-4 py-3">
                      <div className="font-bold text-gray-800 uppercase pl-4">{voucher.fromAccount?.account_name || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-400">-</td>
                    <td className="px-4 py-3 text-right font-black text-gray-800">
                      {voucher.amount.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="px-4 py-3 font-black text-[10px] text-gray-500 uppercase tracking-widest text-right">Total</td>
                    <td className="px-4 py-3 text-right font-black text-xs text-gray-800">{voucher.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-black text-xs text-gray-800">{voucher.amount.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Details */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Description</div>
                <div className="text-xs font-bold text-gray-700">{voucher.description || '-'}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Ref #</div>
                <div className="text-xs font-bold text-gray-700">{voucher.ref_no || '-'}</div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ViewVoucher;
