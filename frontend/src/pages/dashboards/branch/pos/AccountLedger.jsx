import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../../../services/api';
import { useAccountsPageInit } from '../../../../hooks/useAccountsPageInit';
import { Search, Printer, Calendar, Download, RefreshCw } from 'lucide-react';
import './Reports.css';

const AccountLedger = ({ user }) => {
  const queryClient = useQueryClient();
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState(null);

  const { data: pageInit } = useAccountsPageInit(user?.branchId);
  const categories = pageInit?.categories?.data || [];
  const accounts = pageInit?.accounts?.data || [];
  const activeAccounts = accounts.filter(acc => 
    acc.status === 'ACTIVE' && 
    (selectedCategoryId ? acc.categoryId === selectedCategoryId : true)
  );

  useEffect(() => {
    if (selectedAccountId) {
      const acc = accounts.find(a => a.id === selectedAccountId);
      if (acc && selectedCategoryId && acc.categoryId !== selectedCategoryId) {
        setSelectedAccountId('');
      }
    }
  }, [selectedCategoryId, accounts, selectedAccountId]);

  const { data: ledgerData, isLoading } = useQuery({
    queryKey: ['ledger-statement', user?.branchId, submittedSearch?.accountId, submittedSearch?.startDate, submittedSearch?.endDate],
    queryFn: () => api.get(`/accounts/${submittedSearch.accountId}/ledger-statement`, { 
      params: { 
        startDate: submittedSearch.startDate || undefined,
        endDate: submittedSearch.endDate || undefined
      } 
    }).then(r => r.data),
    enabled: !!submittedSearch?.accountId
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (!selectedAccountId) return alert("Please select an account first.");
    setSubmittedSearch({
      accountId: selectedAccountId,
      startDate: startDate,
      endDate: endDate
    });
  };

  const printLedger = () => window.print();

  const exportExcel = async () => {
    if (!submittedSearch?.accountId) return alert('Search ledger first.');
    try {
      const res = await api.get(`/accounts/${submittedSearch.accountId}/ledger-export`, {
        params: {
          startDate: submittedSearch.startDate || undefined,
          endDate: submittedSearch.endDate || undefined,
        },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `ledger-export.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const syncPartyLedgers = async () => {
    try {
      await api.post('/accounts/sync-party-ledgers', null, { params: { branchId: user?.branchId } });
      alert('All customer & supplier ledgers synced.');
      queryClient.invalidateQueries({ queryKey: ['accounts-list'] });
    } catch (err) {
      alert('Sync failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    const day = d.getDate().toString().padStart(2, '0');
    const month = d.toLocaleString('en-GB', { month: 'short' });
    const year = d.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`;
  };

  const formatNumber = (num) => {
    return Number(num || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="flex flex-col gap-6 w-full p-4 pb-10 bg-[#E8ECEF] min-h-screen">
      
      {/* Search Filter Header - Hidden on Print */}
      <div className="w-full bg-white border border-gray-300 rounded-lg shadow-md overflow-hidden font-sans print:hidden">
        <form onSubmit={handleSearch} className="p-4 bg-white flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-700">Category</label>
              <select 
                value={selectedCategoryId}
                onChange={e => setSelectedCategoryId(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-semibold outline-none focus:border-black"
              >
                <option value="">-- All --</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-700">Account *</label>
              <select 
                required
                value={selectedAccountId}
                onChange={e => setSelectedAccountId(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-semibold outline-none focus:border-black"
              >
                <option value="">Select Account...</option>
                {activeAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.account_name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-700">From</label>
              <div className="relative">
                <input 
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full border border-gray-300 rounded pl-8 pr-2 py-1.5 text-sm font-semibold outline-none focus:border-black"
                />
                <Calendar size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-700">To</label>
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <input 
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full border border-gray-300 rounded pl-8 pr-2 py-1.5 text-sm font-semibold outline-none focus:border-black"
                  />
                  <Calendar size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 md:col-span-1">
              <button 
                type="submit"
                className="bg-black text-white px-4 py-1.5 rounded text-xs font-bold uppercase shadow hover:bg-gray-800 transition-all flex items-center justify-center gap-2 flex-1 min-w-[80px]"
              >
                <Search size={14} /> Search
              </button>
              {ledgerData && (
                <>
                  <button 
                    type="button"
                    onClick={printLedger} 
                    className="bg-white border border-gray-400 text-black px-4 py-1.5 rounded text-xs font-bold uppercase shadow-sm hover:bg-gray-100 transition-all flex items-center justify-center gap-2 flex-1 min-w-[80px]"
                  >
                    <Printer size={14} /> Print
                  </button>
                  <button 
                    type="button"
                    onClick={exportExcel} 
                    className="bg-emerald-700 text-white px-4 py-1.5 rounded text-xs font-bold uppercase shadow-sm hover:bg-emerald-800 transition-all flex items-center justify-center gap-2 flex-1 min-w-[80px]"
                  >
                    <Download size={14} /> Excel
                  </button>
                </>
              )}
              <button 
                type="button"
                onClick={syncPartyLedgers} 
                className="bg-orange-600 text-white px-4 py-1.5 rounded text-xs font-bold uppercase shadow-sm hover:bg-orange-700 transition-all flex items-center justify-center gap-2 w-full"
                title="Create ledgers for all walk-in, online customers & suppliers"
              >
                <RefreshCw size={14} /> Sync Party Ledgers
              </button>
            </div>

          </div>
        </form>
      </div>

      {isLoading && <div className="py-20 text-center font-bold text-gray-600 animate-pulse text-sm">Fetching Ledger...</div>}

      {ledgerData && (
        <div className="w-full max-w-[1000px] mx-auto bg-white border border-gray-300 p-10 shadow-2xl font-serif print:shadow-none print:border-none print:p-0 text-black">
          
          {/* Classic Letterhead Header */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-normal tracking-wide border-b border-dashed border-black inline-block pb-1 mb-2 font-serif">Crown Eve</h1>
            <h3 className="text-xl font-normal mb-1">Branch Terminal Operations</h3>
            <p className="text-sm font-medium">System Generated Double-Entry Ledger</p>
            <div className="w-full border-b border-black border-dashed mt-4 mb-4"></div>
            
            <h2 className="text-xl font-normal underline decoration-1 underline-offset-4 mb-2">Account Ledger</h2>
            
            <div className="text-sm font-bold mb-4">
              From: {submittedSearch.startDate ? formatDate(submittedSearch.startDate) : 'Start'} 
              <span className="mx-2">To:</span> 
              {submittedSearch.endDate ? formatDate(submittedSearch.endDate) : formatDate(new Date())}
            </div>

            <div className="border border-black rounded py-2 px-4 inline-block">
              <span className="text-lg font-bold uppercase">{ledgerData.accountName} [{ledgerData.nature}]</span>
            </div>
          </div>

          {/* Strict Tabular Ledger */}
          <div className="w-full">
            <table className="w-full text-left border-collapse border border-black text-sm">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="border-r border-black px-2 py-1 font-bold underline decoration-1 underline-offset-2 w-[80px]">Date</th>
                  <th className="border-r border-black px-2 py-1 font-bold underline decoration-1 underline-offset-2 w-[130px]">Type</th>
                  <th className="border-r border-black px-2 py-1 font-bold underline decoration-1 underline-offset-2 w-[50px]">V #</th>
                  <th className="border-r border-black px-2 py-1 font-bold underline decoration-1 underline-offset-2 w-[50px]">Ref#</th>
                  <th className="border-r border-black px-2 py-1 font-bold underline decoration-1 underline-offset-2">Description</th>
                  <th className="border-r border-black px-2 py-1 font-bold underline decoration-1 underline-offset-2 text-right w-[100px]">Debit</th>
                  <th className="border-r border-black px-2 py-1 font-bold underline decoration-1 underline-offset-2 text-right w-[100px]">Credit</th>
                  <th className="px-2 py-1 font-bold underline decoration-1 underline-offset-2 text-right w-[120px]">Balance</th>
                </tr>
              </thead>
              <tbody>
                
                {/* Opening Balance Line */}
                <tr>
                  <td className="border-r border-black px-2 py-1 font-medium">{submittedSearch.startDate ? formatDate(submittedSearch.startDate) : '-'}</td>
                  <td className="border-r border-black px-2 py-1 font-medium">Opening Bala</td>
                  <td className="border-r border-black px-2 py-1 font-medium"></td>
                  <td className="border-r border-black px-2 py-1 font-medium"></td>
                  <td className="border-r border-black px-2 py-1 font-medium text-right pr-10">Opening Balance :</td>
                  <td className="border-r border-black px-2 py-1 font-medium text-right">0.00</td>
                  <td className="border-r border-black px-2 py-1 font-medium text-right">0.00</td>
                  <td className="px-2 py-1 font-medium text-right">{formatNumber(ledgerData.openingBalance)}{ledgerData.openingBalanceType}</td>
                </tr>

                {/* Transactions */}
                {ledgerData.entries.map((entry, index) => {
                  
                  // Simple parsing to extract V# if it exists in description/type
                  let type = entry.reference_type.replace('_VOUCHER', ' Voucher');
                  
                  let vNum = '-';
                  let refNum = '-';
                  let displayDesc = entry.description || '';

                  // Extract V#
                  const vMatch = displayDesc.match(/\[V#: (.*?)\]/);
                  if (vMatch) {
                    vNum = vMatch[1];
                    if (vNum.includes('-')) {
                      vNum = vNum.split('-')[1];
                    }
                    displayDesc = displayDesc.replace(vMatch[0], '').trim();
                  }

                  // Extract Ref#
                  const refMatch = displayDesc.match(/\(Ref: (.*?)\)/);
                  if (refMatch) {
                    refNum = refMatch[1];
                    displayDesc = displayDesc.replace(refMatch[0], '').trim();
                  }
                  
                  return (
                    <tr key={index} className="border-b border-black align-top">
                      <td className="border-r border-black px-2 py-1">{formatDate(entry.date)}</td>
                      <td className="border-r border-black px-2 py-1 capitalize">{type.toLowerCase()}</td>
                      <td className="border-r border-black px-2 py-1">{vNum}</td>
                      <td className="border-r border-black px-2 py-1">{refNum}</td>
                      <td className="border-r border-black px-2 py-1 whitespace-pre-wrap leading-tight text-[13px]">{displayDesc}</td>
                      <td className="border-r border-black px-2 py-1 text-right">{formatNumber(entry.debit)}</td>
                      <td className="border-r border-black px-2 py-1 text-right">{formatNumber(entry.credit)}</td>
                      <td className="px-2 py-1 text-right">{formatNumber(entry.balance)}{entry.balanceType}</td>
                    </tr>
                  )
                })}
                
                {ledgerData.entries.length === 0 && (
                  <tr className="border-b border-black">
                    <td colSpan="8" className="py-8 text-center text-gray-500 font-medium">
                      No transactions recorded.
                    </td>
                  </tr>
                )}

              </tbody>

              {/* Strict Tabular Footer Totals */}
              <tfoot>
                <tr className="border-t-2 border-b-2 border-black">
                  <td colSpan="5" className="border-r border-black px-2 py-2 text-right uppercase font-bold">
                    Total & Closing Balance:
                  </td>
                  <td className="border-r border-black px-2 py-2 text-right font-normal">
                    {formatNumber(ledgerData.totalDebit)}
                  </td>
                  <td className="border-r border-black px-2 py-2 text-right font-normal">
                    {formatNumber(ledgerData.totalCredit)}
                  </td>
                  <td className="px-2 py-2 text-right font-bold text-base">
                    {formatNumber(ledgerData.closingBalance)}{ledgerData.closingBalanceType}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          
        </div>
      )}

    </div>
  );
};

export default AccountLedger;
