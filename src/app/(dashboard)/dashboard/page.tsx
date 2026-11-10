import React from "react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { getDashboardMetrics } from "@/services/dashboard.service";
import { MetricCard } from "@/features/dashboard/components/metric-card";
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
              {pharmacy?.name || "Sufi Pharmacy & Wellness"}
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

      {/* Row 1: Today's Financial Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Today's Sales"
          value={formatCurrency(metrics.todaySales)}
          subtitle={`Yesterday: ${formatCurrency(metrics.yesterdaySales)}`}
          icon={Receipt}
          variant="indigo"
          trend={{
            value: metrics.yesterdaySales > 0
              ? `${(((metrics.todaySales - metrics.yesterdaySales) / metrics.yesterdaySales) * 100).toFixed(1)}% vs yesterday`
              : "Active Day",
            isPositive: metrics.todaySales >= metrics.yesterdaySales,
          }}
        />

        <MetricCard
          title="Monthly Revenue"
          value={formatCurrency(metrics.monthlyRevenue)}
          subtitle="Gross retail dispensing turnover"
          icon={TrendingUp}
          variant="success"
        />

        <MetricCard
          title="Estimated Gross Profit"
          value={formatCurrency(metrics.grossProfit)}
          subtitle={`Net Profit: ${formatCurrency(metrics.netProfit)}`}
          icon={Wallet}
          variant={metrics.netProfit >= 0 ? "success" : "destructive"}
        />

        <MetricCard
          title="Inventory Valuation"
          value={formatCurrency(metrics.inventoryValuation)}
          subtitle={`${metrics.totalStockQuantity} units across ${metrics.totalMedicines} medicines`}
          icon={Boxes}
          variant="default"
        />
      </div>

      {/* Row 2: Payables, Receivables & Stock Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Supplier Payables"
          value={formatCurrency(metrics.supplierPayables)}
          subtitle="Pending procurement invoices"
          icon={Truck}
          variant="warning"
        />

        <MetricCard
          title="Customer Receivables"
          value={formatCurrency(metrics.customerReceivables)}
          subtitle="Outstanding patient credit balance"
          icon={Users}
          variant="indigo"
        />

        <MetricCard
          title="Expiring Batches (90d)"
          value={`${metrics.expiringCount} Batches`}
          subtitle={`Expired Batches: ${metrics.expiredCount}`}
          icon={AlertTriangle}
          variant={metrics.expiringCount > 0 ? "warning" : "default"}
        />

        <MetricCard
          title="Low & Depleted Stock"
          value={`${metrics.lowStockCount + metrics.outOfStockCount} Items`}
          subtitle={`${metrics.outOfStockCount} zero stock, ${metrics.lowStockCount} below minimum`}
          icon={Boxes}
          variant={metrics.outOfStockCount > 0 ? "destructive" : "warning"}
        />
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
