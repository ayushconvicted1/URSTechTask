# Task 2: Retail Inventory & Sales Management System

A web-based retail inventory management, stock movement ledger, point of sale register, and profit analytics system designed for grocery stores, electronics outlets, and general retail businesses.

---

## Live Demo & Repositories

- **Frontend Deployment:** Deployable to Vercel (Ready out of the box)
- **Backend Deployment:** Deployable to Vercel via Serverless (`vercel.json` included) / Render / Railway
- **Postman API Collection:** `docs/postman_collection.json`

---

## Reviewer Demo Credentials

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@urstechsolution.com` | `admin123` | Full product administration, add/edit products, stock adjustments, process returns, view all sales & profit analytics |
| **Staff** | `staff@urstechsolution.com` | `staff123` | POS checkout, inventory adjustments, low-stock restock, view stock audit ledger |

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

### 1. Product Management (Admin Only)
- View, create, edit, and deactivate retail products.
- Product attributes: SKU (unique identifier), Product Name, Category, Purchase Price, Selling Price, Available Stock, and Configured Reorder Alert Level.
- SKU uniqueness strictly validated in database indexes and pre-save logic.
- Cloudinary photo upload endpoint (`POST /api/upload`) for product catalog images.
- Non-admin staff are blocked from adding or editing products (HTTP 403 Forbidden).

### 2. Search & Filter
- Real-time search across product name and SKU.
- Category filtering (Electronics, Grocery, Stationery, Apparel).
- Stock status filters: All, Low Stock (<= reorder level), Out of Stock (= 0), In Stock.

### 3. Inventory Adjustments & Audit Trail
- Supported adjustment types:
  - `RECEIVED`: Inward vendor restock
  - `ADJUSTMENT_IN`: Positive manual stock correction
  - `ADJUSTMENT_OUT`: Negative manual stock correction (damaged / lost)
- **Zero Stock Boundary Rule:** Stock deductions cannot reduce product inventory below zero.
- **Audited Ledger:** Every stock change creates an immutable `InventoryMovement` record capturing product, movement type, transferred quantity, previous stock, new stock, reason/reference, user, and timestamp.

### 4. Sales POS & Invoice Generation
- Create sales with multiple products, quantities, and payment methods (Cash, Card, UPI).
- Automatic sequential invoice number generation (e.g. `INV-20261014-0001`).
- **Stock Validation & Deduction:** Checks that `availableStock >= requestedQuantity`. If valid, deducts stock atomically; if stock is insufficient or a conflict occurs, all previous deductions roll back safely.
- Calculates and validates subtotal, discount, 5% tax, and total amount on the server.

### 5. Low-Stock Alerts & 1-Click Restock
- Dedicated view identifying all products at or below their configured reorder level.
- 1-click **Quick Restock (+20)** action that instantly issues an audited receipt movement.

### 6. Profit & COGS Reporting
- Calculates:
  - **Total Sales Revenue**
  - **Cost of Goods Sold (COGS):** Calculated accurately using item purchase price × quantity sold
  - **Gross Profit:** Total Revenue - COGS
  - **Gross Margin Percentage:** Gross Profit / Total Revenue
- Top-selling products table ranked by volume sold and revenue generated.

### 7. Bonus Features
- **Sales Return Workflow with Stock Restoration:** Staff/Admin can process a return on completed invoices with a reason. Stock is automatically restored to the product inventory and an audited `RETURN` movement is recorded.
- **Download Sales Report as CSV:** Instant export of all sales invoices with headers into a CSV file via backend endpoint `GET /api/reports/sales/csv`.
- **Printable Thermal Receipt:** Printable receipt modal with custom CSS `@media print` formatting.
- **Automated Integration Tests:** Comprehensive test suite in `tests/inventory.test.js` validating SKU uniqueness, admin access, overselling prevention, stock deduction consistency, and sales return restoration.

---

## Project Structure

```
task-2-retail-inventory/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── inventoryController.js
│   │   │   ├── productController.js
│   │   │   ├── reportController.js
│   │   │   └── saleController.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── models/
│   │   │   ├── InventoryMovement.js
│   │   │   ├── Product.js
│   │   │   ├── Sale.js
│   │   │   └── User.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── inventoryRoutes.js
│   │   │   ├── productRoutes.js
│   │   │   ├── reportRoutes.js
│   │   │   ├── saleRoutes.js
│   │   │   └── uploadRoutes.js
│   │   ├── utils/
│   │   │   └── cloudinary.js
│   │   ├── app.js
│   │   ├── db.js
│   │   ├── index.js
│   │   └── seed.js
│   ├── tests/
│   │   └── inventory.test.js
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
PORT=5001
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/retail_inventory?retryWrites=true&w=majority
JWT_SECRET=super_secret_jwt_key_retail_inventory_2026
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
CLOUDINARY_CLOUD_NAME=drpxqylq4
CLOUDINARY_API_KEY=556166956194921
CLOUDINARY_API_SECRET=sq5qQHqD2RkdCus4rsWTDSMlFGQ
```

Seed initial users, products, movements, and completed sales:
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

Server runs on: `http://localhost:5001`

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
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

Start frontend development server:
```bash
npm run dev
```

Open your browser at: `http://localhost:3001`

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
