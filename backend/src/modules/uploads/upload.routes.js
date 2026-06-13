// All website uploads (images + videos) → Cloudflare R2 only (no local disk).
const express = require('express');
const multer = require('multer');
const path = require('path');
const { uploadBuffer, deleteByUrl, assertR2Config } = require('../../utils/r2-upload');
const { prepareUpload, isVideoMime } = require('../../utils/mediaConvert');
const { protect } = require('../../middleware/auth');
const { allow } = require('../../middleware/rbac');
const { ROLES, normalizeRole } = require('../../constants/roles');

const router = express.Router();

const staffUploadRoles = ['COMPANY_OWNER', 'BRANCH_OWNER', 'BRANCH_MANAGER', 'EMPLOYEE'];
const uploadRoles = [...staffUploadRoles, ROLES.CUSTOMER];

const IMAGE_EXT = /\.(jpe?g|png|webp|gif)$/i;
const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogg)$/i;
const IMAGE_TYPES = /^image\//i;
const VIDEO_TYPES = /^video\//i;

const MAX_IMAGE_MB = 10;
const MAX_VIDEO_MB = 80;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_VIDEO_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const ok =
      (IMAGE_TYPES.test(file.mimetype) && IMAGE_EXT.test(ext)) ||
      (VIDEO_TYPES.test(file.mimetype) && VIDEO_EXT.test(ext));
    if (!ok) {
      return cb(new Error('Allowed: images (jpg, png, gif — stored as WebP) and videos (WebM .webm only)'));
    }
    cb(null, true);
  },
});

const pickFile = (req) => {
  if (req.file) return req.file;
  const f = req.files || {};
  return f.image?.[0] || f.video?.[0] || f.file?.[0] || null;
};

const isVideoFile = (file) =>
  isVideoMime(file.mimetype) || VIDEO_EXT.test(path.extname(file.originalname));

router.post(
  '/',
  protect,
  allow(...uploadRoles),
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 },
    { name: 'file', maxCount: 1 },
  ]),
  async (req, res) => {
    const file = pickFile(req);
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded. Use field: image, video, or file.' });
    }

    const video = isVideoFile(file);
    const isCustomer = normalizeRole(req.user.role) === ROLES.CUSTOMER;

    if (isCustomer && video) {
      return res.status(403).json({ message: 'Only image screenshots are allowed for payment proof.' });
    }

    const maxMb = video ? MAX_VIDEO_MB : isCustomer ? 8 : MAX_IMAGE_MB;
    const maxBytes = maxMb * 1024 * 1024;
    if (file.size > maxBytes) {
      return res.status(400).json({
        message: `File too large. Max ${maxMb} MB for ${video ? 'video' : 'image'}.`,
      });
    }

    try {
      assertR2Config();
      const prepared = await prepareUpload(file, video);
      const folder = video
        ? 'uploads/videos'
        : isCustomer
          ? 'uploads/payment-proofs'
          : 'uploads/images';
      const key = `${folder}/${Date.now()}-${Math.round(Math.random() * 1e9)}${prepared.ext}`;
      const url = await uploadBuffer(key, prepared.buffer, prepared.contentType);

      res.json({
        url,
        key,
        type: video ? 'video' : 'image',
        contentType: prepared.contentType,
      });
    } catch (err) {
      console.error('R2 upload error:', err);
      const msg = err.message || 'Upload failed';
      res.status(err.message?.includes('must be') ? 400 : 500).json({ message: msg });
    }
  }
);

router.delete('/', protect, allow(...staffUploadRoles), async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ message: 'url required' });

  try {
    await deleteByUrl(url);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Delete failed' });
  }
});

module.exports = router;
