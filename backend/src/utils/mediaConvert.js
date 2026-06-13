const path = require('path');
const sharp = require('sharp');

const IMAGE_INPUT_EXT = /\.(jpe?g|png|gif|webp|bmp|tiff?)$/i;
const VIDEO_INPUT_EXT = /\.webm$/i;

const isVideoMime = (mimetype) => /^video\//i.test(mimetype || '');

/**
 * Convert any raster image buffer to WebP for R2 storage.
 */
async function imageBufferToWebp(buffer) {
  return sharp(buffer, { animated: true })
    .webp({ quality: 82, effort: 4 })
    .toBuffer();
}

async function prepareImageForUpload(file) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!IMAGE_INPUT_EXT.test(ext) && !/^image\//i.test(file.mimetype)) {
    throw new Error('Images must be JPG, PNG, GIF, or WebP (stored as WebP).');
  }

  const webpBuffer = await imageBufferToWebp(file.buffer);
  return {
    buffer: webpBuffer,
    contentType: 'image/webp',
    ext: '.webp',
  };
}

function prepareVideoForUpload(file) {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();

  if (ext !== '.webm' || mime !== 'video/webm') {
    throw new Error('Videos must be WebM format (.webm) for fast web playback.');
  }

  return {
    buffer: file.buffer,
    contentType: 'video/webm',
    ext: '.webm',
  };
}

async function prepareUpload(file, video) {
  if (video) return prepareVideoForUpload(file);
  return prepareImageForUpload(file);
}

module.exports = {
  imageBufferToWebp,
  prepareImageForUpload,
  prepareVideoForUpload,
  prepareUpload,
  isVideoMime,
};
