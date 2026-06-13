import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import '../../styles/customer.css';

const Cart = () => {
  const navigate = useNavigate();
  const { items, updateQty, removeItem, total } = useCart();
  const { user } = useAuth();

  React.useEffect(() => {
    if (user && user.role === 'CUSTOMER') {
      navigate('/my/cart');
    }
  }, [user, navigate]);

  return (
    <div id="customer-dashboard-shell">
      <div className="main-wrap">
        <div className="page-wrap">
          <div className="pg-hd" style={{ paddingTop: '40px' }}>
            <div>
              <h1 style={{ fontSize: '48px', letterSpacing: '-1px' }}>Your Cart</h1>
              <p style={{ fontSize: '14px', color: 'var(--muted2)' }}>{items.length} items currently in your selection.</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate("/shop")}>
              Go Back to Shop
            </button>
          </div>

          <div className="g64">
            <div className="card">
              <div className="ch">
                <div className="ct">Items Overview</div>
              </div>
              {items.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted2)' }}>Your cart is empty.</div>
              ) : (
                items.map(item => (
                  <div key={item.id} className="ci" style={{ padding: '20px 0' }}>
                    <div className="ci-img" style={{ width: '80px', height: '80px', fontSize: '32px' }}>{item.emoji || "📦"}</div>
                    <div style={{ flex: 1 }}>
                      <div className="ci-name" style={{ fontSize: '18px', fontWeight: 700 }}>{item.name}</div>
                      <div className="ci-sub" style={{ fontSize: '13px', marginTop: '4px' }}>Unit Price: PKR {item.price?.toLocaleString()}</div>
                    </div>
                    <div className="qty-ctrl">
                      <button className="qty-btn" onClick={() => updateQty(item.id, item.qty - 1)}>-</button>
                      <span className="qty-num">{item.qty}</span>
                      <button className="qty-btn" onClick={() => updateQty(item.id, item.qty + 1)}>+</button>
                    </div>
                    <div style={{ minWidth: 140, textAlign: "right" }}>
                      <div className="mono" style={{ fontWeight: 700, color: "var(--orange)", fontSize: '16px' }}>
                        PKR {((item.price || 0) * item.qty).toLocaleString()}
                      </div>
                      <button className="ca" onClick={() => removeItem(item.id)} style={{ fontSize: '10px', color: "var(--red)", marginTop: '4px' }}>Remove Item</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div>
              <div className="card" style={{ position: "sticky", top: "100px" }}>
                <div className="ch">
                  <div className="ct">Order Summary</div>
                </div>
                <div className="trow">
                  <span style={{ fontSize: 14, color: "var(--muted2)" }}>Subtotal</span>
                  <span className="mono" style={{ fontWeight: 600, fontSize: '15px' }}>PKR {(total || 0).toLocaleString()}</span>
                </div>
                <div className="trow">
                  <span style={{ fontSize: 14, color: "var(--muted2)" }}>Shipping</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--green)", textTransform: 'uppercase' }}>Calculated at checkout</span>
                </div>
                <div className="divider" style={{ margin: '20px 0' }} />
                <div className="trow" style={{ padding: "10px 0" }}>
                  <span style={{ fontSize: 16, fontWeight: 700 }}>Estimated Total</span>
                  <span className="mono" style={{ fontSize: '28px', fontWeight: 700, color: "var(--orange)" }}>
                    PKR {(total || 0).toLocaleString()}
                  </span>
                </div>
                <button 
                  className="btn btn-primary" 
                  style={{ width: "100%", marginTop: 24, height: 52, fontSize: '14px', borderRadius: '6px' }} 
                  onClick={() => navigate("/checkout")}
                >
                  PROCEED TO CHECKOUT
                </button>
                
                <div style={{ marginTop: 24, padding: '16px', background: 'var(--black3)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, opacity: 0.8 }}>
                    <span style={{ fontSize: 20 }}>Secure</span>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: '1px' }}>Secure Payment</div>
                      <div style={{ fontSize: 11, color: 'var(--muted2)' }}>SSL Encrypted Checkout</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
