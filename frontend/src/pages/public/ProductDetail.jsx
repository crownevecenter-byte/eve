// frontend/src/pages/public/ProductDetail.jsx
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { ShoppingCart, ArrowLeft, Package, CheckCircle, Info, Shield } from 'lucide-react';
import CardSkeleton from '../../components/skeletons/CardSkeleton';

const ProductDetail = () => {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => api.get(`/products/${id}`).then(r => r.data),
  });

  if (isLoading) return <div className="max-w-6xl mx-auto p-10"><CardSkeleton /></div>;
  if (!product) return <div>Product not found</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      <Link to="/shop" className="inline-flex items-center text-slate-400 hover:text-orange-600 transition-all">
        <ArrowLeft size={20} className="mr-2" /> Back to Catalog
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Gallery */}
        <div className="space-y-6">
          <div className="aspect-square rounded-[3rem] overflow-hidden bg-slate-900 border border-slate-800">
            <img 
              src="https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=1000" 
              alt={product.name} 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-square rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden cursor-pointer hover:border-blue-500 transition-all">
                <img src={`https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=200&sig=${i}`} alt="thumbnail" className="w-full h-full object-cover opacity-50" />
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-10">
          <header className="space-y-4">
            <h1 className="text-5xl font-black italic tracking-tighter">{product.name}</h1>
            <div className="flex items-center space-x-4">
              <span className="text-3xl font-black text-emerald-400">${product.price.toLocaleString()}</span>
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/20">IN STOCK</span>
            </div>
            <p className="text-slate-400 text-lg leading-relaxed">
              Experience the pinnacle of cycling engineering. {product.name} is meticulously assembled at our {product.branch?.name} branch, using aerospace-grade parts for unmatched durability and performance.
            </p>
          </header>

          {/* Parts Breakdown */}
          <section className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 space-y-6">
            <h3 className="text-xl font-bold flex items-center">
              <Package size={20} className="mr-2 text-blue-400" /> Component Breakdown
            </h3>
            <div className="space-y-4">
              {product.parts?.map((p, i) => (
                <div key={i} className="flex justify-between items-center py-3 border-b border-slate-800 last:border-0">
                  <div>
                    <p className="font-bold">{p.part.name}</p>
                    <p className="text-xs text-slate-500">{p.part.category}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-slate-400 text-sm">Qty: {p.quantity}</span>
                    <CheckCircle size={16} className="text-emerald-500" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="flex space-x-4">
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-2xl px-4">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:text-blue-400">-</button>
              <span className="w-12 text-center font-bold text-xl">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="p-2 hover:text-blue-400">+</button>
            </div>
            <button className="flex-1 bg-blue-600 hover:bg-blue-500 text-orange-600 py-5 rounded-2xl font-black text-xl shadow-2xl shadow-blue-500/20 transition-all flex items-center justify-center">
              ADD TO CART <ShoppingCart size={24} className="ml-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center text-sm text-slate-500 bg-slate-950 p-4 rounded-2xl">
              <Info size={16} className="mr-2" /> Professional Assembly included
            </div>
            <div className="flex items-center text-sm text-slate-500 bg-slate-950 p-4 rounded-2xl">
              <Shield size={16} className="mr-2" /> Lifetime Warranty
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
