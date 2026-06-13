# Crown Eve Bikes System - Code Wiki

## 1) Repository Overview

**Purpose**
- "Crown Eve Bikes System" is a bike shop management platform with a React SPA frontend and a Node/Express REST API backend.

**High-level architecture**
```
+--------------------------+       HTTP (JSON)        +--------------------------+
|         Frontend         |  --------------------->  |          Backend         |
|     React (Vite) SPA     |                          |   Node.js + Express API  |
|  Role dashboards + shop  |  <---------------------  |     Auth (JWT) + RBAC    |
+--------------------------+      JWT Bearer token     +-----------+--------------+
                                                         Prisma ORM |
                                                                   v
                                                      +--------------------------+
                                                      |        PostgreSQL        |
                                                      |     (Prisma data model)  |
                                                      +--------------------------+
```

**Monorepo**
- Root uses npm workspaces: [package.json](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/package.json)
- Backend workspace: [backend/package.json](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/backend/package.json)
- Frontend workspace: [frontend/package.json](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/frontend/package.json)

## 2) Directory Layout

```
crown-eve-center-main/
  backend/                 Express API + Prisma
  frontend/                React SPA (Vite)
  processing/              Data extraction artifacts (not runtime)
  docs/                    Project documentation (this wiki)
  README.md                Setup quickstart
  vercel.json              Vercel static SPA routing/build config
  extract_data.py           PDF -> parts CSV/image extraction helper
```

Notable folders:
- Backend source: [backend/src](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/backend/src)
- Prisma schema/migrations: [backend/prisma](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/backend/prisma)
- Frontend source: [frontend/src](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/frontend/src)

Misc root artifacts:
- [BranchOwnerDashboard.jsx](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/BranchOwnerDashboard.jsx) and [CustomerDashboard.jsx](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/CustomerDashboard.jsx) appear to be standalone UI artifacts/mockups outside the main Vite app structure.

## 3) Backend Architecture (Express + Prisma)

### 3.1 Composition root / request flow

- Server entrypoint: [server.js](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/backend/src/server.js)
  - Imports the Express app and starts listening on `PORT` (default 5000).
- Express app composition: [app.js](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/backend/src/app.js)
  - Loads environment variables (`dotenv`).
  - Applies global middleware (Helmet, CORS, JSON body parsing).
  - Serves `/uploads` statically for uploaded images/files.
  - Mounts feature routers under `/api/*`.
  - Provides `/` (info) and `/health` endpoints.
  - Centralizes error handling via a Winston logger.

Typical request pipeline:
1. Router match (`/api/<module>`)
2. Authentication (`protect`) for protected endpoints
3. Authorization (`allow(roles...)`) for restricted operations
4. Payload validation (Zod wrapper) where used
5. Controller handler calls model functions (Prisma queries/transactions)
6. Response JSON

### 3.2 Shared infrastructure

- Prisma client singleton: [db.js](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/backend/src/config/db.js)
  - Centralizes database access for all modules.
- Logging: [logger.js](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/backend/src/config/logger.js)
  - Winston logger (console + files).

### 3.3 Security (JWT + RBAC + validation)

- JWT auth middleware: [auth.js](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/backend/src/middleware/auth.js)
  - Reads `Authorization: Bearer <token>`
  - Verifies with `JWT_SECRET`
  - Populates `req.user` with the JWT payload
  - Refuses to start if `JWT_SECRET` is missing (hard fail at module init)
- Role guard: [rbac.js](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/backend/src/middleware/rbac.js)
  - `allow(...roles)` checks `req.user.role`
  - Returns 403 for disallowed roles
- Request validation: [validate.js](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/backend/src/middleware/validate.js)
  - Zod wrapper used by routes that define `*.schema.js` for inputs

### 3.4 Module conventions

Most backend features follow this structure:
```
backend/src/modules/<feature>/
  <feature>.routes.js       Express router and route-level middleware
  <feature>.controller.js   HTTP handler functions (request/response)
  <feature>.model.js        Prisma queries/transactions (domain logic + DB)
  <feature>.schema.js       Zod request schemas (optional)
```

The route mounting occurs in [app.js](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/backend/src/app.js) under the `/api` prefix.

### 3.5 Major backend modules and responsibilities

Authentication and users:
- `auth` - register/login/profile; issues JWT tokens: [auth.controller.js](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/backend/src/modules/auth/auth.controller.js)
- `users` — staff/customer user management: [users](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/backend/src/modules/users)

Organization:
- `branches` - branch CRUD and metadata: [branches](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/backend/src/modules/branches)

Catalog and inventory:
- `products` - products (bikes/parts-as-products), images, details: [products](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/backend/src/modules/products)
- `parts` - master spare-part catalog: [parts](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/backend/src/modules/parts)
- `inventory` - branch-level part inventory, alerts, and summaries: [inventory](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/backend/src/modules/inventory)

