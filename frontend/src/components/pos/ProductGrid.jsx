// frontend/src/components/pos/ProductGrid.jsx
import React from 'react';
import { Plus } from 'lucide-react';

const ProductGrid = ({ products, isLoading, onAdd }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-48 bg-slate-900 animate-pulse rounded-[2rem]" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 xl:grid-cols-3 gap-6">
      {products?.map(p => (
        <button 
          key={p.id}
          onClick={() => onAdd(p)}
          className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] text-left hover:border-blue-500 transition-all group active:scale-95 shadow-lg"
        >
          <div className="aspect-video bg-slate-950 rounded-xl mb-4 overflow-hidden">
             <img 
               src="https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=200" 
               className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" 
               alt={p.name}
             />
          </div>
          <h4 className="font-bold truncate text-sm">{p.name}</h4>
          <div className="flex justify-between items-center mt-4">
             <p className="text-xl font-black italic text-emerald-400">${p.price.toLocaleString()}</p>
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/40">
                <Plus size={16} />
             </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default ProductGrid;
