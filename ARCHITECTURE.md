# System Architecture: Enterprise Pharmacy Management System

## 1. High-Level Architecture Overview

The system is constructed as a modern, high-performance, full-stack application utilizing the Next.js App Router (React Server Components + Client Components), backed by PostgreSQL via Prisma ORM.

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT TIER                                       |
|  Next.js App Router (React 18/19), Tailwind CSS, Lucide React, Recharts, Radix UI |
|  - Keyboard-First POS Terminal      - Dark/Light Theme Switching                  |
|  - Real-time Filtered Data Tables   - Reactive Form Validation (React Hook Form)  |
+-----------------------------------------------------------------------------------+
                                        |
                      HTTPS / Server Actions / JSON API
                                        |
+-----------------------------------------------------------------------------------+
|                             SERVERLESS / BACKEND TIER                             |
|  - Next.js Server Actions (Mutation & Command Operations)                         |
|  - Next.js Route Handlers (File Streaming, Exports, External APIs)                |
|  - Authentication & Session Middleware (NextAuth / JWT / Edge Compatible)         |
|  - Security Layer: Zod Schema Validation, Role & Permission Gatekeeper, Rate Limit|
|  - Business Service Layer (Cart calculation, FEFO allocation, Ledgers, Invoicing) |
+-----------------------------------------------------------------------------------+
                                        |
                       Prisma Client (Connection Pooling)
                                        |
+-----------------------------------------------------------------------------------+
|                                DATABASE TIER                                      |
|  PostgreSQL 16+ (Docker for local / Neon or Supabase with PgBouncer for Vercel)   |
|  - ACID Transactions for Sales & Stock Movements                                  |
|  - Normalized Multi-Tenant Data Schema                                            |
|  - Compound Indexes on Barcodes, Batch Expiries, Timestamps                       |
|  - Immutable Financial & Stock Movement Audit Logs                                |
+-----------------------------------------------------------------------------------+
```

---

## 2. Layer Separation & Design Principles

### A. Presentation Layer (`src/app/`, `src/components/`)
- **Server Components by Default:** Read-only data-fetching pages fetch data securely on the server with zero client JavaScript overhead.
- **Client Components where Interactive:** Interactive tables, POS checkout, modal forms, and charting widgets are isolated client components (`"use client"`).
- **Design System:** Custom UI building blocks modeled after shadcn/ui and Radix UI primitives with Tailwind CSS, supporting dark mode by default (`dark:` classes with navy/slate palette `#0B0F19`, `#1E293B`).

### B. Business Service Layer (`src/services/`)
No raw business logic (such as price calculations, FEFO batch selection, or double-entry balancing) resides inside UI components or raw server actions. Dedicated domain services manage all business rules:
- `MedicineService`: Catalog indexing, generic matching, stock thresholds.
- `InventoryService`: FEFO batch allocation algorithm, atomic stock deduction, quarantine management.
- `SaleService`: Atomic POS transactions, decimal calculations, discount/tax computation, invoice generation.
- `PurchaseService`: GRN (Goods Received Note) processing, batch cost updates, accounts payable balance.
- `AccountingService`: Double-entry transaction logging, cash register reconciliations, Profit & Loss summaries.
- `ReportService`: Fast data aggregations, metrics rollups, ExcelJS/CSV streams.

### C. Data Access & Persistence Layer (`prisma/`, `src/lib/prisma.ts`)
- Strict type-safe schema definitions via `schema.prisma`.
- Singleton Prisma client instance with edge and serverless pooling support.
- Decimal fields used exclusively for all monetary values (`Decimal(12, 2)`) to eliminate floating-point precision flaws.
- All stock deductions and sale records are wrapped inside `prisma.$transaction()` to guarantee all-or-nothing consistency.

### D. Security & Authorization Layer (`src/lib/auth/`, `src/middleware.ts`)
- Edge-compatible session validation in `middleware.ts`.
- Server Action gatekeepers enforcing role checks (`ADMIN`, `PHARMACIST`, `CASHIER`, `ACCOUNTANT`, `INVENTORY_MANAGER`) and explicit permissions before executing mutations.

---

## 3. Key Algorithmic Workflows

### 3.1. FEFO (First-Expiry-First-Out) Dispensing Engine
When an item is added to cart in the POS:
1. System queries all active, non-quarantined batches for the medicine with `quantity > 0` and `expiryDate > CURRENT_DATE`.
2. Batches are sorted strictly by `expiryDate ASC, createdAt ASC`.
3. The required quantity is satisfied across one or more batches in expiry order.
4. If available non-expired stock is less than required, the transaction is rejected with an explicit notification.
5. In the atomic sale commit, individual `SaleBatch` allocation records are stored and corresponding `MedicineBatch.quantity` is decremented while recording an immutable `InventoryMovement`.

### 3.2. Decimal-Safe Monetary Arithmetic
To prevent roundoff anomalies:
- Item Subtotal = $\text{Quantity} \times \text{Unit Price}$
- Line Discount = $\text{Item Subtotal} \times (\text{Discount Rate} / 100)$ or Fixed Line Discount
- Net Item Total = $\text{Item Subtotal} - \text{Line Discount}$
- Invoice Subtotal = $\sum \text{Net Item Totals}$
- Total Tax = $(\text{Invoice Subtotal} - \text{Overall Discount}) \times (\text{Tax Rate} / 100)$
- Net Payable = $(\text{Invoice Subtotal} - \text{Overall Discount}) + \text{Total Tax}$
All computed server-side using Decimal math libraries.
