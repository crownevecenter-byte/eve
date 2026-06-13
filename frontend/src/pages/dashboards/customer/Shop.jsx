// frontend/src/pages/dashboards/customer/Shop.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import publicApi from "../../../services/publicApi";
import { useCart } from "../../../context/CartContext";
import { useDebounce } from "../../../hooks/useDebounce";
import { getImgUrl } from "../../../utils/imgUrl";
import CustomerPageHeader from "../../../components/customer/CustomerPageHeader";
import { CustomerEmpty } from "../../../components/customer/CustomerUI";
import CatalogProductImage from "../../../components/catalog/CatalogProductImage";
import ProductGridSkeleton from "../../../components/catalog/ProductGridSkeleton";
import SearchInput from "../../../components/SearchInput";
import NeuCardMarquee from "../../../components/customer/NeuCardMarquee";
import FilterRadioGroup from "../../../components/FilterRadioGroup";
import "../../public/Shop.css";

const Shop = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addItem, count } = useCart();

  const [cat, setCat] = useState("All");
  const [type, setType] = useState("All");
  const [search, setSearch] = useState("");
  const [branchId, setBranchId] = useState("");
  const [sortBy, setSortBy] = useState("stock_desc");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 350);
  const cartPath = location.pathname.startsWith('/my/') ? '/my/cart' : '/cart';
  const productPath = (id) => (location.pathname.startsWith('/my/') ? `/my/product/${id}` : `/product/${id}`);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const typeParam = params.get("type");
    if (typeParam) {
      setType(typeParam);
      setPage(1);
    }
  }, [location.search]);

  const { data: branches = [] } = useQuery({
    queryKey: ["shop", "branches"],
    queryFn: () =>
      publicApi.get("/branches").then((r) => {
        const list = r.data?.data ?? r.data ?? [];
        return Array.isArray(list) ? list : [];
      }),
    staleTime: 10 * 60 * 1000,
  });

  const productParams = useMemo(() => {
    const [sort, order] = sortBy.split("_");
    return {
      branchId: branchId || undefined,
      categoryId: cat === "All" ? undefined : cat,
      product_type: type === "All" ? undefined : type,
      search: debouncedSearch || undefined,
      sortBy: sort,
      order: order || "desc",
      page,
      limit: 12,
      lite: "1",
    };
  }, [branchId, cat, type, debouncedSearch, sortBy, page]);

  const {
    data: productsResult,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["shop", "products", productParams],
    queryFn: () => publicApi.get("/products", { params: productParams }).then((r) => r.data),
    staleTime: 2 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  const products = useMemo(() => {
    const d = productsResult?.data ?? productsResult;
    return Array.isArray(d) ? d : [];
  }, [productsResult]);

  const totalPages = productsResult?.meta?.totalPages || 1;
  const totalItems = productsResult?.meta?.total || 0;
  const showLoading = isLoading && products.length === 0;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page, type, cat, branchId, debouncedSearch, sortBy]);

  const clearFilters = () => {
    setCat("All");
    setType("All");
    setSearch("");
    setBranchId("");
    setSortBy("stock_desc");
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const getPaginationRange = () => {
    const delta = 2;
    const range = [];
    for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
      range.push(i);
    }

    if (page - delta > 2) range.unshift("...");
    range.unshift(1);

    if (page + delta < totalPages - 1) range.push("...");
    if (totalPages > 1) range.push(totalPages);

    return range;
  };

  return (
    <div className="ce-page ce-shop shop-container">
      <CustomerPageHeader
        eyebrow="Shop"
        title="Premium Catalog"
        subtitle={`Showing ${products.length} of ${totalItems} items${isFetching && !showLoading ? " · updating…" : ""}`}
        actions={
          <>
            <SearchInput
              className="fsearch"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              label="Search models or parts..."
            />
            <button type="button" className="premium-cart-btn" onClick={() => navigate(cartPath)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span>Cart</span>
              {count > 0 && <span className="cart-badge">{count}</span>}
            </button>
          </>
        }
      />

      <div className="filter-bar-premium">
        <div className="filter-group">
          <label>Browse By Type</label>
          <FilterRadioGroup
            name="shop-product-type"
            value={type}
            onChange={(v) => { setType(v); setPage(1); }}
            compact
            options={[
              { value: "All", label: "All Products" },
              { value: "bike", label: "Electric Bikes" },
              { value: "part", label: "Spare Parts" },
            ]}
          />
        </div>

        <div className="filter-controls-row">
          <div className="control-item">
            <label>Available at Branch</label>
            <select className="premium-select" value={branchId} onChange={(e) => { setBranchId(e.target.value); setPage(1); }}>
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div className="control-item">
            <label>Sort By</label>
            <select className="premium-select" value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }}>
              <option value="stock_desc">Availability (Highest First)</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name: A-Z</option>
            </select>
          </div>
          <button className="btn-clear" onClick={clearFilters}>Reset Filters</button>
        </div>
      </div>

      {showLoading ? (
        <ProductGridSkeleton count={8} className="products-grid" />
      ) : products.length > 0 ? (
        <>
          <div className="products-grid products-grid--reserved">
            {products.map((p) => {
              const mainImg = p.images?.find((img) => img.is_primary)?.url || p.images?.[0]?.url;
              const categoryLabel = p.category?.name || (p.product_type === "bike" ? "Bike" : "Part");
              const marqueeName = p.name?.length > 18 ? `${p.name.slice(0, 18)}…` : p.name;

              return (
                <Link to={productPath(p.id)} key={p.id} className="bike-card-new">
                  <div className="product-card-img">
                    {mainImg ? (
                      <CatalogProductImage src={getImgUrl(mainImg)} alt={p.name} />
                    ) : (
                      <div className="placeholder-img">{p.name}</div>
                    )}
                    {p.stock_qty <= 0 && <div className="out-of-stock-tag">Out of Stock</div>}
                  </div>
                  <NeuCardMarquee words={[categoryLabel, marqueeName, categoryLabel]} className="ce-neu-marquee--sm" />
                  <div className="product-card-body">
                    <div className="product-cat">{p.category?.name || (p.product_type === "bike" ? "Bike" : "Part")}</div>
                    <h3 className="bike-name-new">{p.name}</h3>
                    <div className="bike-price-new">
                      Rs. {Number(p.sale_price || p.price).toLocaleString()}
                    </div>

                    <button
                      type="button"
                      className="shop-add-to-cart-btn"
                      disabled={p.stock_qty <= 0}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addItem(p);
                      }}
                    >
                      {p.stock_qty <= 0 ? "Out of Stock" : "Add to Cart"}
                    </button>

                    <div className="bike-card-footer">
                      <span className="check-details">View Details</span>
                      <div className="arrow-circle">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="pagination-footer">
              <button
                className="pag-btn"
                disabled={page === 1}
                onClick={() => handlePageChange(page - 1)}
              >
                Previous
              </button>

              <div className="pag-numbers">
                {getPaginationRange().map((p, i) => (
                  <React.Fragment key={i}>
                    {p === "..." ? (
                      <span className="pag-ellipsis">...</span>
                    ) : (
                      <button
                        className={`pag-num ${page === p ? "active" : ""}`}
                        onClick={() => handlePageChange(p)}
                      >
                        {p}
                      </button>
                    )}
                  </React.Fragment>
                ))}
              </div>

              <button
                className="pag-btn"
                disabled={page === totalPages}
                onClick={() => handlePageChange(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="card">
          <CustomerEmpty
            title="No products found"
            description="Try adjusting your search or filters to find what you're looking for."
            actionLabel="Clear All Filters"
            onAction={clearFilters}
          />
        </div>
      )}
    </div>
  );
};

export default Shop;
