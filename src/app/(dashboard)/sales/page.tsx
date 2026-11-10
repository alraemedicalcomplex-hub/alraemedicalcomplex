"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Receipt,
  Search,
  Eye,
  Printer,
  Undo2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

interface SaleRecord {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  saleStatus: string;
  paymentStatus: string;
  notes?: string | null;
  customer?: { id: string; name: string; phone: string } | null;
  cashier?: { fullName: string };
  items: any[];
  payments: any[];
  returns: any[];
}

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Selected sale for viewing receipt / returns
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState("Customer Change of Mind / Unopened");
  const [returnDisposition, setReturnDisposition] = useState("RESTOCK");
  const [isProcessingReturn, setIsProcessingReturn] = useState(false);

  const fetchSales = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/sales?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.sales) setSales(data.sales);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSales();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSale) return;
    setIsProcessingReturn(true);

    try {
      const itemsPayload = selectedSale.items.map((it) => ({
        saleItemId: it.id,
        quantity: it.quantity,
        disposition: returnDisposition,
        refundAmount: Number(it.totalPrice),
      }));

      const res = await fetch("/api/sales/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saleId: selectedSale.id,
          reason: returnReason,
          refundAmount: Number(selectedSale.totalAmount),
          items: itemsPayload,
        }),
      });

      if (res.ok) {
        setShowReturnModal(false);
        setSelectedSale(null);
        fetchSales();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessingReturn(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Receipt className="h-6 w-6 text-indigo-500" />
            Sales Invoices & Dispensing History
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Immutable customer invoice records, payment reconciliations, and return disposition tracking
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/returns">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Undo2 className="h-4 w-4 text-amber-500" />
              <span>Sales Returns</span>
            </Button>
          </Link>

          <Link href="/pos">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 text-xs shadow-md shadow-emerald-600/20">
              <Plus className="h-4 w-4" />
              <span>New POS Sale (F2)</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter toolbar */}
      <Card className="p-4">
        <div className="max-w-md">
          <Input
            placeholder="Search by Invoice # (e.g. INV-2026-00001) or Patient Name/Phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </div>
      </Card>

      {/* Sales Invoices Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Patient / Customer</th>
                  <th className="py-3 px-4">Dispensing Cashier</th>
                  <th className="py-3 px-4 text-center">Items Dispensed</th>
                  <th className="py-3 px-4 text-right">Net Amount</th>
                  <th className="py-3 px-4">Payment Status</th>
                  <th className="py-3 px-4">Sale Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-muted-foreground">
                      Loading invoice records...
                    </td>
                  </tr>
                ) : sales.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-muted-foreground">
                      No sales records found.
                    </td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">
                        {sale.invoiceNumber}
                      </td>

                      <td className="py-3.5 px-4 text-muted-foreground">
                        {formatDate(sale.createdAt, true)}
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-foreground">
                          {sale.customer ? sale.customer.name : "Walk-in Patient"}
                        </p>
                        {sale.customer && (
                          <p className="text-[10px] text-muted-foreground">{sale.customer.phone}</p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-muted-foreground">
                        {sale.cashier?.fullName || "Staff"}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono">
                        {sale.items.length} medicines
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-sm font-bold text-foreground">
                        {formatCurrency(sale.totalAmount)}
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            sale.paymentStatus === "PAID"
                              ? "success"
                              : sale.paymentStatus === "PARTIAL"
                              ? "warning"
                              : "destructive"
                          }
                          className="text-[10px]"
                        >
                          {sale.paymentStatus}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            sale.saleStatus === "COMPLETED"
                              ? "default"
                              : sale.saleStatus === "PARTIALLY_RETURNED"
                              ? "warning"
                              : "destructive"
                          }
                          className="text-[10px]"
                        >
                          {sale.saleStatus}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-indigo-400"
                            onClick={() => setSelectedSale(sale)}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            View
                          </Button>

                          {sale.saleStatus !== "PARTIALLY_RETURNED" && sale.saleStatus !== "RETURNED" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-amber-400 hover:text-amber-300"
                              onClick={() => {
                                setSelectedSale(sale);
                                setShowReturnModal(true);
                              }}
                            >
                              <Undo2 className="h-3.5 w-3.5 mr-1" />
                              Return
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Sale Detail & Receipt Modal */}
      {selectedSale && !showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-[#111827] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Invoice {selectedSale.invoiceNumber}
                </h3>
                <p className="text-xs text-muted-foreground">{formatDate(selectedSale.createdAt, true)}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedSale(null)}>
                Close
              </Button>
            </div>

            {/* Items */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {selectedSale.items.map((it: any) => (
                <div key={it.id} className="flex justify-between p-2 rounded-lg bg-muted/20 border border-border/60 text-xs">
                  <div>
                    <p className="font-semibold text-foreground">{it.medicine?.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {it.quantity} × {formatCurrency(it.unitPrice)}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-foreground">{formatCurrency(it.totalPrice)}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-border space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-mono">{formatCurrency(selectedSale.subtotal)}</span>
              </div>
              {Number(selectedSale.discountAmount) > 0 && (
                <div className="flex justify-between text-red-400">
                  <span>Discount:</span>
                  <span className="font-mono">-{formatCurrency(selectedSale.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold pt-1 border-t border-border">
                <span>Total Amount:</span>
                <span className="font-mono text-emerald-400">{formatCurrency(selectedSale.totalAmount)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={() => window.print()} className="gap-1.5 bg-indigo-600 text-white">
                <Printer className="h-4 w-4" /> Print Receipt
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {selectedSale && showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-[#111827] p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-foreground">
              Process Sales Return: {selectedSale.invoiceNumber}
            </h3>
            <p className="text-xs text-muted-foreground">
              Total refund amount: <span className="font-bold text-foreground font-mono">{formatCurrency(selectedSale.totalAmount)}</span>
            </p>

            <form onSubmit={handleReturnSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Return Reason *</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="Customer Change of Mind / Unopened">Customer Change of Mind / Unopened</option>
                  <option value="Prescription Changed by Physician">Prescription Changed by Physician</option>
                  <option value="Defective / Damaged Package">Defective / Damaged Package</option>
                  <option value="Short Expiry Reported by Customer">Short Expiry Reported by Customer</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Stock Disposition *</label>
                <select
                  value={returnDisposition}
                  onChange={(e) => setReturnDisposition(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="RESTOCK">Restock into Sellable Inventory (Inspected & Good)</option>
                  <option value="DISCARD">Discard / Isolate (Unsellable, broken, or contaminated)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <Button variant="outline" size="sm" onClick={() => setShowReturnModal(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-500 text-white"
                  isLoading={isProcessingReturn}
                >
                  Authorize & Process Refund
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
