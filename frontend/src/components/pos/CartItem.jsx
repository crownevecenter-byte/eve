// frontend/src/components/pos/CartItem.jsx
import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

const CartItem = ({ item, onUpdateQty, onRemove }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl"
    >
      <div className="flex-1 min-w-0 mr-4">
        <p className="font-bold truncate text-sm">{item.name}</p>
        <p className="text-emerald-400 font-black text-xs">${(item.price * item.qty).toLocaleString()}</p>
      </div>
      <div className="flex items-center space-x-3">
        <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800">
           <button onClick={() => onUpdateQty(item.id, -1)} className="w-6 h-6 flex items-center justify-center hover:text-orange-600 text-slate-500 transition-colors"><Minus size={14} /></button>
           <span className="w-8 text-center text-xs font-black">{item.qty}</span>
           <button onClick={() => onUpdateQty(item.id, 1)} className="w-6 h-6 flex items-center justify-center hover:text-orange-600 text-slate-500 transition-colors"><Plus size={14} /></button>
        </div>
        <button onClick={() => onRemove(item.id)} className="text-red-900 hover:text-red-500 transition-colors p-1"><Trash2 size={16} /></button>
      </div>
    </motion.div>
  );
};

export default CartItem;
