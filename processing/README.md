# Parts catalog from `abc.pdf`

## Commands (from `backend/`)

```bash
npm run parse:catalog          # Extract products + images from ../abc.pdf
npm run seed:products          # Upload images to R2 + seed DB (both branches)
npm run repair:catalog-images  # Re-parse + force re-upload + fix DB links (wrong pictures)
```

Requires: `DATABASE_URL`, `R2_*` env vars in `backend/.env` or `config.env`.

## Output

| Path | Description |
|------|-------------|
| `products.json` | 1292 parts parsed from PDF |
| `images/*.png` | One image per part when available (~1040) |

Each branch (Chishtian id=1, Lahore id=2) gets its own product row; images are shared on R2 by `item_code`.