Sales and procurement:
- `orders` - online/POS orders, order items, status changes: [orders](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/backend/src/modules/orders)
- `suppliers` - supplier management: [suppliers](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/backend/src/modules/suppliers)
- `purchases` - purchase recording, stock updates: [purchases](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/backend/src/modules/purchases)

Services:
- `service-categories` - categorize service types: [service-categories](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/backend/src/modules/service-categories)
- `services` - service catalog and branch pricing: [services](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/backend/src/modules/services)
- `service-bookings` - bookings/appointments: [service-bookings](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/backend/src/modules/service-bookings)

Reporting and accounting:
- `reports` - revenue and sales aggregation endpoints: [reports](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/backend/src/modules/reports)
- `accounts` - chart of accounts, ledger statements, trial balance: [accounts](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/backend/src/modules/accounts)
- `vouchers` - voucher posting and ledger updates: [vouchers](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/backend/src/modules/vouchers)
- `banks` - bank accounts and balances used in payment flows: [banks](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/backend/src/modules/banks)
- `walk-in-customers` - POS customers + related ledger/account data: [walk-in-customers](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/backend/src/modules/walk-in-customers)

Content and uploads:
- `testimonials` - testimonial CRUD: [testimonials](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/backend/src/modules/testimonials)
- `uploads` - image upload API via Multer + filesystem storage: [upload.routes.js](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/backend/src/modules/uploads/upload.routes.js)

### 3.6 Key backend functions (by behavior)

Auth:
- `protect(req,res,next)` - verifies JWT and sets `req.user`: [auth.js](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/backend/src/middleware/auth.js)
- `allow(...roles)` - role authorization guard: [rbac.js](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/backend/src/middleware/rbac.js)

Stock synchronization:
- `syncInventoryToPartsAndProducts(tx, branchId, partId)` — recalculates:
  - per-branch derived `Product.stock_qty` based on required component parts
  - global `Part.stock` as sum across all branch inventories
  - Implementation: [inventory.utils.js](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/backend/src/modules/inventory/inventory.utils.js)

Order processing (transactional logic):
- `createOrder(...)` (model layer) — creates an order and updates stock/ledgers:
  - stock checks and decrements for product stock
  - BOM-based part inventory decrements and calls into inventory sync
  - Implementation: [order.model.js](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/backend/src/modules/orders/order.model.js)

### 3.7 Data model (Prisma) - domain overview

Prisma schema: [schema.prisma](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/backend/prisma/schema.prisma)

The schema models a multi-branch retail business, including:
- **Identity & org**: `User`, `Branch`, role-based access
- **Catalog**: `Product`, `Category`, `Brand`, `Part`
- **Inventory**: `Inventory` (branch-level), and product-part relationships (BOM-style)
- **Sales**: `Order`, `OrderItem`, order status and customer association
- **Services**: `ServiceCategory`, `Service`, `ServiceBooking`
- **Procurement**: `Supplier`, `Purchase`, `PurchaseItem`
- **Accounting**: `AccountCategory`, `Account`, `Ledger`, `LedgerEntry`, `Voucher`
- **Payments**: `Bank` and bank balance adjustments
- **POS customers**: walk-in customer entities + self-healing ledger/account logic

Seed data:
- Seeds default branch and default users/roles: [seed.js](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/backend/prisma/seed.js)

## 4) Frontend Architecture (React + Vite)

### 4.1 App bootstrap

- React root + React Query wiring: [main.jsx](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/frontend/src/main.jsx)
  - Initializes `QueryClient` and provides it to the app.
  - Wraps the app with an error boundary: [ErrorBoundary.jsx](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/frontend/src/components/ErrorBoundary.jsx)

### 4.2 Routing and layout shells

- Route definitions live in: [App.jsx](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/frontend/src/App.jsx)
- Uses `react-router-dom` with `lazy()` route-level code splitting.
- Role-based "shell" layouts:
  - Owner shell: [OwnerLayout](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/frontend/src/components/owner/OwnerLayout.jsx)
  - Branch shell: [BranchLayout](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/frontend/src/components/branch/BranchLayout.jsx)
  - Customer shell: [CustomerLayout](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/frontend/src/components/customer/CustomerLayout.jsx)
- Public layout wrapper: [Layout.jsx](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/frontend/src/components/Layout.jsx)

### 4.3 Auth and authorization (frontend)

- Auth state (user + token) is managed in: [AuthContext.jsx](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/frontend/src/context/AuthContext.jsx)
  - `login(email,password)` calls `/auth/login` and stores `token` + `user` in `localStorage`
  - `logout()` clears storage and redirects to `/`
  - On mount, `GET /auth/me` verifies token and refreshes cached user
- Route guard: [ProtectedRoute.jsx](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/frontend/src/components/layout/ProtectedRoute.jsx)
  - Redirects unauthenticated users to `/login`
  - Redirects unauthorized roles to `/unauthorized`

### 4.4 API client

