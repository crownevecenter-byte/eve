// frontend/src/pages/dashboards/customer/Cart.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../../context/CartContext";
import { getImgUrl } from "../../../utils/imgUrl";
import CatalogProductImage from "../../../components/catalog/CatalogProductImage";
import CustomerPageHeader from "../../../components/customer/CustomerPageHeader";

const Cart = () => {
  const navigate = useNavigate();
  const { items, removeItem, updateQty, total } = useCart();
  const [selectedItems, setSelectedItems] = useState(items.map(i => i.id));

  const isAllSelected = selectedItems.length === items.length && items.length > 0;

  const toggleSelectAll = () => {
    if (isAllSelected) setSelectedItems([]);
    else setSelectedItems(items.map(i => i.id));
  };

  const toggleItem = (id) => {
    if (selectedItems.includes(id)) setSelectedItems(selectedItems.filter(i => i !== id));
    else setSelectedItems([...selectedItems, id]);
  };



  const selectedTotal = items
    .filter(i => selectedItems.includes(i.id))
    .reduce((acc, i) => acc + (i.sale_price || i.price) * i.qty, 0);

  const removeSelected = () => {
    selectedItems.forEach((id) => removeItem(id));
    setSelectedItems([]);
  };

  return (
    <div className="cart-page-ultra ce-cart-page ce-page">
      <div className="cart-page-container">
        <CustomerPageHeader
          eyebrow="Your order"
          title="Shopping Bag"
          subtitle={
            items.length === 0
              ? "Review items before checkout"
              : `${items.length} item${items.length === 1 ? "" : "s"} ready for checkout`
          }
          actions={
            <button type="button" className="ce-cart-back-btn" onClick={() => navigate("/my/shop")}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Continue Shopping
            </button>
          }
        />

        <div className="cart-main-grid">
          <div className="cart-list-section">
            {items.length > 0 ? (
              <>
                {/* GLOBAL ACTIONS BAR */}
                <div className="cart-top-actions">
                  <label className="premium-checkbox-label">
                    <input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} />
                    <span className="checkbox-ui"></span>
                    <span className="checkbox-text">Select All Items</span>
                  </label>
                  <button
                    type="button"
                    className="bulk-delete-btn"
                    disabled={selectedItems.length === 0}
                    onClick={removeSelected}
                  >
                    Remove selected{selectedItems.length > 0 ? ` (${selectedItems.length})` : ""}
                  </button>
                </div>

                {/* ITEMS LIST */}
                <div className="cart-items-wrapper">
                  {items.map((item) => {
                    const mainImg = item.images?.find((img) => img.is_primary)?.url || item.images?.[0]?.url;
                    const unitPrice = Number(item.sale_price || item.price);
                    const lineTotal = unitPrice * item.qty;
                    return (
                      <div key={item.id} className="cart-item-card-ultra">
                        <div className="item-selection">
                          <label className="premium-checkbox-label">
                            <input type="checkbox" checked={selectedItems.includes(item.id)} onChange={() => toggleItem(item.id)} />
                            <span className="checkbox-ui"></span>
                          </label>
                        </div>
                        
                        <div className="item-visual-box">
                          {mainImg ? (
                            <CatalogProductImage
                              src={getImgUrl(mainImg)}
                              alt={item.name}
                              className="cart-item-img"
                            />
                          ) : (
                            <div className="item-fallback-icon">📦</div>
                          )}
                        </div>

                        <div className="item-core-info">
                          <div className="item-brand">CROWN EVE OFFICIAL</div>
                          <h3 className="item-display-name">{item.name}</h3>
                          <p className="item-spec-text">{item.category?.name || 'GENUINE PART'} · BRANCH STOCK</p>
                          
                          <div className="item-mobile-price">
                            <span className="item-price-label">Line total</span>
                            <span>Rs. {lineTotal.toLocaleString()}</span>
                          </div>

                          <div className="item-footer-tools">
                            <button className="tool-link-btn" onClick={() => removeItem(item.id)}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                              Remove
                            </button>
                            <button className="tool-link-btn">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78v0z"/></svg>
                              Wishlist
                            </button>
                          </div>
                        </div>

                        <div className="item-quantity-section">
                          <div className="stepper-ui">
                            <button className="stepper-btn" onClick={() => updateQty(item.id, item.qty - 1)} disabled={item.qty <= 1}>−</button>
                            <input className="stepper-input" type="text" value={item.qty} readOnly />
                            <button className="stepper-btn" onClick={() => updateQty(item.id, item.qty + 1)}>+</button>
                          </div>
                        </div>

                        <div className="item-total-section">
                          <div className="item-price-col">
                            <span className="item-price-label">Line total</span>
                            <span className="price-tag-now">Rs. {lineTotal.toLocaleString()}</span>
                            <span className="item-unit-price">
                              Rs. {unitPrice.toLocaleString()} each
                            </span>
                            {item.sale_price && item.price !== item.sale_price && (
                              <span className="price-tag-old">Rs. {Number(item.price).toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="empty-bag-view">
                <div className="empty-bag-icon">👜</div>
                <h2>Your Bag is Empty</h2>
                <p>Looks like you haven't added anything to your cart yet. Start exploring our premium collection.</p>
                <button className="btn-shop-now" onClick={() => navigate("/my/shop")}>Shop Collection</button>
              </div>
            )}
          </div>

          <div className="cart-summary-section">
            <div className="summary-card-ultra">
              <h2 className="summary-heading">Order Summary</h2>
              
              <div className="summary-table">
                <div className="summary-row-item">
                  <span className="summary-label-txt">Subtotal ({selectedItems.length} items)</span>
                  <span className="summary-value-txt">Rs. {selectedTotal.toLocaleString()}</span>
                </div>
                <div className="summary-row-item">
                  <span className="summary-label-txt">Estimated Shipping</span>
                  <span className="summary-value-txt highlight-green">FREE</span>
                </div>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-total-block">
                <div className="total-main-row">
                  <span className="total-label-ultra">Total</span>
                  <span className="total-value-ultra">Rs. {selectedTotal.toLocaleString()}</span>
                </div>
                <p className="summary-tax-note">Taxes and shipping calculated at checkout</p>
              </div>

              <button 
                className="checkout-btn-ultra" 
                disabled={selectedItems.length === 0}
                onClick={() => navigate("/my/checkout", { state: { selectedItems } })}
              >
                PROCEED TO CHECKOUT
              </button>

              <div className="cart-security-footer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span>SECURE CHECKOUT GUARANTEED</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
