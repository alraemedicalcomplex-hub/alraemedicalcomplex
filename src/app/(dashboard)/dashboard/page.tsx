import React from "react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { getDashboardMetrics } from "@/services/dashboard.service";
import { SalesChart } from "@/features/dashboard/components/sales-chart";
import { RecentSalesTable } from "@/features/dashboard/components/recent-sales-table";
import { InventoryStatusCard } from "@/features/dashboard/components/inventory-status-card";
import { formatCurrency } from "@/lib/utils";
import {
  TrendingUp,
  Receipt,
  ShoppingCart,
  Boxes,
  Truck,
  Users,
  Wallet,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getCurrentUser();
  const pharmacyId = session?.pharmacyId || "00000000-0000-0000-0000-000000000001";

  const [metrics, pharmacy] = await Promise.all([
    getDashboardMetrics(pharmacyId),
    prisma.pharmacy.findUnique({
      where: { id: pharmacyId },
      include: { settings: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border bg-gradient-to-r from-card via-card to-indigo-950/20 p-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {pharmacy?.name || "Al Rae Hospital"}
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              DSL: {pharmacy?.dslNumber || "Active"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{pharmacy?.address}, {pharmacy?.city}</span>
            <span>•</span>
            <span className="font-mono text-indigo-400">Timezone: {pharmacy?.timezone}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/pos">
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 shadow-md shadow-indigo-600/20">
              <ShoppingCart className="h-4 w-4" />
              <span>Open POS (F2)</span>
            </Button>
          </Link>
          <Link href="/reports">
            <Button variant="outline" className="gap-1.5">
              <span>View Financial Reports</span>
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary Financial KPI Ribbon */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border/60">
          {/* 1. Today's Sales */}
          <div className="p-5 sm:p-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Today&apos;s Sales
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                <Receipt className="h-4 w-4" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-foreground font-mono">
                {formatCurrency(metrics.todaySales)}
              </h3>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                <span
                  className={`font-semibold ${
                    metrics.todaySales >= metrics.yesterdaySales ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {metrics.todaySales >= metrics.yesterdaySales ? "↑" : "↓"}{" "}
                  {metrics.yesterdaySales > 0
                    ? `${(((metrics.todaySales - metrics.yesterdaySales) / metrics.yesterdaySales) * 100).toFixed(1)}%`
                    : "Active"}
                </span>
                <span>vs yesterday ({formatCurrency(metrics.yesterdaySales)})</span>
              </div>
            </div>
          </div>

          {/* 2. Monthly Revenue */}
          <div className="p-5 sm:p-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Monthly Turnover
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-foreground font-mono">
                {formatCurrency(metrics.monthlyRevenue)}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Gross retail dispensing revenue (MTD)
              </p>
            </div>
          </div>

          {/* 3. Estimated Profit */}
          <div className="p-5 sm:p-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Estimated Gross Profit
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-emerald-400 font-mono">
                {formatCurrency(metrics.grossProfit)}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Estimated Net: <span className="font-semibold text-foreground">{formatCurrency(metrics.netProfit)}</span>
              </p>
            </div>
          </div>

          {/* 4. Inventory Valuation */}
          <div className="p-5 sm:p-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Total Inventory Valuation
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                <Boxes className="h-4 w-4" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-foreground font-mono">
                {formatCurrency(metrics.inventoryValuation)}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.totalStockQuantity.toLocaleString()} units across {metrics.totalMedicines} formulary drugs
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Working Capital & Health Ribbon */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border/60">
          {/* Supplier Payables */}
          <div className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Supplier Payables
              </span>
              <h4 className="text-lg font-bold text-amber-400 font-mono">
                {formatCurrency(metrics.supplierPayables)}
              </h4>
              <p className="text-[11px] text-muted-foreground">Pending distributor billing</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Truck className="h-4 w-4" />
            </div>
          </div>

          {/* Customer Receivables */}
          <div className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Patient Receivables
              </span>
              <h4 className="text-lg font-bold text-indigo-400 font-mono">
                {formatCurrency(metrics.customerReceivables)}
              </h4>
              <p className="text-[11px] text-muted-foreground">Outstanding customer credit</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Users className="h-4 w-4" />
            </div>
          </div>

          {/* Expiring Batches */}
          <div className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Near-Expiry Batches
              </span>
              <h4 className="text-lg font-bold text-rose-400 font-mono">
                {metrics.expiringCount} Batches
              </h4>
              <p className="text-[11px] text-muted-foreground">
                {metrics.expiredCount > 0 ? `${metrics.expiredCount} expired batches` : "0 expired stock"}
              </p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>

          {/* Stock Depletions */}
          <div className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Low & Depleted Stock
              </span>
              <h4 className="text-lg font-bold text-foreground font-mono">
                {metrics.lowStockCount + metrics.outOfStockCount} Items
              </h4>
              <p className="text-[11px] text-muted-foreground">
                {metrics.outOfStockCount} out of stock • {metrics.lowStockCount} low
              </p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-muted/60 border border-border flex items-center justify-center text-muted-foreground">
              <Boxes className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Visual Analytics Chart & Inventory Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SalesChart data={metrics.monthlyChart} />
        <InventoryStatusCard
          lowStockCount={metrics.lowStockCount}
          outOfStockCount={metrics.outOfStockCount}
          expiringCount={metrics.expiringCount}
          expiredCount={metrics.expiredCount}
        />
      </div>

      {/* Row 4: Recent Sales & Top Fast-Moving Medicines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentSalesTable sales={metrics.recentSales} />

        {/* Top Fast-Moving Medicines Card */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/80">
            <div>
              <h3 className="text-base font-semibold text-foreground">Top-Selling Medicines</h3>
              <p className="text-xs text-muted-foreground mt-0.5">High velocity dispensary items</p>
            </div>
            <Link href="/medicines" className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              Catalog <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {metrics.topSelling.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No sales data recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {metrics.topSelling.map((med, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-muted/20"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-foreground">{med.name}</p>
                    <p className="text-[11px] text-muted-foreground">{med.genericName}</p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <span className="font-mono text-xs font-bold text-foreground">
                      {formatCurrency(med.revenue)}
                    </span>
                    <p className="text-[10px] text-muted-foreground">
                      {med.quantity} units sold
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
