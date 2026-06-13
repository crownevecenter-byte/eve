const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

require('../src/config/loadEnv');

const BUCKET = process.env.R2_BUCKET_NAME;
const PUBLIC_BASE = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');
const ENDPOINT = process.env.R2_ENDPOINT || process.env.R2_ENDPOINT_URL;

let r2ClientPromise;

async function detectClockOffsetMs() {
  const endpoint = ENDPOINT;
  if (!endpoint) return 0;
  try {
    const res = await fetch(endpoint, { method: 'HEAD' });
    const dateHdr = res.headers.get('date');
    if (!dateHdr) return 0;
    const serverMs = new Date(dateHdr).getTime();
    const offset = serverMs - Date.now();
    if (Math.abs(offset) > 60_000) {
      console.warn(`System clock skew ${Math.round(offset / 60000)} min — applying R2 signing correction.`);
    }
    return offset;
  } catch {
    return 0;
  }
}

async function getR2Client() {
  if (!r2ClientPromise) {
    const systemClockOffset = await detectClockOffsetMs();
    r2ClientPromise = new S3Client({
      region: 'auto',
      endpoint: ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY || process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_KEY || process.env.R2_SECRET_ACCESS_KEY,
      },
      systemClockOffset,
    });
  }
  return r2ClientPromise;
}

function assertR2Config() {
  const missing = [];
  if (!BUCKET) missing.push('R2_BUCKET_NAME');
  if (!PUBLIC_BASE) missing.push('R2_PUBLIC_URL');
  if (!process.env.R2_ACCESS_KEY && !process.env.R2_ACCESS_KEY_ID) missing.push('R2_ACCESS_KEY_ID');
  if (!process.env.R2_SECRET_KEY && !process.env.R2_SECRET_ACCESS_KEY) missing.push('R2_SECRET_ACCESS_KEY');
  if (!ENDPOINT) missing.push('R2_ENDPOINT_URL');
  if (missing.length) {
    throw new Error(`Missing R2 env: ${missing.join(', ')}`);
  }
}

async function uploadBuffer(key, buffer, contentType = 'image/png') {
  assertR2Config();
  const r2 = await getR2Client();
  const normalizedKey = key.replace(/^\/+/, '');
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: normalizedKey,
      Body: buffer,
      ContentType: contentType,
    })
  );
  return `${PUBLIC_BASE}/${normalizedKey}`;
}

module.exports = { uploadBuffer, assertR2Config, PUBLIC_BASE };
