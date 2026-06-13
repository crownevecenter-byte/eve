// frontend/src/components/ui/DataTable.jsx
import React from 'react';
import TableSkeleton from '../skeletons/TableSkeleton';

const DataTable = ({ columns, data, isLoading, meta, onPageChange }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
      {isLoading ? <TableSkeleton rows={meta?.limit || 5} /> : (
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-950/50 border-b border-slate-800">
              {columns.map((col, idx) => (
                <th key={idx} className={`px-8 py-6 text-[10px] uppercase tracking-widest font-black text-slate-500 ${col.align === 'right' ? 'text-right' : ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {data?.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-white/5 transition-all group">
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className={`px-8 py-5 ${col.align === 'right' ? 'text-right' : ''}`}>
                    {col.render ? col.render(row) : <span className="text-sm font-medium">{row[col.accessor]}</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {meta && (
        <div className="p-6 bg-slate-950/50 flex justify-between items-center border-t border-slate-800">
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
            Showing {data?.length || 0} of {meta.total} records
          </p>
          <div className="flex space-x-2">
            <button 
              disabled={meta.page === 1}
              onClick={() => onPageChange(meta.page - 1)}
              className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl disabled:opacity-30 font-bold text-xs hover:border-slate-600 transition-all"
            >
              PREV
            </button>
            <button 
              disabled={meta.page >= meta.totalPages}
              onClick={() => onPageChange(meta.page + 1)}
              className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl disabled:opacity-30 font-bold text-xs hover:border-slate-600 transition-all"
            >
              NEXT
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
