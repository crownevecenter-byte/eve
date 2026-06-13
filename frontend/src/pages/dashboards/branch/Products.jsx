// frontend/src/pages/dashboards/branch/Products.jsx
import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useFetch, apiFetch, toast, Icon, Modal, Confirm, UPLOAD_BASE } from "../../../components/branch/BranchShared";
import { getImgUrl } from "../../../utils/imgUrl";
import { uploadImage } from "../../../utils/uploadMedia";
import SearchInput from "../../../components/SearchInput";
import FilterRadioGroup from "../../../components/FilterRadioGroup";

const Products = () => {
  const { user } = useOutletContext();
  const branchId = user?.branchId;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("bikes");

  const activeProductType = activeTab === "bikes" ? "bike" : activeTab === "parts" ? "part" : "";
  const params = `branchId=${branchId}&limit=100&page=${page}${search ? `&search=${search}` : ""}${activeProductType ? `&product_type=${activeProductType}` : ""}`;
  const { data: pageInit, loading, refetch } = useFetch(`/products/page-init?${params}`, [branchId, page, search, activeProductType]);
  const data = pageInit?.products;
  const catsData = pageInit?.categories;
  const brandsData = pageInit?.brands;
  const refetchCats = refetch;
  const refetchBrands = refetch;


  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [brandEditTarget, setBrandEditTarget] = useState(null);

  const initialForm = {
    name: "", product_type: "bike", description: "", price: "", sale_price: "", stock_qty: 0,
    categoryId: "", brandId: "", is_active: true, images: [{ url: "", is_primary: true, sort_order: 0 }],
    bikeDetail: {
      motor_type: "",
      motor_watt_min: "",
      motor_watt_max: "",
      battery_voltage: "",
      battery_capacity_ah: "",
      battery_type: "",
      speed_min_kmh: "",
      speed_max_kmh: "",
      range_eco_min_km: "",
      range_eco_max_km: "",
      speed_modes: "",
      charger: "",
      charging_time_min_hrs: "",
      charging_time_max_hrs: "",
      net_weight_kg: "",
      loading_capacity_kg: "",
      security: "",
      braking_system: "",
      color_options: [],
      frame_material: "",
      wheel_size: "",
      warranty: ""
    },
    partDetail: {
      serial_no: "",
      item_code: "",
      model: "",
      description: "",
      cp_price: "",
      compatible_models: [],
      compatible_bike_ids: [],
      unit: "piece"
    }
  };
  const [form, setForm] = useState(initialForm);

  const [catForm, setCatForm] = useState({ name: "", parent_id: "", description: "" });
  const [brandForm, setBrandForm] = useState({ name: "", country: "", city: "", contact: "", logo_url: "" });

  const openAdd = () => { setForm(initialForm); setEditTarget(null); setShowModal(true); };
  const openEdit = p => {
    setForm({
      name: p.name || "", product_type: p.product_type || "bike", description: p.description || "",
      price: p.price ?? "", sale_price: p.sale_price ?? "", stock_qty: p.stock_qty ?? 0,
      categoryId: p.categoryId || "", brandId: p.brandId || "", is_active: p.is_active ?? true,
      images: p.images?.length ? p.images : [{ url: "", is_primary: true, sort_order: 0 }],
      bikeDetail: Object.keys(initialForm.bikeDetail).reduce((acc, key) => ({ ...acc, [key]: p.bikeDetail?.[key] ?? initialForm.bikeDetail[key] }), {}),
      partDetail: Object.keys(initialForm.partDetail).reduce((acc, key) => ({ ...acc, [key]: p.partDetail?.[key] ?? initialForm.partDetail[key] }), {})
    });
    setEditTarget(p);
    setShowModal(true);
  };

  const submit = async () => {
    if (!form.name || !form.price) return toast("Name and price required", "e");
    setSaving(true);
    try {
      const body = {
        ...form,
        branchId: Number(branchId),
        price: parseFloat(form.price),
        sale_price: form.sale_price ? parseFloat(form.sale_price) : null,
        stock_qty: parseInt(form.stock_qty) || 0,
        categoryId: form.categoryId || null, // UUIDs are strings
        brandId: form.brandId || null // UUIDs are strings
      };

      if (editTarget) {
        await apiFetch(`/products/${editTarget.id}`, { method: "PUT", body });
        toast("Product updated");
      } else {
        await apiFetch("/products", { method: "POST", body });
        toast("Product created");
      }
      setShowModal(false);
      refetch();
    } catch (e) {
      toast(e.message, "e");
    }
    setSaving(false);
  };

  const saveCat = async () => {
    try { await apiFetch("/categories", { method: "POST", body: catForm }); toast("Category saved"); setCatForm({ name: "", parent_id: "", description: "" }); refetchCats(); }
    catch (e) { toast(e.message, "e"); }
  };

  const openAddBrand = () => { setBrandForm({ name: "", country: "", city: "", contact: "", logo_url: "" }); setBrandEditTarget(null); setShowBrandModal(true); };
  const openEditBrand = b => { setBrandForm({ name: b.name, country: b.country || "", city: b.city || "", contact: b.contact || "", logo_url: b.logo_url || "" }); setBrandEditTarget(b); setShowBrandModal(true); };

  const saveBrand = async () => {
    if (!brandForm.name) return toast("Supplier name required", "e");
    setSaving(true);
    try {
      if (brandEditTarget) { await apiFetch(`/brands/${brandEditTarget.id}`, { method: "PUT", body: brandForm }); toast("Supplier updated"); }
      else { await apiFetch("/brands", { method: "POST", body: brandForm }); toast("Supplier saved"); }
      setShowBrandModal(false); refetchBrands();
    } catch (e) { toast(e.message, "e"); }
    setSaving(false);
  };

  const remove = async id => {
    try { await apiFetch(`/products/${id}`, { method: "DELETE" }); toast("Product deleted"); refetch(); }
    catch (e) { toast(e.message, "e"); }
    setConfirmId(null);
  };

  return (
    <div className="branch-page">
      <div className="ph">
        <div className="ph-l">
          <div className="eyebrow">Catalog</div>
          <div className="ptitle">MASTER INVENTORY</div>
          <div className="psub">Full control over bikes, spare parts, and supplier relationships.</div>
        </div>
        <div className="ph-r" style={{ display: "flex", gap: 8 }}>
        </div>
      </div>

      {/* Mobile filter dropdown */}
      <div className="mobile-filter">
        <select value={activeTab} onChange={(e) => setActiveTab(e.target.value)}>
          <option value="bikes">Bikes List</option>
          <option value="parts">Spare Parts List</option>
          <option value="categories">Categories List</option>
          <option value="suppliers">Suppliers List</option>
        </select>
      </div>

      <div className="desktop-tabs" style={{ marginBottom: 30 }}>
      <FilterRadioGroup
        name="products-tab"
        value={activeTab}
        onChange={setActiveTab}
        compact
        wrap
        options={[
          { value: "bikes", label: "Bikes" },
          { value: "parts", label: "Parts" },
          { value: "categories", label: "Categories" },
          { value: "suppliers", label: "Suppliers" },
        ]}
      />
      </div>

      <div className="tab-content">
        {(activeTab === "bikes" || activeTab === "parts") && (
          <div className="p-fbar">
            <div style={{ fontWeight: 700, fontSize: 18 }}>
              {activeTab === "bikes" ? "Bikes Catalog" : "Spare Parts Catalog"}
            </div>
            <SearchInput
              style={{ flex: 1, maxWidth: 400 }}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              label="Search products by name..."
            />
            <button className="btn btn-p" onClick={openAdd}>
              <Icon n="plus" /> {activeTab === "bikes" ? "Add New Bike" : "Add New Part"}
            </button>
          </div>
        )}
        {(activeTab === "bikes" || activeTab === "parts") && loading && (
          <div className="g4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="sk" style={{ height: 200, borderRadius: 20 }} />)}
          </div>
        )}

        {(activeTab === "bikes" || activeTab === "parts") && !loading && (
          <div className="tab-pane">
            <div className="g4">
              {(data?.data || []).map(p => (
                <div key={p.id} className="card ci" style={{ transition: "all .2s" }}>
                  <div style={{ position: "relative", height: 160, borderRadius: 12, background: "var(--surf)", marginBottom: 14, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {p.images?.find(img => img.is_primary)?.url ? (
                      <img
                        src={getImgUrl(p.images.find(img => img.is_primary).url)}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                      />
                    ) : <Icon n={p.product_type === "bike" ? "bike" : "settings"} size={40} opacity={0.2} />}
                    <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 4 }}>
                      <button className="btn-ico" onClick={() => openEdit(p)}><Icon n="edit" size={12} /></button>
                      <button className="btn-ico dng" onClick={() => setConfirmId(p.id)}><Icon n="trash" size={12} /></button>
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, marginBottom: 4, textTransform: "uppercase", fontSize: 13 }}>{p.name}</div>
                  <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>
                      {p.brand?.name}
                      {p.brand?.name && p.category?.name ? " · " : ""}
                      {p.category?.name}
                    </span>
                    <span style={{ fontWeight: 600, color: p.stock_qty > 0 ? "#4facfe" : "#ff4d4d" }}>
                      QTY: {p.stock_qty}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 8 }}>
                    <div style={{ fontSize: 11, color: "var(--acc)", fontWeight: 700, textTransform: "uppercase", flex: 1, paddingRight: 8 }}>
                      {p.partDetail?.model || p.bikeDetail?.motor_type || ""}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                      {p.sale_price && <div style={{ fontSize: 11, color: "var(--muted)", textDecoration: "line-through", marginBottom: 2 }}>{p.price}</div>}
                      <div style={{ fontFamily: "var(--font-d)", fontSize: 20, color: "var(--acc)", lineHeight: 1 }}>PKR {parseFloat(p.sale_price || p.price).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ))}
              {(data?.data || []).length === 0 && <div className="empty" style={{ gridColumn: "1/-1" }}><Icon n="products" size={36} /><div className="empty-t">No products yet</div></div>}
            </div>

            {data?.meta && data.meta.totalPages > 1 && (
              <div style={{ marginTop: 30, display: "flex", justifyContent: "center", gap: 10, paddingBottom: 20 }}>
                <button className="btn btn-s" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                  <Icon n="arrow-left" size={14} /> Previous
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: 15, fontSize: 13, fontWeight: 700, color: "var(--muted)" }}>
                  Page <span style={{ color: "var(--acc)" }}>{page}</span> of {data.meta.totalPages}
                </div>
                <button className="btn btn-s" disabled={page === data.meta.totalPages} onClick={() => setPage(p => Math.min(data.meta.totalPages, p + 1))}>
                  Next <Icon n="arrow-right" size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "categories" && (
          <div className="card" style={{ overflow: "hidden" }}>
            <div className="ci" style={{ background: "var(--surf2)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 700, fontSize: 18 }}>Categories Architecture</div>
            </div>
            <div className="ci" style={{ display: "flex", gap: 10, flexWrap: "wrap", background: "rgba(255,255,255,0.02)" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ fontSize: 10, color: "var(--muted)", marginBottom: 4, display: "block" }}>CATEGORY NAME</label>
                <input placeholder="e.g. Electric Spares" value={catForm.name} onChange={e => setCatForm(c => ({ ...c, name: e.target.value }))} />
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ fontSize: 10, color: "var(--muted)", marginBottom: 4, display: "block" }}>PARENT CATEGORY</label>
                <select value={catForm.parent_id} onChange={e => setCatForm(c => ({ ...c, parent_id: e.target.value }))}>
                  <option value="">— Top Level —</option>
                  {catsData?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <button className="btn btn-p" onClick={saveCat} style={{ height: 40 }}><Icon n="plus" /> Add Category</button>
              </div>
            </div>
            <div className="tw">
              <table>
                <thead>
                  <tr>
                    <th>Category Name</th>
                    <th>Parent Architecture</th>
                    <th>Description</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {catsData?.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td>{c.parent?.name ? <span className="badge badge-blue">{c.parent.name}</span> : <span style={{ color: "var(--muted)" }}>Root Node</span>}</td>
                      <td style={{ color: "var(--muted)", fontSize: 12 }}>{c.description || "System default category"}</td>
                      <td className="tda">
                        <button className="btn-ico dng" onClick={async () => { await apiFetch(`/categories/${c.id}`, { method: "DELETE" }); refetchCats(); }}><Icon n="trash" size={12} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "suppliers" && (
          <div className="card" style={{ overflow: "hidden" }}>
            <div className="ci" style={{ background: "var(--surf2)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 700, fontSize: 18 }}>Supplier Partners</div>
              <button className="btn btn-p btn-sm" onClick={openAddBrand}>
                <Icon n="plus" /> Add New Supplier
              </button>
            </div>
            <div className="tw">
              <table>
                <thead>
                  <tr>
                    <th>Supplier Identity</th>
                    <th>Location / City</th>
                    <th>Contact Info</th>
                    <th>Origin</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {brandsData?.map(b => (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 700 }}>{b.name}</td>
                      <td>{b.city || <span style={{ opacity: 0.3 }}>—</span>}</td>
                      <td style={{ fontSize: 12, fontWeight: 600 }}>{b.contact || <span style={{ opacity: 0.3 }}>—</span>}</td>
                      <td>{b.country || "International"}</td>
                      <td className="tda">
                        <button className="btn-ico" onClick={() => openEditBrand(b)}><Icon n="edit" size={12} /></button>
                        <button className="btn-ico dng" onClick={async () => { if (confirm("Delete this supplier?")) { await apiFetch(`/brands/${b.id}`, { method: "DELETE" }); refetchBrands(); } }}><Icon n="trash" size={12} /></button>
                      </td>
                    </tr>
                  ))}
                  {(!brandsData || brandsData.length === 0) && (
                    <tr><td colSpan="5" style={{ textAlign: "center", padding: 40, opacity: 0.5 }}>No suppliers registered yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Main Product Modal */}
      {showModal && (
        <Modal title={editTarget ? "EDIT PRODUCT" : "NEW PRODUCT"} onClose={() => setShowModal(false)} wide
          footer={<>
            <button className="btn btn-s btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-p btn-sm" onClick={submit} disabled={saving}>{saving ? "Saving…" : "Save Product"}</button>
          </>}
        >
          <div className="fr">
            <div className="fg" style={{ flex: 2 }}><label>Name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="fg"><label>Type</label>
              <select value={form.product_type} onChange={e => setForm(f => ({ ...f, product_type: e.target.value }))}>
                <option value="bike">Electric Bike</option>
                <option value="part">Spare Part</option>
              </select>
            </div>
          </div>

          <div className="fr">
            <div className="fg"><label>Price (PKR) *</label><input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></div>
            <div className="fg"><label>Sale Price</label><input type="number" value={form.sale_price} onChange={e => setForm(f => ({ ...f, sale_price: e.target.value }))} /></div>
            <div className="fg"><label>Stock Qty</label><input type="number" value={form.stock_qty} onChange={e => setForm(f => ({ ...f, stock_qty: e.target.value }))} /></div>
          </div>

          <div className="fr">
            <div className="fg"><label>Category</label>
              <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                <option value="">— Select Category —</option>
                {catsData?.map(c => <option key={c.id} value={c.id}>{c.parent?.name ? `${c.parent.name} > ` : ""}{c.name}</option>)}
              </select>
            </div>
            <div className="fg"><label>Supplier</label>
              <select value={form.brandId} onChange={e => setForm(f => ({ ...f, brandId: e.target.value }))}>
                <option value="">— Select Supplier —</option>
                {brandsData?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>

          <div className="fg"><label>Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ height: 60 }} /></div>

          {/* Technical Specs Header */}
          <div style={{ marginTop: 20, marginBottom: 15, padding: "8px 12px", background: "rgba(14,165,233,.05)", borderRadius: 8, borderLeft: "4px solid var(--acc)", fontWeight: 700, fontSize: 13 }}>TECHNICAL SPECIFICATIONS</div>

          {form.product_type === "bike" ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px" }}>
              <div className="fg"><label>Motor Type</label><input placeholder="e.g. Multi Mode Motor" value={form.bikeDetail.motor_type} onChange={e => setForm(f => ({ ...f, bikeDetail: { ...f.bikeDetail, motor_type: e.target.value } }))} /></div>
              <div className="fg"><label>Motor Watt (Min/Max)</label>
                <div style={{ display: "flex", gap: 5 }}>
                  <input type="number" placeholder="Min" value={form.bikeDetail.motor_watt_min} onChange={e => setForm(f => ({ ...f, bikeDetail: { ...f.bikeDetail, motor_watt_min: e.target.value } }))} />
                  <input type="number" placeholder="Max" value={form.bikeDetail.motor_watt_max} onChange={e => setForm(f => ({ ...f, bikeDetail: { ...f.bikeDetail, motor_watt_max: e.target.value } }))} />
                </div>
              </div>
              <div className="fg"><label>Battery (V / Ah)</label>
                <div style={{ display: "flex", gap: 5 }}>
                  <input type="number" step="0.1" placeholder="Volts" value={form.bikeDetail.battery_voltage} onChange={e => setForm(f => ({ ...f, bikeDetail: { ...f.bikeDetail, battery_voltage: e.target.value } }))} />
                  <input type="number" step="0.1" placeholder="Amp-Hours" value={form.bikeDetail.battery_capacity_ah} onChange={e => setForm(f => ({ ...f, bikeDetail: { ...f.bikeDetail, battery_capacity_ah: e.target.value } }))} />
                </div>
              </div>
              <div className="fg"><label>Battery Type</label><input placeholder="e.g. Lithium LFP" value={form.bikeDetail.battery_type} onChange={e => setForm(f => ({ ...f, bikeDetail: { ...f.bikeDetail, battery_type: e.target.value } }))} /></div>
              <div className="fg"><label>Speed (Min/Max km/h)</label>
                <div style={{ display: "flex", gap: 5 }}>
                  <input type="number" step="0.1" placeholder="Min" value={form.bikeDetail.speed_min_kmh} onChange={e => setForm(f => ({ ...f, bikeDetail: { ...f.bikeDetail, speed_min_kmh: e.target.value } }))} />
                  <input type="number" step="0.1" placeholder="Max" value={form.bikeDetail.speed_max_kmh} onChange={e => setForm(f => ({ ...f, bikeDetail: { ...f.bikeDetail, speed_max_kmh: e.target.value } }))} />
                </div>
              </div>
              <div className="fg"><label>Range Eco (Min/Max km)</label>
                <div style={{ display: "flex", gap: 5 }}>
                  <input type="number" placeholder="Min" value={form.bikeDetail.range_eco_min_km} onChange={e => setForm(f => ({ ...f, bikeDetail: { ...f.bikeDetail, range_eco_min_km: e.target.value } }))} />
                  <input type="number" placeholder="Max" value={form.bikeDetail.range_eco_max_km} onChange={e => setForm(f => ({ ...f, bikeDetail: { ...f.bikeDetail, range_eco_max_km: e.target.value } }))} />
                </div>
              </div>
              <div className="fg"><label>Speed Modes</label><input type="number" value={form.bikeDetail.speed_modes} onChange={e => setForm(f => ({ ...f, bikeDetail: { ...f.bikeDetail, speed_modes: e.target.value } }))} /></div>
              <div className="fg"><label>Charger</label><input placeholder="e.g. 72V10A" value={form.bikeDetail.charger} onChange={e => setForm(f => ({ ...f, bikeDetail: { ...f.bikeDetail, charger: e.target.value } }))} /></div>
              <div className="fg"><label>Charging Time (Min/Max hrs)</label>
                <div style={{ display: "flex", gap: 5 }}>
                  <input type="number" step="0.1" placeholder="Min" value={form.bikeDetail.charging_time_min_hrs} onChange={e => setForm(f => ({ ...f, bikeDetail: { ...f.bikeDetail, charging_time_min_hrs: e.target.value } }))} />
                  <input type="number" step="0.1" placeholder="Max" value={form.bikeDetail.charging_time_max_hrs} onChange={e => setForm(f => ({ ...f, bikeDetail: { ...f.bikeDetail, charging_time_max_hrs: e.target.value } }))} />
                </div>
              </div>
              <div className="fg"><label>Weight / Capacity (kg)</label>
                <div style={{ display: "flex", gap: 5 }}>
                  <input type="number" placeholder="Net Weight" value={form.bikeDetail.net_weight_kg} onChange={e => setForm(f => ({ ...f, bikeDetail: { ...f.bikeDetail, net_weight_kg: e.target.value } }))} />
                  <input type="number" placeholder="Load Capacity" value={form.bikeDetail.loading_capacity_kg} onChange={e => setForm(f => ({ ...f, bikeDetail: { ...f.bikeDetail, loading_capacity_kg: e.target.value } }))} />
                </div>
              </div>
              <div className="fg"><label>Security</label><input placeholder="e.g. NFC Unlock" value={form.bikeDetail.security} onChange={e => setForm(f => ({ ...f, bikeDetail: { ...f.bikeDetail, security: e.target.value } }))} /></div>
              <div className="fg"><label>Braking System</label><input placeholder="e.g. F/R CBS" value={form.bikeDetail.braking_system} onChange={e => setForm(f => ({ ...f, bikeDetail: { ...f.bikeDetail, braking_system: e.target.value } }))} /></div>
              <div className="fg"><label>Frame Material</label><input value={form.bikeDetail.frame_material} onChange={e => setForm(f => ({ ...f, bikeDetail: { ...f.bikeDetail, frame_material: e.target.value } }))} /></div>
              <div className="fg"><label>Wheel Size</label><input value={form.bikeDetail.wheel_size} onChange={e => setForm(f => ({ ...f, bikeDetail: { ...f.bikeDetail, wheel_size: e.target.value } }))} /></div>
              <div className="fg"><label>Warranty</label><input value={form.bikeDetail.warranty} onChange={e => setForm(f => ({ ...f, bikeDetail: { ...f.bikeDetail, warranty: e.target.value } }))} /></div>
              <div className="fg" style={{ gridColumn: "1 / -1" }}>
                <label>Color Options</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                  {(form.bikeDetail.color_options || []).map((c, i) => (
                    <div key={i} style={{ background: "var(--acc)", color: "#fff", padding: "4px 10px", borderRadius: 20, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                      {c}
                      <button onClick={() => setForm(f => ({ ...f, bikeDetail: { ...f.bikeDetail, color_options: f.bikeDetail.color_options.filter((_, j) => j !== i) } }))} style={{ border: "none", background: "none", color: "#fff", cursor: "pointer", padding: 0, display: "flex" }}><Icon n="close" size={10} /></button>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input id="new-color" placeholder="e.g. Metallic Black" onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const val = e.target.value.trim();
                      if (val) {
                        setForm(f => ({ ...f, bikeDetail: { ...f.bikeDetail, color_options: [...(f.bikeDetail.color_options || []), val] } }));
                        e.target.value = "";
                      }
                    }
                  }} />
                  <button className="btn btn-s btn-sm" onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById("new-color");
                    const val = el.value.trim();
                    if (val) {
                      setForm(f => ({ ...f, bikeDetail: { ...f.bikeDetail, color_options: [...(f.bikeDetail.color_options || []), val] } }));
                      el.value = "";
                    }
                  }}>Add</button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px" }}>
              <div className="fg"><label>Serial No (S/O)</label><input type="number" value={form.partDetail.serial_no} onChange={e => setForm(f => ({ ...f, partDetail: { ...f.partDetail, serial_no: e.target.value } }))} /></div>
              <div className="fg"><label>Item Code</label><input placeholder="e.g. SK-0104-FR" value={form.partDetail.item_code} onChange={e => setForm(f => ({ ...f, partDetail: { ...f.partDetail, item_code: e.target.value } }))} /></div>
              <div className="fg"><label>Model</label><input placeholder="e.g. SPARK RD" value={form.partDetail.model} onChange={e => setForm(f => ({ ...f, partDetail: { ...f.partDetail, model: e.target.value } }))} /></div>
              <div className="fg"><label>Cost Price (CP)</label><input type="number" step="0.01" value={form.partDetail.cp_price} onChange={e => setForm(f => ({ ...f, partDetail: { ...f.partDetail, cp_price: e.target.value } }))} /></div>
              <div className="fg"><label>Unit</label><input placeholder="piece, set, pair" value={form.partDetail.unit} onChange={e => setForm(f => ({ ...f, partDetail: { ...f.partDetail, unit: e.target.value } }))} /></div>
              <div className="fg"><label>Technical Description</label><textarea value={form.partDetail.description} onChange={e => setForm(f => ({ ...f, partDetail: { ...f.partDetail, description: e.target.value } }))} style={{ height: 40 }} /></div>

              <div className="fg" style={{ gridColumn: "1 / -1" }}>
                <label>Compatible Models (Text)</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                  {(form.partDetail.compatible_models || []).map((m, i) => (
                    <div key={i} style={{ background: "rgba(0,0,0,0.03)", border: "1px solid var(--border)", padding: "4px 10px", borderRadius: 20, fontSize: 11, display: "flex", alignItems: "center", gap: 6 }}>
                      {m}
                      <button onClick={() => setForm(f => ({ ...f, partDetail: { ...f.partDetail, compatible_models: f.partDetail.compatible_models.filter((_, j) => j !== i) } }))} style={{ border: "none", background: "none", color: "var(--muted)", cursor: "pointer", padding: 0, display: "flex" }}><Icon n="close" size={10} /></button>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input id="new-model" placeholder="Type model name and press Enter" onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const val = e.target.value.trim();
                      if (val) {
                        setForm(f => ({ ...f, partDetail: { ...f.partDetail, compatible_models: [...(f.partDetail.compatible_models || []), val] } }));
                        e.target.value = "";
                      }
                    }
                  }} />
                </div>
              </div>

              <div className="fg" style={{ gridColumn: "1 / -1" }}>
                <label>Linked Bikes (for Filtering)</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                  {(form.partDetail.compatible_bike_ids || []).map((id, i) => {
                    const bike = (data?.data || []).find(p => p.id === id);
                    return (
                      <div key={i} style={{ background: "rgba(14,165,233,0.1)", border: "1px solid var(--acc)", color: "var(--acc)", padding: "4px 10px", borderRadius: 20, fontSize: 11, display: "flex", alignItems: "center", gap: 6 }}>
                        {bike?.name || id}
                        <button onClick={() => setForm(f => ({ ...f, partDetail: { ...f.partDetail, compatible_bike_ids: f.partDetail.compatible_bike_ids.filter((_, j) => j !== i) } }))} style={{ border: "none", background: "none", color: "var(--acc)", cursor: "pointer", padding: 0, display: "flex" }}><Icon n="close" size={10} /></button>
                      </div>
                    );
                  })}
                </div>
                <select onChange={e => {
                  const id = e.target.value;
                  if (id && !form.partDetail.compatible_bike_ids.includes(id)) {
                    setForm(f => ({ ...f, partDetail: { ...f.partDetail, compatible_bike_ids: [...f.partDetail.compatible_bike_ids, id] } }));
                  }
                  e.target.value = "";
                }}>
                  <option value="">— Link to a Bike —</option>
                  {(data?.data || []).filter(p => p.product_type === 'bike').map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div style={{ marginTop: 20, marginBottom: 10, fontWeight: 700, fontSize: 13 }}>PRODUCT IMAGES</div>
          {form.images.map((img, i) => (
            <div key={i} className="card ci" style={{ marginBottom: 12, background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", gap: 15, padding: 12 }}>
              <div style={{ width: 60, height: 60, borderRadius: 8, background: "var(--surf)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border)" }}>
                {img.url ? <img src={getImgUrl(img.url)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Icon n="image" opacity={0.2} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button className="btn btn-s btn-sm" style={{ position: "relative", overflow: "hidden" }}>
                    <Icon n="upload" size={12} /> {img.url ? "Change Image" : "Upload Image"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        try {
                          const { url } = await uploadImage(file);
                          setForm(f => ({ ...f, images: f.images.map((im, j) => j === i ? { ...im, url } : im) }));
                          toast("Image uploaded to Cloudflare");
                        } catch (err) { toast(err.message || "Upload failed", "e"); }
                      }}
                    />
                  </button>
                  {img.url && <div style={{ fontSize: 10, color: "var(--green)", fontWeight: 700 }}>UPLOADED</div>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <label style={{ fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontWeight: 700 }}>
                  <input type="radio" checked={img.is_primary} onChange={() => setForm(f => ({ ...f, images: f.images.map((im, j) => ({ ...im, is_primary: j === i })) }))} /> MAIN
                </label>
                <button className="btn-ico dng" onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}><Icon n="trash" size={13} /></button>
              </div>
            </div>
          ))}
          <button className="btn btn-s btn-sm w-full" onClick={() => setForm(f => ({ ...f, images: [...f.images, { url: "", is_primary: false, sort_order: f.images.length }] }))}><Icon n="plus" /> Add More Image Slots</button>
        </Modal>
      )}


      {confirmId && <Confirm msg="Delete this product?" onYes={() => remove(confirmId)} onNo={() => setConfirmId(null)} />}

      {/* Supplier Modal */}
      {showBrandModal && (
        <Modal title={brandEditTarget ? "EDIT SUPPLIER" : "NEW SUPPLIER"} onClose={() => setShowBrandModal(false)}
          footer={<>
            <button className="btn btn-s btn-sm" onClick={() => setShowBrandModal(false)}>Cancel</button>
            <button className="btn btn-p btn-sm" onClick={saveBrand} disabled={saving}>{saving ? "Saving…" : "Save Supplier"}</button>
          </>}
        >
          <div className="fg" style={{ marginBottom: 15 }}>
            <label>Supplier Name *</label>
            <input placeholder="e.g. Crown EV" value={brandForm.name} onChange={e => setBrandForm(b => ({ ...b, name: e.target.value }))} />
          </div>
          <div className="fr">
            <div className="fg">
              <label>City</label>
              <input placeholder="e.g. Karachi" value={brandForm.city} onChange={e => setBrandForm(b => ({ ...b, city: e.target.value }))} />
            </div>
            <div className="fg">
              <label>Origin Country</label>
              <input placeholder="e.g. Pakistan" value={brandForm.country} onChange={e => setBrandForm(b => ({ ...b, country: e.target.value }))} />
            </div>
          </div>
          <div className="fg" style={{ marginTop: 15 }}>
            <label>Contact Info (Phone/Email)</label>
            <input placeholder="+92 300 0000000" value={brandForm.contact} onChange={e => setBrandForm(b => ({ ...b, contact: e.target.value }))} />
          </div>
        </Modal>
      )}

    </div>
  );
};

export default Products;
