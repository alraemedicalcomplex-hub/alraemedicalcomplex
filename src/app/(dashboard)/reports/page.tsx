"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  FileSpreadsheet,
  Download,
  Calendar,
  FileText,
  TrendingUp,
  Receipt,
  Boxes,
  Truck,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<"sales" | "inventory" | "pl">("sales");
  const [salesData, setSalesData] = useState<any[]>([]);
  const [accountingData, setAccountingData] = useState<any>(null);
  const [inventoryBatches, setInventoryBatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllReports = async () => {
      setIsLoading(true);
      try {
        const [salesRes, acctRes, invRes] = await Promise.all([
          fetch("/api/reports/sales"),
          fetch("/api/accounting"),
          fetch("/api/inventory/batches"),
        ]);
        const sJson = await salesRes.json();
        const aJson = await acctRes.json();
        const iJson = await invRes.json();

        if (sJson.sales) setSalesData(sJson.sales);
        if (aJson) setAccountingData(aJson);
        if (iJson.batches) setInventoryBatches(iJson.batches);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllReports();
  }, []);

  const totalInventoryValuation = inventoryBatches.reduce(
    (sum, b) => sum + b.quantity * Number(b.purchaseCost),
    0
  );
  const totalRetailValuation = inventoryBatches.reduce(
    (sum, b) => sum + b.quantity * Number(b.retailPrice),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-indigo-500" />
            Executive Reports & Financial Statements
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real database audit queries, inventory valuation, P&L reporting, and CSV/PDF data exports
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
            className="text-xs gap-1.5"
          >
            <Printer className="h-4 w-4" />
            Print Report (PDF)
          </Button>

          <a href="/api/reports/sales?format=csv" download>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1.5 shadow-sm">
              <Download className="h-4 w-4" />
              Download Sales CSV
            </Button>
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab("sales")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === "sales"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          Daily & Monthly Sales
        </button>

        <button
          onClick={() => setActiveTab("inventory")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === "inventory"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          Inventory Valuation
        </button>

        <button
          onClick={() => setActiveTab("pl")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === "pl"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          Profit & Loss Statement
        </button>
      </div>

      {/* Tab: Sales */}
      {activeTab === "sales" && (
        <Card>
          <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Sales Ledger & Invoicing Summary</CardTitle>
            <span className="text-xs text-muted-foreground font-mono">{salesData.length} total invoices</span>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Cashier</th>
                    <th className="py-3 px-4 text-right">Subtotal</th>
                    <th className="py-3 px-4 text-right">Discount</th>
                    <th className="py-3 px-4 text-right">Total (PKR)</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {salesData.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/30">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-400">{s.invoiceNumber}</td>
                      <td className="py-3 px-4 text-muted-foreground">{formatDate(s.createdAt)}</td>
                      <td className="py-3 px-4">{s.customer?.name || "Walk-in Patient"}</td>
                      <td className="py-3 px-4 text-muted-foreground">{s.cashier?.fullName}</td>
                      <td className="py-3 px-4 text-right font-mono">{formatCurrency(s.subtotal)}</td>
                      <td className="py-3 px-4 text-right font-mono text-red-400">
                        {Number(s.discountAmount) > 0 ? `-${formatCurrency(s.discountAmount)}` : "-"}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                        {formatCurrency(s.totalAmount)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="success" className="text-[10px]">{s.paymentStatus}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab: Inventory Valuation */}
      {activeTab === "inventory" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border/60">
              <div className="p-5 space-y-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Cost Value of Inventory
                </span>
                <h3 className="text-2xl font-bold text-indigo-400 font-mono">
                  {formatCurrency(totalInventoryValuation)}
                </h3>
                <p className="text-[11px] text-muted-foreground">Calculated at wholesale purchase cost</p>
              </div>

              <div className="p-5 space-y-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Retail Potential (MRP)
                </span>
                <h3 className="text-2xl font-bold text-emerald-400 font-mono">
                  {formatCurrency(totalRetailValuation)}
                </h3>
                <p className="text-[11px] text-muted-foreground">Potential realization at Maximum Retail Price</p>
              </div>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                      <th className="py-3 px-4">Medicine</th>
                      <th className="py-3 px-4">Batch Number</th>
                      <th className="py-3 px-4 text-right">Quantity</th>
                      <th className="py-3 px-4 text-right">Unit Cost</th>
                      <th className="py-3 px-4 text-right">Total Cost Value</th>
                      <th className="py-3 px-4 text-right">Total Retail Value</th>
                      <th className="py-3 px-4">Expiry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {inventoryBatches.map((b) => (
                      <tr key={b.id} className="hover:bg-muted/30">
                        <td className="py-3 px-4 font-semibold text-foreground">{b.medicine.name}</td>
                        <td className="py-3 px-4 font-mono text-indigo-400">{b.batchNumber}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold">{b.quantity}</td>
                        <td className="py-3 px-4 text-right font-mono">{formatCurrency(b.purchaseCost)}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                          {formatCurrency(b.quantity * Number(b.purchaseCost))}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                          {formatCurrency(b.quantity * Number(b.retailPrice))}
                        </td>
                        <td className="py-3 px-4 font-mono text-muted-foreground">{formatDate(b.expiryDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab: Profit & Loss */}
      {activeTab === "pl" && (
        <Card className="p-6 space-y-4 max-w-2xl">
          <div className="border-b border-border pb-3">
            <h3 className="text-base font-bold text-foreground">Monthly Profit & Loss Statement</h3>
            <p className="text-xs text-muted-foreground">Accounting period: Current Calendar Month</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="font-semibold text-foreground">Gross Sales Revenue:</span>
              <span className="font-mono font-bold text-foreground">{formatCurrency(accountingData?.summary?.totalSales || 0)}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-border/40 text-muted-foreground">
              <span>Less: Cost of Goods Sold (COGS):</span>
              <span className="font-mono">-{formatCurrency(accountingData?.summary?.estimatedCOGS || 0)}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-border font-bold text-sm text-indigo-400">
              <span>GROSS PROFIT:</span>
              <span className="font-mono">{formatCurrency(accountingData?.summary?.grossProfit || 0)}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-border/40 text-muted-foreground">
              <span>Less: Operating Expenses (Rent, Utilities, Staff):</span>
              <span className="font-mono text-rose-400">-{formatCurrency(accountingData?.summary?.totalExpenses || 0)}</span>
            </div>

            <div className="flex justify-between py-3 border-t-2 border-border font-extrabold text-base text-emerald-400">
              <span>NET PROFIT:</span>
              <span className="font-mono">{formatCurrency(accountingData?.summary?.netProfit || 0)}</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
