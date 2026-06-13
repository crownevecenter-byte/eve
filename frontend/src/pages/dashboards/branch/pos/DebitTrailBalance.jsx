// pos/DebitTrailBalance.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../../services/api';
import { FileText, Download, Calendar, Filter } from 'lucide-react';
import SearchInput from '../../../../components/SearchInput';

const DebitTrailBalance = ({ user }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: trialBalanceData, isLoading, refetch } = useQuery({
    queryKey: ['trial-balance', user?.branchId, startDate, endDate],
    queryFn: () => api.get('/accounts/trial-balance', {
      params: { branchId: user?.branchId, startDate, endDate }
    }).then(r => r.data),
    enabled: !!user?.branchId
  });

  const report = trialBalanceData?.report || [];
  const grandTotalDebit = trialBalanceData?.grandTotalDebit || 0;
  const grandTotalCredit = trialBalanceData?.grandTotalCredit || 0;

  const filteredReport = report.filter(row => 
    row.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6 w-full p-2 pb-10">
      <div className="w-full bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden flex flex-col font-sans">
        
        {/* Professional Header */}
        <div className="bg-gradient-to-r from-[#2C3E50] to-[#34495E] px-8 py-5 flex justify-between items-center shadow-inner print:hidden">
          <div>
            <span className="text-[10px] font-black text-blue-100/80 uppercase tracking-widest">Financial Report</span>
            <h1 className="text-white text-2xl font-black italic tracking-wide drop-shadow-md flex items-center gap-2 mt-0.5">
              <FileText size={24} className="text-blue-100" /> Detailed Trial Balance
            </h1>
          </div>
          <button 
            onClick={handlePrint}
            className="bg-white/10 hover:bg-white/20 border border-white/20 px-6 py-2.5 rounded-xl text-xs font-black text-white uppercase tracking-widest transition-all flex items-center gap-2"
          >
            <Download size={16} /> Print Report
          </button>
        </div>

        {/* Filters Section */}
        <div className="p-6 border-b border-[#E5E7EB] bg-[#F9FAFB] flex flex-wrap gap-4 items-end print:hidden">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-black text-[#8D7A71] uppercase tracking-widest mb-1.5">Search Account</label>
            <SearchInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              label="Search by name or category..."
            />
          </div>
          <div className="w-40">
            <label className="block text-[10px] font-black text-[#8D7A71] uppercase tracking-widest mb-1.5">Start Date</label>
            <input 
              type="date" 
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-bold text-[#2D1A12] shadow-sm focus:outline-none"
            />
          </div>
          <div className="w-40">
            <label className="block text-[10px] font-black text-[#8D7A71] uppercase tracking-widest mb-1.5">End Date</label>
            <input 
              type="date" 
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-bold text-[#2D1A12] shadow-sm focus:outline-none"
            />
          </div>
          <button 
            onClick={() => refetch()}
            className="px-6 py-2.5 bg-[#2C3E50] hover:bg-[#1A252F] text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-sm h-[42px] flex items-center gap-2"
          >
            <Filter size={16} /> Apply Filters
          </button>
        </div>

        {/* Printable Header */}
        <div className="hidden print:block p-8 text-center border-b border-gray-200">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-wider">Detailed Trial Balance</h2>
          <p className="text-sm font-bold text-gray-500 mt-1 uppercase">
            Period: {startDate ? new Date(startDate).toLocaleDateString() : 'Beginning'} - {endDate ? new Date(endDate).toLocaleDateString() : 'Present'}
          </p>
        </div>

        {/* Report Table */}
        <div className="overflow-x-auto p-6 print:p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-[#2C3E50] print:border-gray-800">
                <th className="py-4 px-4 text-[11px] font-black text-[#2C3E50] uppercase tracking-widest w-1/3">Account Name</th>
                <th className="py-4 px-4 text-[11px] font-black text-[#2C3E50] uppercase tracking-widest w-1/6">Type</th>
                <th className="py-4 px-4 text-[11px] font-black text-[#2C3E50] uppercase tracking-widest text-right w-1/4">Debit (Dr)</th>
                <th className="py-4 px-4 text-[11px] font-black text-[#2C3E50] uppercase tracking-widest text-right w-1/4">Credit (Cr)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-sm font-bold text-gray-400 uppercase tracking-widest">
                    Loading Report...
                  </td>
                </tr>
              ) : filteredReport.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-sm font-bold text-gray-400 uppercase tracking-widest">
                    No Accounts Found
                  </td>
                </tr>
              ) : (
                filteredReport.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="text-sm font-black text-[#2D1A12]">{row.accountName}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-gray-100 text-gray-600 uppercase tracking-widest">
                        {row.categoryName}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-sm font-black text-emerald-700">
                        {row.closingDebit > 0 ? row.closingDebit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-sm font-black text-red-700">
                        {row.closingCredit > 0 ? row.closingCredit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Totals Row */}
            <tfoot className="border-t-2 border-[#2C3E50] print:border-gray-800 bg-gray-50 print:bg-transparent">
              <tr>
                <td colSpan="2" className="py-4 px-4 text-right text-xs font-black text-[#2C3E50] uppercase tracking-widest">
                  Grand Totals:
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="text-lg font-black text-emerald-800">
                    {grandTotalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="text-lg font-black text-red-800">
                    {grandTotalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </td>
              </tr>
              {Math.abs(grandTotalDebit - grandTotalCredit) > 0.01 && !isLoading && (
                <tr>
                  <td colSpan="4" className="py-3 px-4 text-center bg-red-50">
                    <span className="text-xs font-black text-red-600 uppercase tracking-widest">
                      Warning: Trial Balance is not balanced. Difference: {Math.abs(grandTotalDebit - grandTotalCredit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                </tr>
              )}
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DebitTrailBalance;
