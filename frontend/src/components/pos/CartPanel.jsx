// frontend/src/components/pos/CartPanel.jsx
import React from 'react';
import { ShoppingCart, Package, CheckCircle } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import CartItem from './CartItem';

const CartPanel = ({ cart, onUpdateQty, onRemove, onCheckout, isProcessing }) => {
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  return (
    <div className="w-[400px] bg-slate-900 border border-slate-800 rounded-[3rem] flex flex-col overflow-hidden shadow-2xl h-full">
      <header className="p-8 border-b border-slate-800 bg-slate-950/30">
         <h3 className="text-2xl font-black flex items-center italic">
            <ShoppingCart className="mr-3 text-blue-500" /> CART
         </h3>
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
        <AnimatePresence>
          {cart.map(item => (
            <CartItem 
              key={item.id} 
              item={item} 
              onUpdateQty={onUpdateQty} 
              onRemove={onRemove} 
            />
          ))}
        </AnimatePresence>
        {cart.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-700 space-y-4 opacity-40">
             <Package size={64} strokeWidth={1} />
             <p className="font-black uppercase tracking-widest text-xs">Ready for entry</p>
          </div>
        )}
      </div>

      <footer className="p-8 bg-slate-950/80 backdrop-blur-md border-t border-slate-800 space-y-6">
         <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
               <span>Subtotal</span>
               <span className="text-orange-600">${subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
               <span>Tax (8%)</span>
               <span className="text-orange-600">${tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-2xl font-black italic text-orange-600 pt-4 mt-2 border-t border-slate-800/50">
               <span>TOTAL</span>
               <span className="text-blue-500">${total.toLocaleString()}</span>
            </div>
         </div>

         <button 
          disabled={cart.length === 0 || isProcessing}
          onClick={() => onCheckout(total)}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 py-6 rounded-2xl font-black text-xl flex items-center justify-center space-x-3 transition-all shadow-xl shadow-blue-900/20 active:scale-95"
         >
            {isProcessing ? 'PROCESSING...' : (
              <>
                <CheckCircle size={24} />
                <span>COMPLETE SALE</span>
              </>
            )}
         </button>
      </footer>
    </div>
  );
};

export default CartPanel;