- Axios client: [api.js](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/frontend/src/services/api.js)
  - `baseURL` uses `VITE_API_URL` or defaults to:
    - development: `http://localhost:5000/api`
    - production: `https://crown-eve-center.onrender.com/api`
  - Request interceptor injects `Authorization: Bearer <token>`

### 4.5 Cart (client-side)

- Cart state stored in localStorage: [CartContext.jsx](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/frontend/src/context/CartContext.jsx)
  - Supports add/remove/update/clear and exposes computed `total` and `count`

### 4.6 Pages

Top-level page areas:
- Public pages: [pages/public](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/frontend/src/pages/public)
- Authentication: [pages/auth](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/frontend/src/pages/auth) and [Login.jsx](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/frontend/src/pages/Login.jsx)
- Dashboards:
  - Owner: [pages/dashboards/owner](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/frontend/src/pages/dashboards/owner)
  - Branch: [pages/dashboards/branch](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/frontend/src/pages/dashboards/branch)
  - Customer: [pages/dashboards/customer](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/frontend/src/pages/dashboards/customer)

## 5) Dependency Relationships (Module-Level)

### 5.1 Backend dependency map

```
server.js
  └─ app.js
      ├─ config/logger.js
      ├─ middleware/* (auth, rbac, validate)
      └─ modules/*/*.routes.js
           └─ modules/*/*.controller.js
                └─ modules/*/*.model.js
                     └─ config/db.js (PrismaClient)
```

Notable cross-module couplings:
- Orders/Purchases -> Inventory stock sync
  - `orders` and `purchases` call `syncInventoryToPartsAndProducts` from `inventory` utilities:
    - [inventory.utils.js](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/backend/src/modules/inventory/inventory.utils.js)

### 5.2 Frontend dependency map

```
main.jsx
  └─ App.jsx (router)
      ├─ context/AuthContext.jsx
      ├─ context/CartContext.jsx
      ├─ components/layout/ProtectedRoute.jsx
      ├─ components/*Layout.jsx
      └─ pages/** (lazy-loaded)

services/api.js
  └─ (used by pages/hooks/contexts for HTTP calls)
```

### 5.3 Dependency style

- The backend uses manual module composition with CommonJS `require(...)`.
- There is no dependency injection container; modules import the shared Prisma singleton or utility functions directly.
- The frontend uses standard React composition through providers, route shells, and shared service modules.

## 6) How to Run the Project

Primary quickstart: [README.md](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/README.md)

### 6.1 Prerequisites

- Node.js >= 20 (backend enforces this via `engines`): [backend/package.json](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/backend/package.json)
- PostgreSQL database (local or remote)
- npm (workspaces supported)

### 6.2 Backend setup

1. Install dependencies
   - From repo root: `npm install`
   - Or in backend only: `cd backend && npm install`
2. Configure environment variables
   - Copy [backend/.env.example](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/backend/.env.example) to `backend/.env`
   - Required:
     - `DATABASE_URL` (Prisma datasource)
     - `DIRECT_URL` (Prisma datasource)
     - `JWT_SECRET` (server refuses to start without it)
3. Run migrations and seed
   - `cd backend`
   - `npx prisma migrate dev`
   - `npx prisma db seed`
4. Start the backend
   - Development: `npm run dev`
   - Production-style: `npm run start`

Default backend base URL:
- `http://localhost:5000`
- API prefix: `http://localhost:5000/api`

### 6.3 Frontend setup

1. Install dependencies
   - `cd frontend && npm install`
2. Configure API base URL (optional)
   - Set `VITE_API_URL` to point to your backend `/api` URL.
3. Start the frontend
   - `npm run dev`

Default frontend dev URL:
- Vite typically serves on `http://localhost:5173`

### 6.4 Build

- Frontend: `cd frontend && npm run build`
- Root (delegates to frontend workspace): `npm run build`
- Backend (deployment DB steps): `cd backend && npm run build`

### 6.5 Checks and validation

- Frontend lint: `cd frontend && npm run lint`
- Backend includes a smoke-style RBAC script: `cd backend && node run_rbac_tests.js`
- There is no standard `npm test` script at the root, backend, or frontend package level.

## 7) Deployment Notes

- Frontend is configured for Vercel static deployment: [vercel.json](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/vercel.json)
  - Routes all non-asset paths to `frontend/index.html` for SPA navigation.
- Backend includes `vercel-build` and `build` scripts that run Prisma generate + migrate deploy:
  - [backend/package.json](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/backend/package.json)

## 8) Auxiliary Tooling (Non-runtime)

- PDF extraction pipeline:
  - Script: [extract_data.py](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/extract_data.py)
  - Inputs/outputs folder: [processing](file:///d:/crown-eve-center-main%20(3)/crown-eve-center-main/processing)
  - Purpose: extract part records and images from `processing/abc.pdf` into `processing/parts.csv` plus renamed images.
