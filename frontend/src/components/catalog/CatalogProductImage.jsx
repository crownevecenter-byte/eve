import React, { useEffect, useState, useCallback } from 'react';

const ALT_EXTS = ['.png', '.jpg', '.jpeg', '.webp'];

export const buildFallbackChain = (src) => {
  if (!src) return [];
  const m = src.match(/^(.*?)(\.(webp|png|jpe?g|gif))?(\?.*)?$/i);
  if (!m) return [src];
  const base = m[1];
  const query = m[4] || '';
  const chain = [];
  for (const ext of ALT_EXTS) {
    const candidate = `${base}${ext}${query}`;
    if (!chain.includes(candidate)) chain.push(candidate);
  }
  if (!chain.includes(src)) chain.unshift(src);
  else {
    chain.splice(chain.indexOf(src), 1);
    chain.unshift(src);
  }
  return chain;
};

/**
 * Product card image — tries WebP then PNG/JPG if CDN only has legacy files.
 */
const CatalogProductImage = ({ src, alt, className = 'bike-main-img' }) => {
  const [chain, setChain] = useState(() => buildFallbackChain(src));
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const next = buildFallbackChain(src);
    setChain(next);
    setIndex(0);
  }, [src]);

  const handleError = useCallback(() => {
    setIndex((i) => (i < chain.length - 1 ? i + 1 : i));
  }, [chain.length]);

  if (!src || !chain.length) return null;

  const currentSrc = chain[index] || src;

  return (
    <img
      src={currentSrc}
      alt={alt || ''}
      className={className}
      loading="lazy"
      decoding="async"
      onError={handleError}
    />
  );
};

export default CatalogProductImage;
