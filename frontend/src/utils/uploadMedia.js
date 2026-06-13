// Upload images/videos from the website → backend → Cloudflare R2
import { getApiUrl } from './apiUrl';

/** Resize/compress large screenshots before upload for faster transfer. */
export async function compressImageForUpload(file, maxWidth = 1400, quality = 0.82) {
  if (!file?.type?.startsWith('image/') || file.size < 400 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxWidth / Math.max(img.width, img.height));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const baseName = file.name.replace(/\.[^.]+$/, '') || 'payment-proof';
          resolve(new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() }));
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

/**
 * @param {File} file
 * @param {{ field?: 'image'|'video'|'file', compress?: boolean }} options
 * @returns {Promise<{ url: string, type: 'image'|'video' }>}
 */
export async function uploadMedia(file, options = {}) {
  if (!file) throw new Error('No file selected');

  const field = options.field || (file.type.startsWith('video/') ? 'video' : 'image');
  if (field === 'video' && file.type !== 'video/webm') {
    throw new Error('Videos must be WebM (.webm) format.');
  }
  const formData = new FormData();
  formData.append(field, file);

  const token = localStorage.getItem('crowneve_token');
  const res = await fetch(`${getApiUrl()}/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || `Upload failed (${res.status})`);
  }
  return { url: data.url, type: data.type || field };
}

export const uploadImage = async (file, options = {}) => {
  const prepared =
    options.compress !== false ? await compressImageForUpload(file) : file;
  return uploadMedia(prepared, { field: 'image' });
};
export const uploadVideo = (file) => uploadMedia(file, { field: 'video' });
