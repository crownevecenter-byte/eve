// frontend/src/pages/dashboards/customer/Checkout.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../../context/CartContext";
import api from "../../../services/api";
import { uploadImage } from "../../../utils/uploadMedia";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, total, clearCart } = useCart();
  const [step, setStep] = useState(1);
  const [addr, setAddr] = useState({ name: "", phone: "", address: "", city: "" });
  const [branchId, setBranchId] = useState("");
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [error, setError] = useState("");

  // Split Logic States
  const [isSplit, setIsSplit] = useState(false);
  const [orderSplit, setOrderSplit] = useState({}); // branchId -> items[]
  
  // Payment States
  const [branchBanks, setBranchBanks] = useState({}); // branchId -> banks[]
  const [paymentData, setPaymentData] = useState({}); // branchId -> { transaction_id, payment_screenshot }
  const [uploadingProof, setUploadingProof] = useState({}); // branchId -> boolean

  const grandTotal = total;

  useEffect(() => {
    if (items.length > 0) {
      const slugs = items.map(i => i.slug).filter(Boolean).join(',');
      if (slugs) {
        api.get(`/branches/available?slugs=${slugs}`).then(r => {
          const d = r?.data ?? [];
          setBranches(Array.isArray(d) ? d : []);
        }).catch(() => {});
      } else {
        api.get("/branches").then(r => {
          const d = r?.data?.data ?? r?.data;
          setBranches(Array.isArray(d) ? d : []);
        }).catch(() => {});
      }
    }
  }, [items]);

  useEffect(() => {
    if (items.length > 0 && branches.length > 0) {
      const fullBranch = branches.find(b => b.availability?.isFull);
      if (fullBranch) {
        setIsSplit(false);
        setBranchId(fullBranch.id);
        setOrderSplit({ [fullBranch.id]: items });
      } else {
        const split = {};
        items.forEach(item => {
          const firstAvailable = branches.find(b => b.availability?.availableSlugs?.includes(item.slug));
          if (firstAvailable) {
            if (!split[firstAvailable.id]) split[firstAvailable.id] = [];
            split[firstAvailable.id].push(item);
          }
        });
        const bIds = Object.keys(split);
        if (bIds.length > 0) {
          setIsSplit(bIds.length > 1);
          setOrderSplit(split);
          if (!isSplit) setBranchId(bIds[0]);
        }
      }
    }
  }, [items, branches]);

  // Fetch banks when moving to payment step
  useEffect(() => {
    if (step === 3) {
      const bIds = isSplit ? Object.keys(orderSplit) : [branchId];
      bIds.forEach(id => {
        if (!branchBanks[id]) {
          api.get(`/branches/${id}/banks`).then(r => {
            setBranchBanks(prev => ({ ...prev, [id]: r.data }));
          }).catch(() => {});
        }
      });
    }
  }, [step, branchId, isSplit, orderSplit]);

  const handleFileUpload = async (bId, file, inputEl) => {
    if (!file) return;
    setError("");
    setUploadingProof((prev) => ({ ...prev, [bId]: true }));
    try {
      const { url } = await uploadImage(file);
      setPaymentData((prev) => ({
        ...prev,
        [bId]: { ...prev[bId], payment_screenshot: url },
      }));
    } catch (e) {
      setError(e.message || "Image upload failed. Please try again.");
      setPaymentData((prev) => ({
        ...prev,
        [bId]: { ...prev[bId], payment_screenshot: "" },
      }));
    } finally {
      setUploadingProof((prev) => ({ ...prev, [bId]: false }));
      if (inputEl) inputEl.value = "";
    }
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    setError("");
    try {
      const bIds = isSplit ? Object.keys(orderSplit) : [branchId];
      const results = [];
      for (const id of bIds) {
        const bItems = orderSplit[id];
        const p = paymentData[id] || {};
        const payload = {
          branchId: Number(id),
          total: bItems.reduce((acc, i) => acc + (i.sale_price || i.price) * i.qty, 0),
          type: "ONLINE",
          payment_method: "BANK_TRANSFER",
          payment_status: "PENDING",
          transaction_id: p.transaction_id,
          payment_screenshot: p.payment_screenshot,
          customer_name: addr.name,
          customer_phone: addr.phone,
          notes: `Delivery Address: ${addr.address}, ${addr.city}`,
          items: bItems.map(i => ({ productId: i.id, quantity: i.qty, price: i.price }))
        };
        const res = await api.post("/orders", payload);
        results.push(res.data);
      }
      clearCart();
      setPlacedOrder(results[0]);
    } catch (e) {
      setError(e.response?.data?.message || "Order failed.");
    } finally {
      setLoading(false);
    }
  };

  const renderPaymentStep = () => {
    const bIds = isSplit ? Object.keys(orderSplit) : [branchId];
    const anyUploading = bIds.some((id) => uploadingProof[id]);
    return (
      <div className="card">
        <div className="ch"><div className="ct">Payment Details</div></div>
        <p style={{ fontSize: 13, color: "var(--muted2)", marginBottom: 20 }}>Please transfer the total amount to the respective branch bank accounts below.</p>
        
        {bIds.map(id => {
          const branch = branches.find(b => b.id == id);
          const banks = branchBanks[id] || [];
          const p = paymentData[id] || {};
          
          return (
            <div key={id} style={{ marginBottom: 32, paddingBottom: 24, borderBottom: bIds.length > 1 ? "1px solid var(--border)" : "none" }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: "var(--orange)", marginBottom: 12, textTransform: "uppercase" }}>
                {branch?.name} - {isSplit ? `PKR ${orderSplit[id].reduce((acc, i) => acc + (i.sale_price || i.price) * i.qty, 0).toLocaleString()}` : ""}
              </div>
              
              {banks.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12, marginBottom: 20 }}>
                  {banks.map(bank => (
                    <div key={bank.id} style={{ background: "var(--black3)", border: "1px solid var(--border)", borderRadius: 12, padding: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{bank.name}</div>
                      <div style={{ fontSize: 13, fontFamily: "'JetBrains Mono',monospace", margin: "4px 0", color: "var(--white)" }}>{bank.account_number}</div>
                      <div style={{ fontSize: 11, color: "var(--muted2)" }}>{bank.account_title}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: "var(--muted2)", background: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 8, marginBottom: 16 }}>Loading bank accounts...</div>
              )}
              
              <div className="fgrid">
                <div className="fg">
                  <label style={{ display: "flex", justifyContent: "space-between" }}>
                    Transaction ID / Reference
                    <span style={{ color: "var(--red)", fontSize: 10, fontWeight: 800 }}>REQUIRED</span>
                  </label>
                  <input 
                    className="fi" 
                    placeholder="Enter transaction ID" 
                    value={p.transaction_id || ""} 
                    style={{ border: !p.transaction_id ? "1px solid rgba(239,68,68,0.3)" : "" }}
                    onChange={e => setPaymentData(prev => ({ ...prev, [id]: { ...prev[id], transaction_id: e.target.value } }))} 
                  />
                </div>
                <div className="fg">
                  <label style={{ display: "flex", justifyContent: "space-between" }}>
                    Payment Proof (Screenshot)
                    <span style={{ color: "var(--red)", fontSize: 10, fontWeight: 800 }}>REQUIRED</span>
                  </label>
                  {uploadingProof[id] ? (
                    <div className="ce-upload-status" role="status" aria-live="polite">
                      <span className="ce-upload-spinner" aria-hidden="true" />
                      <span>Uploading screenshot, please wait…</span>
                    </div>
                  ) : (
                    <div className="ce-upload-proof-row">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        style={{ display: "none" }}
                        id={`file-${id}`}
                        disabled={uploadingProof[id]}
                        onChange={(e) => handleFileUpload(id, e.target.files[0], e.target)}
                      />
                      <label
                        htmlFor={`file-${id}`}
                        className="btn btn-ghost ce-upload-proof-btn"
                        style={{
                          border: !p.payment_screenshot ? "1px solid rgba(239,68,68,0.3)" : "1px solid var(--border)",
                        }}
                      >
                        {p.payment_screenshot ? "Change Screenshot" : "Upload Screenshot"}
                      </label>
                      {p.payment_screenshot && (
                        <span className="ce-upload-done">✓ Uploaded successfully</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <button className="btn btn-ghost" onClick={() => setStep(2)}>← Back</button>
          <button
            className="btn btn-primary"
            disabled={
              anyUploading ||
              bIds.some((id) => !paymentData[id]?.transaction_id || !paymentData[id]?.payment_screenshot)
            }
            onClick={() => setStep(4)}
          >
            {anyUploading ? "Please wait for upload…" : "Review Order & Pay →"}
          </button>
        </div>
      </div>
    );
  };

  const renderBranchStep = () => {
    if (branches.length === 0) return (
      <div className="empty-state" style={{ padding: 40 }}>
        <p style={{ fontSize: 13, color: "var(--muted2)" }}>No branch has these items in stock.</p>
        <button className="btn btn-ghost" onClick={() => navigate("/my/shop")}>Back to Shop</button>
      </div>
    );
    if (isSplit) return (
      <div className="card" style={{ border: "1px solid #eab308" }}>
        <div className="ch"><div className="ct" style={{ color: "#eab308" }}>⚠️ Multi-Branch Fulfillment</div></div>
        <div style={{ background: "rgba(234,179,8,0.05)", padding: 16, borderRadius: 12, marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: "var(--white2)", lineHeight: 1.6 }}>Items are at different branches. <strong>{Object.keys(orderSplit).length} separate orders</strong> will be created.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {Object.entries(orderSplit).map(([bId, bItems]) => (
            <div key={bId} style={{ background: "var(--black3)", border: "1px solid var(--border)", borderRadius: 12, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                <span>{branches.find(b => b.id == bId)?.name}</span>
                <span style={{ color: "var(--orange)", fontSize: 12 }}>{bItems.length} Items</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {bItems.map(i => <span key={i.id} style={{ fontSize: 10, background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: 4 }}>{i.name}</span>)}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}><button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button><button className="btn btn-primary" onClick={() => setStep(3)}>Continue →</button></div>
      </div>
    );
    return (
      <div className="card">
        <div className="ch"><div className="ct">Select Branch</div></div>
        <p style={{ fontSize: 13, color: "var(--muted2)", marginBottom: 16 }}>Choose branch for fulfillment.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {branches.map(b => (
            <div key={b.id} onClick={() => { if(b.availability?.isFull) setBranchId(b.id); }} style={{ padding: "16px", border: `1px solid ${branchId == b.id ? "var(--orange)" : "var(--border)"}`, borderRadius: 12, cursor: b.availability?.isFull ? "pointer" : "not-allowed", background: branchId == b.id ? "rgba(255,77,0,0.05)" : "var(--black3)", opacity: b.availability?.isFull ? 1 : 0.6, transition: "all 0.2s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div><div style={{ fontWeight: 700, fontSize: 15 }}>{b.name}</div><div style={{ fontSize: 12, color: "var(--muted2)", marginTop: 2 }}>{b.city}</div></div>
                {b.availability?.isFull ? <div style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", fontSize: 10, fontWeight: 800, padding: "4px 8px", borderRadius: 4, textTransform: "uppercase" }}>Available</div> : <div style={{ background: "rgba(239,68,68,0.05)", color: "var(--muted2)", fontSize: 10, fontWeight: 800, padding: "4px 8px", borderRadius: 4, textTransform: "uppercase" }}>Incomplete</div>}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}><button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button><button className="btn btn-primary" disabled={!branchId} onClick={() => setStep(3)}>Continue →</button></div>
      </div>
    );
  };

  if (!items.length && !placedOrder) return (
    <div className="ce-checkout-page ce-page">
      <div className="ce-empty">
        <h3>Your cart is empty</h3>
        <p className="ce-muted">Add items from the shop to continue checkout.</p>
        <button type="button" className="btn btn-primary" onClick={() => navigate("/my/shop")}>Start Shopping</button>
      </div>
    </div>
  );

  if (placedOrder) return (
    <div className="ce-checkout-page ce-page ce-checkout-success">
      <div className="ce-checkout-success-icon">✓</div>
      <h1 className="ce-checkout-success-title">Order <span>Placed!</span></h1>
      <p className="ce-muted">Wait for branch manager to confirm payment.</p>
      <p className="ce-checkout-order-id">#{placedOrder.id}</p>
      <div className="ce-checkout-success-actions">
        <button type="button" className="btn btn-ghost" onClick={() => navigate("/my/orders")}>My Orders</button>
        <button type="button" className="btn btn-primary" onClick={() => navigate("/my/shop")}>Shop More</button>
      </div>
    </div>
  );

  return (
    <div className="ce-checkout-page ce-page">
      <div className="customer-page-header">
        <div className="customer-page-header-main">
          <h1>Checkout</h1>
          <p>Step {step} of 4</p>
        </div>
      </div>
      <div className="step-bar" style={{ marginBottom: 28 }}>
        {[{ n: 1, l: "Address" }, { n: 2, l: "Branch" }, { n: 3, l: "Payment" }, { n: 4, l: "Confirm" }].map((s, i) => (
          <div key={s.n} style={{ display: "flex", alignItems: "center", flex: i < 3 ? 1 : 0 }}>
            <div className={`step ${step === s.n ? "on" : step > s.n ? "done" : ""}`}><div className="step-num">{step > s.n ? "✓" : s.n}</div>{s.l}</div>
            {i < 3 && <div className="step-conn" />}
          </div>
        ))}
      </div>

      <div className="g64" style={{ alignItems: "start" }}>
        <div style={{ flex: 1 }}>
          {step === 1 && (
            <div className="card">
              <div className="ch"><div className="ct">Delivery Address</div></div>
              <div className="fgrid">
                <div className="fg"><label>Full Name</label><input className="fi" value={addr.name} onChange={e => setAddr(p => ({ ...p, name: e.target.value }))} placeholder="Your name" /></div>
                <div className="fg"><label>Phone</label><input className="fi" value={addr.phone} onChange={e => setAddr(p => ({ ...p, phone: e.target.value }))} placeholder="+92 300 0000000" /></div>
              </div>
              <div className="fg"><label>Street Address</label><input className="fi" value={addr.address} onChange={e => setAddr(p => ({ ...p, address: e.target.value }))} placeholder="Street, block, area" /></div>
              <div className="fg"><label>City</label><input className="fi" value={addr.city} onChange={e => setAddr(p => ({ ...p, city: e.target.value }))} placeholder="Enter your city" /></div>
              <button className="btn btn-primary" style={{ marginTop: 20 }} disabled={!addr.name || !addr.phone || !addr.city} onClick={() => setStep(2)}>Continue →</button>
            </div>
          )}

          {step === 2 && renderBranchStep()}
          {step === 3 && renderPaymentStep()}

          {step === 4 && (
            <div className="card">
              <div className="ch"><div className="ct">Final Confirmation</div></div>
              <div style={{ marginBottom: 16 }}>
                {Object.entries(orderSplit).map(([bId, bItems]) => (
                  <div key={bId} style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "var(--orange)", textTransform: "uppercase", marginBottom: 8 }}>Branch: {branches.find(b => b.id == bId)?.name}</div>
                    {bItems.map(i => (
                      <div key={i.id} className="trow" style={{ padding: "4px 0" }}><span style={{ fontSize: 13 }}>{i.name} × {i.qty}</span><span className="mono" style={{ fontSize: 13 }}>PKR {(i.price * i.qty).toLocaleString()}</span></div>
                    ))}
                    <div style={{ fontSize: 11, color: "var(--muted2)", marginTop: 6 }}>Tx ID: {paymentData[bId]?.transaction_id}</div>
                    <div className="divider" style={{ margin: "12px 0" }} />
                  </div>
                ))}
                <div className="trow" style={{ padding: "10px 0" }}><span style={{ fontWeight: 700 }}>Total Payable</span><span className="mono" style={{ fontSize: 24, fontWeight: 700, color: "var(--orange)" }}>PKR {grandTotal.toLocaleString()}</span></div>
              </div>
              <div style={{ background: "var(--black3)", border: "1px solid var(--border)", borderRadius: 6, padding: "12px 16px", marginBottom: 16, fontSize: 13 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Delivery to: {addr.name}</div>
                <div style={{ color: "var(--muted2)" }}>{addr.address}, {addr.city} · {addr.phone}</div>
              </div>
              {error && <div style={{ color: "var(--red)", fontSize: 12, marginBottom: 10 }}>{error}</div>}
              <div style={{ display: "flex", gap: 10 }}><button className="btn btn-ghost" onClick={() => setStep(3)}>← Back</button><button className="btn btn-primary" style={{ flex: 1 }} onClick={handlePlaceOrder} disabled={loading}>{loading ? "Processing..." : "Place Order & Pay →"}</button></div>
            </div>
          )}
        </div>

        <div className="card" style={{ position: "sticky", top: "calc(var(--nav) + 20px)", width: 340 }}>
          <div className="ch"><div className="ct">Order Summary</div></div>
          {items.map(i => (
            <div key={i.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px solid var(--border)" }}><span>{i.name} × {i.qty}</span><span className="mono">PKR {(i.price * i.qty).toLocaleString()}</span></div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontWeight: 700 }}><span>Grand Total</span><span style={{ color: "var(--orange)" }}>PKR {grandTotal.toLocaleString()}</span></div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
