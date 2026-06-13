import React from 'react';

const DEFAULT_COUNT = 8;

const ProductGridSkeleton = ({ count = DEFAULT_COUNT, className = 'products-grid' }) => (
  <div
    className={`${className} products-grid--reserved products-grid--loading`}
    aria-busy="true"
    aria-label="Loading catalog"
  >
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="bike-card-new catalog-card-skeleton" aria-hidden>
        <div className="product-card-img catalog-img-skeleton" />
        <div className="catalog-body-skeleton">
          <span className="catalog-skeleton-line catalog-skeleton-line--short" />
          <span className="catalog-skeleton-line" />
          <span className="catalog-skeleton-line catalog-skeleton-line--price" />
        </div>
      </div>
    ))}
  </div>
);

export default ProductGridSkeleton;
