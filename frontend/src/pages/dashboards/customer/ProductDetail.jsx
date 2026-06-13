// frontend/src/pages/dashboards/customer/ProductDetail.jsx
import React, { useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import publicApi from "../../../services/publicApi";
import { useCart } from "../../../context/CartContext";
import { getImgUrl } from "../../../utils/imgUrl";
import CatalogProductImage from "../../../components/catalog/CatalogProductImage";
import "./ProductDetail.css";
import { CustomerLoading } from "../../../components/customer/CustomerUI";

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addItem } = useCart();
  const isCustomerPortal = location.pathname.startsWith('/my/');
  const cartPath = isCustomerPortal ? '/my/cart' : '/cart';
  const shopPath = isCustomerPortal ? '/my/shop' : '/shop';

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => publicApi.get(`/products/${id}`).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(id),
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (isLoading) {
    return isCustomerPortal ? (
      <div className="ce-page"><CustomerLoading message="Loading product…" /></div>
    ) : (
      <div style={{ padding: 100, textAlign: "center", fontSize: 20 }}>Loading...</div>
    );
  }
  if (!product) {
    return isCustomerPortal ? (
      <div className="ce-page ce-empty">
        <h3>Product not found</h3>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate(shopPath)}>Back to Shop</button>
      </div>
    ) : (
      <div style={{ padding: 100, textAlign: "center" }}><h3>Product not found</h3><button onClick={() => navigate(shopPath)}>Back to Shop</button></div>
    );
  }

  const bike = product.bikeDetail || {};
  const mainImg = product.images?.find(img => img.is_primary)?.url || product.images?.[0]?.url;


  return (
    <div className={`product-detail-page${isCustomerPortal ? " ce-product-detail ce-page" : ""}`}>
      {/* TOP SECTION */}
      <div className="product-top-section">
        <div className="product-info-col">
          <h1 className="product-name-large">{product.name}</h1>

          <ul className="spec-bullets">
            {bike.speed_max_kmh && <li>Speed {bike.speed_min_kmh || 0}-{bike.speed_max_kmh} KM/hr</li>}
            {bike.range_eco_max_km && <li>Range {bike.range_eco_min_km || 0}-{bike.range_eco_max_km}KM</li>}
            {bike.battery_type && <li>Battery Type: {bike.battery_voltage}V {bike.battery_capacity_ah}AH {bike.battery_type}</li>}
            {bike.motor_type && <li>Electric Motor Power: {bike.motor_type}</li>}
            {bike.speed_modes && <li>{bike.speed_modes} Modes: Eco, Normal and Sports.</li>}
          </ul>

          <div className="price-options">
            <div className="price-item">
              <span className="price-label">{bike.battery_type || 'Standard'}:</span>
              Rs. {Number(product.price).toLocaleString()}
            </div>
            {product.sale_price && (
              <div className="price-item" style={{ color: '#9BB854', fontSize: '24px' }}>
                <span className="price-label">Sale:</span>
                Rs. {Number(product.sale_price).toLocaleString()}
              </div>
            )}
          </div>

          <div className="product-actions-row">
            <button className="add-to-cart-btn" onClick={() => addItem(product)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 01-8 0" />
              </svg>
              ADD TO CART
            </button>

            <button className="buy-now-btn" onClick={() => { addItem(product); navigate(cartPath); }}>
              BUY NOW
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>
        </div>

        <div className="product-image-col">
          <div className="detail-image-blob"></div>
          {mainImg ? (
            <CatalogProductImage
              src={getImgUrl(mainImg)}
              alt={product.name}
              className="detail-main-img"
            />
          ) : (
            <div className="placeholder-img">[ {product.name} ]</div>
          )}
        </div>
      </div>

      {/* TECHNICAL SPECIFICATIONS - Only for Bikes */}
      {product.product_type === 'bike' && (
        <section className="specs-section">
          <h2 className="section-heading-orange">TECHNICAL SPECIFICATIONS</h2>
          <div className="specs-icon-grid">
            <div className="spec-icon-card">
              <div className="spec-icon-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 16s0-2 1-3 3-1 3-1V9l2-2 2 2v3s2 0 3 1 1 3 1 3H5z" /><circle cx="8" cy="18" r="2" /><circle cx="16" cy="18" r="2" /></svg>
              </div>
              <div className="spec-icon-label">Lifespan</div>
              <div className="spec-icon-value">{bike.warranty ? bike.warranty.split(',')[0] : "Extended Durability"}</div>
            </div>
            <div className="spec-icon-card">
              <div className="spec-icon-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="7" width="16" height="10" rx="2" /><path d="M22 11v2" /></svg>
              </div>
              <div className="spec-icon-label">Battery</div>
              <div className="spec-icon-value">{bike.battery_type || "Standard Battery"}</div>
            </div>
            <div className="spec-icon-card">
              <div className="spec-icon-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 2L3 14h8l-2 8 8-12h-8l2-8z" /></svg>
              </div>
              <div className="spec-icon-label">Charging</div>
              <div className="spec-icon-value">{bike.charging_time_max_hrs || 0} Hours</div>
            </div>
            <div className="spec-icon-card">
              <div className="spec-icon-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" /><path d="M12 8V12L15 15" /><circle cx="12" cy="12" r="1" /></svg>
              </div>
              <div className="spec-icon-label">Colors</div>
              <div className="spec-icon-value">{bike.color_options && Array.isArray(bike.color_options) ? bike.color_options.join(', ') : "Available in Various Colors"}</div>
            </div>
            <div className="spec-icon-card">
              <div className="spec-icon-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
              </div>
              <div className="spec-icon-label">Range</div>
              <div className="spec-icon-value">{bike.range_eco_max_km || 0} KM</div>
            </div>
          </div>
        </section>
      )}

      {/* PERFORMANCE DETAILS - Only for Bikes */}
      {product.product_type === 'bike' && (
        <section className="performance-section">
          <div>
            <h2 className="section-heading-orange" style={{ border: 'none', marginBottom: 20 }}>Performance Details of {product.name}</h2>
            <p className="performance-text">
              {product.description || `Unlock the thrill of urban exploration with our high-powered electric scooter, engineered to elevate your ride. Cruise through city streets at exhilarating speeds of up to ${bike.speed_max_kmh || 60} KM/hr, enjoying the freedom to roam with a range of up to ${bike.range_eco_max_km || 90} KM on a single charge.`}
              <br /><br />
              Designed for the modern explorer, our electric scooter merges sleek aesthetics with dynamic functionality, setting a new standard for urban mobility.
            </p>
          </div>
          <div className="performance-table">
            <div className="perf-row">
              <span className="perf-label">Speed</span>
              <span className="perf-value">{bike.speed_min_kmh}-{bike.speed_max_kmh} Km/h</span>
            </div>
            <div className="perf-row">
              <span className="perf-label">Range</span>
              <span className="perf-value">{bike.range_eco_min_km}-{bike.range_eco_max_km} KM</span>
            </div>
            <div className="perf-row">
              <span className="perf-label">Battery Type</span>
              <span className="perf-value">{bike.battery_voltage}V {bike.battery_capacity_ah}AH {bike.battery_type}</span>
            </div>
            <div className="perf-row">
              <span className="perf-label">Electric Motor Power</span>
              <span className="perf-value">{bike.motor_type}</span>
            </div>
            <div className="perf-row">
              <span className="perf-label">Warranty Period</span>
              <span className="perf-value">{bike.warranty || "24 Months Battery & Controller"}</span>
            </div>
          </div>
        </section>
      )}

      {/* PART DESCRIPTION - Only for Spare Parts */}
      {product.product_type === 'part' && (
        <section className="performance-section">
          <div>
            <h2 className="section-heading-orange" style={{ border: 'none', marginBottom: 20 }}>Product Information</h2>
            <p className="performance-text">
              {product.description || "High-quality genuine spare part designed for durability and perfect fit."}
            </p>
          </div>
          <div className="performance-table">
            <div className="perf-row">
              <span className="perf-label">Item Code</span>
              <span className="perf-value">{product.partDetail?.item_code || 'N/A'}</span>
            </div>
            <div className="perf-row">
              <span className="perf-label">Category</span>
              <span className="perf-value">{product.category?.name || 'General Part'}</span>
            </div>
            <div className="perf-row">
              <span className="perf-label">Availability</span>
              <span className="perf-value">{product.stock_qty > 0 ? 'In Stock' : 'Out of Stock'}</span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetailPage;
