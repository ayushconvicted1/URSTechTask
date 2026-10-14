# Task 1: Restaurant POS & Order Management System

A web-based Point of Sale (POS) and order workflow application built for restaurants, cafés, and quick-service food establishments.

---

## Live Demo & Repositories

- **Frontend Deployment:** Deployable to Vercel (Ready out of the box)
- **Backend Deployment:** Deployable to Vercel via Serverless (`vercel.json` included) / Render / Railway
- **Postman API Collection:** `docs/postman_collection.json`

---

## Reviewer Demo Credentials

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@urstechsolution.com` | `admin123` | Full menu management, create/edit/toggle/delete items, take orders, view all sales & analytics |
| **Staff** | `staff@urstechsolution.com` | `staff123` | POS terminal, order placement, order workflow status progression, payment recording |

---

## Technology Stack

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide Icons, Fetch API
- **Backend:** Node.js, Express.js (REST API)
- **Database:** MongoDB Atlas via Mongoose
- **Image Storage:** Cloudinary via Multer stream
- **Authentication:** JWT (JSON Web Tokens) with bcrypt password hashing
- **Testing:** Jest, Supertest
- **Deployment Config:** `vercel.json` configured for serverless execution

---

## Features & Business Rules Implemented

### 1. Menu Management (Admin Only)
- View, create, edit, deactivate, and delete menu items.
- Item fields: name, category, price, description, availability status, and photo.
- Cloudinary photo upload endpoint (`POST /api/upload`) with drag-and-drop file picker.
- Live category filters: All, Starters, Mains, Desserts, Beverages, Sides.
- Real-time text search across item names and descriptions.
- Non-admin staff are prevented from modifying menu items (HTTP 403 Forbidden).

### 2. POS Order Creation & Server-Side Billing
- Dine-in or takeaway order options with table number assignment.
- Multiple item selection, real-time quantity modifiers (+ / -), and instant item removal.
- **Server-Side Billing Enforcement:** The backend strictly recalculates item prices, subtotal, 5% tax, and discount amount from database records. Client-submitted prices and totals are never trusted.
- **Stock & Availability Guard:** Unavailable items are blocked by the backend and cannot be ordered (HTTP 400 Bad Request).
- Automatic sequential order number generation (e.g. `ORD-20261014-001`).

### 3. Kitchen Display & Order Workflow
- Order states: `Pending` -> `Preparing` -> `Ready` -> `Completed` (or `Cancelled`).
- Strict state transitions enforced in the database to prevent illegal workflow jumps.
- Real-time filter tabs by status (All, Pending, Preparing, Ready, Completed, Cancelled).

### 4. Payment Recording
- Supports multiple payment methods: **Cash**, **UPI**, and **Card**.
- Payment status badge (`Pending` vs `Paid`) with timestamp recording.

### 5. Daily Sales & Reporting Dashboard
- Filterable sales summary by date.
- Metrics: Total Sales Revenue, Total Orders, Completed Orders, Average Ticket Size.
- Payment breakdown: Total Cash, Total UPI, Total Card.
- Order type distribution: Dine-In vs Takeaway.
- Recent 10 orders preview table.

### 6. Bonus Features
- **Print-Friendly Bill / Invoice:** Formatted thermal receipt layout with a 1-click print modal powered by CSS `@media print`.
- **Order Search:** Search by order number, customer name, or table number.
- **Automated Integration Tests:** Comprehensive test suite in `tests/order.test.js` verifying authentication, role access control, order calculations, unavailable item rejection, and order status transitions.

---

## Project Structure

```
task-1-restaurant-pos/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── menuController.js
│   │   │   ├── orderController.js
│   │   │   └── reportController.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── models/
│   │   │   ├── MenuItem.js
│   │   │   ├── Order.js
│   │   │   └── User.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── menuRoutes.js
│   │   │   ├── orderRoutes.js
│   │   │   ├── reportRoutes.js
│   │   │   └── uploadRoutes.js
│   │   ├── utils/
│   │   │   └── cloudinary.js
│   │   ├── app.js
│   │   ├── db.js
│   │   ├── index.js
│   │   └── seed.js
│   ├── tests/
│   │   └── order.test.js
│   ├── .env.example
│   ├── package.json
│   └── vercel.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css
│   │   │   ├── layout.js
│   │   │   └── page.js
│   │   └── lib/
│   │       └── api.js
│   ├── .env.example
│   ├── next.config.mjs
│   └── package.json
└── docs/
    └── postman_collection.json
```

---

## Local Setup Instructions

### 1. Backend Setup

```bash
cd backend
npm install
```

Copy the example environment file:
```bash
cp .env.example .env
```

Configure your environment variables in `.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/restaurant_pos?retryWrites=true&w=majority
JWT_SECRET=super_secret_jwt_key_restaurant_pos_2026
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
CLOUDINARY_CLOUD_NAME=drpxqylq4
CLOUDINARY_API_KEY=556166956194921
CLOUDINARY_API_SECRET=sq5qQHqD2RkdCus4rsWTDSMlFGQ
```

Seed initial admin/staff users and gourmet menu items:
```bash
npm run seed
```

Run automated tests:
```bash
npm test
```

Start backend development server:
```bash
npm run dev
```

Server runs on: `http://localhost:5000`

---

### 2. Frontend Setup

```bash
cd ../frontend
npm install
```

Copy the example environment file:
```bash
cp .env.example .env.local
```

Set the backend API URL:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Start frontend development server:
```bash
npm run dev
```

Open your browser at: `http://localhost:3000`

---

## Vercel Deployment

### Backend Deployment on Vercel
The backend includes a root `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/index.js"
    }
  ]
}
```
Add `MONGODB_URI`, `JWT_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` to your Vercel Project Environment Variables.

### Frontend Deployment on Vercel
Deploy the `frontend/` folder directly to Vercel and add `NEXT_PUBLIC_API_URL=https://<your-backend-url>/api` to the Environment Variables.
