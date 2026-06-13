# Crown Eve Bikes System

Premium management system for Crown Eve Bikes.

## Tech Stack
- **Frontend**: React (Vite) + TailwindCSS + Framer Motion
- **Backend**: Node.js + Express + Prisma (ORM)
- **Database**: PostgreSQL

## Setup Instructions

### 1. Backend Setup
1. `cd backend`
2. `npm install`
3. Create a `.env` file with:
   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
   JWT_SECRET="your_secret_key"
   PORT=5000
   ```
4. Run migrations: `npx prisma migrate dev`
5. Seed database: `npx prisma db seed`
6. Start dev server: `npm run dev`

### 2. Frontend Setup
1. `cd frontend`
2. `npm install`
3. Start dev server: `npm run dev`

## Roles & Permissions
- **COMPANY_OWNER**: Global admin.
- **BRANCH_OWNER**: Branch manager.
- **EMPLOYEE**: POS and orders.
- **TECHNICIAN**: Service tasks.
- **CUSTOMER**: Online shop and bookings.
