# 💊 Complete Pharmacy Management System (Pakistan Edition)

An enterprise-grade, full-stack Pharmacy Management System engineered with Next.js (App Router), TypeScript, Tailwind CSS, PostgreSQL, and Prisma ORM.

Tailored for Pakistani pharmacies, retail medical stores, and healthcare dispensaries, featuring PKR currency formatting, Asia/Karachi timezone, DD-MM-YYYY standard dates, FEFO batch-tracking, high-speed POS checkout, prescription management, double-entry financial accounting, and thermal receipt generation.

---

## 🌟 Key Modules & Features

1. **Executive Dashboard:** Live metrics for sales, purchases, gross & net profit, low-stock alerts, expiry projections, and revenue charts.
2. **Master Medicine Catalog:** Generic name mapping, brand catalog, dosage forms, DRAP registration numbers, unit of measure, barcode scanning and generation.
3. **Inventory & FEFO Batch Engine:** Multi-batch tracking per medicine, First-Expiry-First-Out automated dispensing, stock adjustments, quarantine, and audit movements.
4. **Point of Sale (POS):** Fast keyboard-friendly interface, barcode scanner support, real-time stock validation, thermal receipt (80mm/58mm) and A4 invoice printing, cash/card/split payments, hold & resume sales, full/partial returns.
5. **Purchase Management:** Supplier purchase orders, Goods Received Notes (GRN), batch receiving, accounts payable tracking.
6. **Supplier & Customer Management:** Contact profiles, ledgers, credit limits, outstanding balances, statements.
7. **Prescription Management:** Patient medical records, doctor details, PMDC verification, image uploads, controlled drug audit tracking.
8. **Expiry Management:** Real-time 30/60/90 days predictive alerts, expired stock quarantine, supplier return candidates.
9. **Accounting & Cash Register:** Shift opening/closing, cash drawer management, expense tracking with categories, Gross vs Net profit, financial ledger.
10. **Reports & Exports:** Real-time sales, purchases, inventory valuation, profit & loss, Excel (.xlsx), CSV, and PDF exports.
11. **Staff & Access Control:** Role-Based Access Control (`SUPER_ADMIN`, `ADMIN`, `MANAGER`, `PHARMACIST`, `CASHIER`, `INVENTORY_MANAGER`, `ACCOUNTANT`).
12. **Internal Notification Center:** Immediate alerts for stockouts, expiring batches, and overdue balances.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js:** v20.x or v24.x
- **Docker:** (Optional, for running PostgreSQL locally)
- **PostgreSQL:** 15+ (Local or hosted on Neon / Supabase)

### 1. Clone & Install Dependencies
```bash
git clone <repo-url>
cd Sufi_DOG
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```
Ensure your `DATABASE_URL` points to an active PostgreSQL database. For a quick local Docker database:
```bash
docker run -d --name pharmacy-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=pharmacy_db -p 5432:5432 postgres:16-alpine
```

### 3. Initialize Database & Seed Sample Data
```bash
npx prisma migrate dev --name init
npm run seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

Default Super Admin Login:
- **Email:** `admin@pharmacy.local`
- **Password:** `Admin@Pharmacy2026!`

---

## 🛠️ Technology Stack
- **Framework:** Next.js 14+ (App Router, Server Actions, Route Handlers)
- **Language:** TypeScript (Strict mode)
- **Styling:** Tailwind CSS, Lucide React, Radix UI Primitives (shadcn-inspired)
- **Database & ORM:** PostgreSQL, Prisma ORM
- **Charts:** Recharts
- **Data Tables:** TanStack Table
- **Spreadsheets & Docs:** ExcelJS, CSV Parser, jsPDF
- **Validation:** Zod

---

## 🔒 Security
- BCrypt password hashing (Cost 12)
- Server-side RBAC validation
- Decimal-safe monetary arithmetic
- ACID transaction boundaries for inventory movements and sales
- No client-trusted pricing or discounts
