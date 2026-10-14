# UrsTech Solution — Software Development Engineer (SDE) Hiring Assignment

This repository contains the complete implementation of **both compulsory assignments** for the UrsTech Solution SDE Hiring Assessment.

---

## Overview of Completed Tasks

| Task | Title | Tech Stack | Status | Optional Features Included |
| :--- | :--- | :--- | :--- | :--- |
| **Task 1** | **Restaurant POS & Order Management System** | Next.js 16, React 19, Tailwind v4, Express, MongoDB Atlas, Cloudinary, JWT | **Complete** | Print-friendly receipt, Order search by number/status, Automated Jest test suite |
| **Task 2** | **Retail Inventory & Sales Management System** | Next.js 16, React 19, Tailwind v4, Express, MongoDB Atlas, Cloudinary, JWT | **Complete** | Sales-return workflow with stock restoration, Download sales report as CSV, Automated Jest test suite |

---

## Reviewer & Demo Access Credentials

Both applications include 1-click demo login buttons directly on the login screens:

- **Admin Account:**
  - Email: `admin@urstechsolution.com`
  - Password: `admin123`
  - Role: `admin` (Full administrative privileges, menu/product management, analytics, returns)

- **Staff Account:**
  - Email: `staff@urstechsolution.com`
  - Password: `staff123`
  - Role: `staff` (Terminal order creation, stock adjustments, order workflow management, payment recording)

---

## Repository Structure

```
UrsTech Assignment/
├── task-1-restaurant-pos/
│   ├── backend/               # Express.js REST API with vercel.json & Jest tests
│   ├── frontend/              # Next.js 16 App Router responsive application
│   ├── docs/                  # Postman collection (v2.1.0)
│   └── README.md              # Full task-specific documentation & setup
├── task-2-retail-inventory/
│   ├── backend/               # Express.js REST API with vercel.json & Jest tests
│   ├── frontend/              # Next.js 16 App Router responsive application
│   ├── docs/                  # Postman collection (v2.1.0)
│   └── README.md              # Full task-specific documentation & setup
└── README.md                  # Root workspace documentation
```

---

## Quick Start & Verification

### Task 1: Restaurant POS & Order Flow

```bash
# Backend
cd task-1-restaurant-pos/backend
npm install
npm run seed      # Seeds MongoDB Atlas cluster with users & gourmet menu items
npm test          # Runs 6 integration test suites (100% pass)
npm run dev       # Starts backend on http://localhost:5000

# Frontend (in another terminal)
cd ../frontend
npm install
npm run build     # Verifies production Next.js build
npm run dev       # Starts frontend on http://localhost:3000
```

### Task 2: Retail Inventory & Sales Register

```bash
# Backend
cd task-2-retail-inventory/backend
npm install
npm run seed      # Seeds MongoDB Atlas cluster with retail products, movements, and sales
npm test          # Runs 5 integration test suites (100% pass)
npm run dev       # Starts backend on http://localhost:5001

# Frontend (in another terminal)
cd ../frontend
npm install
npm run build     # Verifies production Next.js build
npm run dev       # Starts frontend on http://localhost:3001
```

---
