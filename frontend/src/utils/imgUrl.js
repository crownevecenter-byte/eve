// Resolves image/video URLs — keeps stored extensions (R2 catalog is mostly PNG)
import { getApiUrl } from './apiUrl';

const R2_PUBLIC = import.meta.env.VITE_R2_PUBLIC_URL?.replace(/\/$/, '');

const VIDEO_EXT_RE = /\.(mp4|mov|m4v|ogg)$/i;

export const getR2PublicBase = () => R2_PUBLIC || '';

/** Optional WebP variant for URLs that still point at PNG/JPG on CDN */
export const toWebpUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  if (/\.webp(\?|$)/i.test(url)) return url;
  return url.replace(/\.(png|jpe?g|gif|bmp|tiff?)(\?.*)?$/i, '.webp$2');
};

/** Brand/marketing images — always served from the frontend (Vercel public/), not R2 */
export const getPublicAssetUrl = (basename) => {
  if (/\.(webp|png|jpe?g|gif)$/i.test(basename)) {
    return `/${basename.replace(/^\//, '')}`;
  }
  const name = basename.replace(/\.(webp|png|jpg|jpeg|gif)$/i, '');
  return `/${name}.png`;
};

/** Marketing / hero videos — deployed under /videos/ on the frontend host */
export const getPublicVideoUrl = (basename, format = 'mp4') => {
  const name = basename.replace(/\.(webm|mp4|mov)$/i, '');
  const ext = format === 'webm' ? 'webm' : 'mp4';
  return `/videos/${name}.${ext}`;
};

export const getHeroBackgroundStyle = (basename, overlay = '0.55') => ({
  backgroundImage: `linear-gradient(rgba(0, 0, 0, ${overlay}), rgba(0, 0, 0, ${overlay})), url('${getPublicAssetUrl(basename)}')`,
});

/**
 * Product/catalog images — use the URL stored in the database (no extension rewrite).
 */
export const getImgUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (R2_PUBLIC && url.startsWith('uploads/')) {
    return `${R2_PUBLIC}/${url}`;
  }
  const apiUrl = getApiUrl();
  const base = apiUrl.replace('/api', '');
  const pathPart = url.startsWith('/') ? url : `/${url}`;
  return `${base}${pathPart}`;
};

/** Video src — keep stored extension; only normalize relative paths */
export const getVideoUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (R2_PUBLIC && url.startsWith('uploads/')) {
    return `${R2_PUBLIC}/${url}`;
  }
  const apiUrl = getApiUrl();
  const base = apiUrl.replace('/api', '');
  const pathPart = url.startsWith('/') ? url : `/${url}`;
  return `${base}${pathPart}`;
};

/** @deprecated use getVideoUrl */
export const getMediaUrl = getVideoUrl;
