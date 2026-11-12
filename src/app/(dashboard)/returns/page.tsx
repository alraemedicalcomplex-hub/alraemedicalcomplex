"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Undo2,
  Plus,
  Search,
  Receipt,
  RotateCcw,
  Trash2,
  Boxes,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Calendar,
  User,
  Pill,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ReturnItem {
  id: string;
  returnNo: string;
  reason: string;
  refundAmount: number;
  createdAt: string;
  sale: {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    customer?: { name: string; phone: string } | null;
    cashier?: { fullName: string } | null;
  };
  items: {
    id: string;
    quantity: number;
    disposition: "RESTOCK" | "DISCARD" | "QUARANTINE";
    refundAmount: number;
    saleItem: {
      medicine: {
        name: string;
        strength: string;
        dosageForm: string;
      };
    };
  }[];
}

export default function SalesReturnsPage() {
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dispositionFilter, setDispositionFilter] = useState<string>("ALL");

  // New Return Modal State
  const [showNewReturnModal, setShowNewReturnModal] = useState(false);
  const [invoiceLookup, setInvoiceLookup] = useState("");
  const [lookupSale, setLookupSale] = useState<any | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [returnReason, setReturnReason] = useState("Customer requested return");
  const [selectedDisposition, setSelectedDisposition] = useState<"RESTOCK" | "DISCARD">("RESTOCK");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchReturns = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/sales/returns?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.returns) setReturns(data.returns);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReturns();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLookupInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceLookup.trim()) return;
    setIsLookingUp(true);
    setLookupError("");
    setLookupSale(null);

    try {
      const res = await fetch(`/api/sales?q=${encodeURIComponent(invoiceLookup.trim())}`);
      const data = await res.json();
      if (data.sales && data.sales.length > 0) {
        const match = data.sales.find(
          (s: any) => s.invoiceNumber.toLowerCase() === invoiceLookup.trim().toLowerCase()
        ) || data.sales[0];
        setLookupSale(match);
      } else {
        setLookupError("No sales invoice found with this number.");
      }
    } catch {
      setLookupError("Error querying invoice.");
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleProcessReturn = async () => {
    if (!lookupSale) return;
    setIsSubmitting(true);

    try {
      const itemsPayload = lookupSale.items.map((it: any) => ({
        saleItemId: it.id,
        quantity: it.quantity,
        disposition: selectedDisposition,
        refundAmount: Number(it.totalPrice),
      }));

      const res = await fetch("/api/sales/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saleId: lookupSale.id,
          reason: returnReason,
          refundAmount: Number(lookupSale.totalAmount),
          items: itemsPayload,
        }),
      });

      if (res.ok) {
        setShowNewReturnModal(false);
        setLookupSale(null);
        setInvoiceLookup("");
        fetchReturns();
      } else {
        const d = await res.json();
        setLookupError(d.error || "Failed to process return.");
      }
    } catch {
      setLookupError("Server error processing return.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Metrics
  const totalRefundAmount = returns.reduce((acc, r) => acc + Number(r.refundAmount || 0), 0);
  const restockedUnits = returns.reduce((acc, r) => {
    return (
      acc +
      r.items
        .filter((it) => it.disposition === "RESTOCK")
        .reduce((sum, it) => sum + it.quantity, 0)
    );
  }, 0);
  const discardedUnits = returns.reduce((acc, r) => {
    return (
      acc +
      r.items
        .filter((it) => it.disposition !== "RESTOCK")
        .reduce((sum, it) => sum + it.quantity, 0)
    );
  }, 0);

  const filteredReturns = returns.filter((r) => {
    if (dispositionFilter === "ALL") return true;
    return r.items.some((it) => it.disposition === dispositionFilter);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Undo2 className="h-6 w-6 text-amber-500" />
            Customer Sales Returns & Refund Ledger
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit trail of patient returns, shelf restocking vs damaged stock quarantine, and cash refunds
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/sales">
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              <Receipt className="h-4 w-4 text-indigo-400" />
              <span>View All Sales</span>
            </Button>
          </Link>

          <Button
            size="sm"
            onClick={() => setShowNewReturnModal(true)}
            className="bg-amber-600 hover:bg-amber-500 text-white gap-1.5 text-xs shadow-md shadow-amber-600/20"
          >
            <Plus className="h-4 w-4" />
            <span>Process Sales Return</span>
          </Button>
        </div>
      </div>

      {/* Top Unified Summary Ribbon */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border/60">
          <div className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Total Returns Filed
              </span>
              <h3 className="text-2xl font-bold text-foreground font-mono">{returns.length}</h3>
              <p className="text-[11px] text-muted-foreground">Reversal vouchers logged</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Undo2 className="h-4 w-4" />
            </div>
          </div>

          <div className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Total Cash Refunded
              </span>
              <h3 className="text-2xl font-bold text-rose-400 font-mono">
                {formatCurrency(totalRefundAmount)}
              </h3>
              <p className="text-[11px] text-muted-foreground">Disbursed to patients</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>

          <div className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Restocked To Inventory
              </span>
              <h3 className="text-2xl font-bold text-emerald-400 font-mono">{restockedUnits} Units</h3>
              <p className="text-[11px] text-muted-foreground">Returned safely to batches</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Boxes className="h-4 w-4" />
            </div>
          </div>

          <div className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Discarded / Damaged
              </span>
              <h3 className="text-2xl font-bold text-slate-300 font-mono">{discardedUnits} Units</h3>
              <p className="text-[11px] text-muted-foreground">Quarantined or written off</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-slate-500/10 text-slate-400 flex items-center justify-center">
              <Trash2 className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <Card className="p-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:max-w-md">
            <Input
              placeholder="Search by Return # (RET-...), Invoice # (INV-...), or Patient Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto ml-auto">
            {["ALL", "RESTOCK", "DISCARD"].map((disp) => (
              <button
                key={disp}
                onClick={() => setDispositionFilter(disp)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  dispositionFilter === disp
                    ? "bg-amber-600 text-white shadow-sm"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted"
                }`}
              >
                {disp === "ALL" ? "All Dispositions" : disp === "RESTOCK" ? "Restocked" : "Discarded"}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Enterprise Full-Width Returns Data Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                  <th className="py-3 px-4">Return # & Date</th>
                  <th className="py-3 px-4">Original Invoice</th>
                  <th className="py-3 px-4">Patient & Cashier</th>
                  <th className="py-3 px-4">Returned Medicines</th>
                  <th className="py-3 px-4 text-center">Disposition</th>
                  <th className="py-3 px-4 text-right">Refund Amount</th>
                  <th className="py-3 px-4">Return Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      Loading sales return transactions...
                    </td>
                  </tr>
                ) : filteredReturns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      {searchQuery
                        ? "No returns match your search query."
                        : "No sales return records logged yet. Click 'Process Sales Return' to reverse an invoice."}
                    </td>
                  </tr>
                ) : (
                  filteredReturns.map((ret) => (
                    <tr key={ret.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-amber-400 text-xs">
                          {ret.returnNo}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(ret.createdAt, true)}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-medium text-indigo-400">
                        {ret.sale?.invoiceNumber || "INV-REFERENCE"}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-foreground">
                          {ret.sale?.customer ? ret.sale.customer.name : "Walk-in Patient"}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Cashier: {ret.sale?.cashier?.fullName || "Staff"}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-[320px]">
                        <div className="space-y-1">
                          {ret.items.map((it) => (
                            <div key={it.id} className="flex items-center gap-2">
                              <Pill className="h-3 w-3 text-amber-400 shrink-0" />
                              <span className="font-medium text-foreground">
                                {it.saleItem?.medicine?.name}
                              </span>
                              <span className="font-mono text-muted-foreground">
                                ({it.quantity}x)
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {ret.items.some((i) => i.disposition === "RESTOCK") ? (
                          <Badge variant="success" className="text-[10px]">
                            RESTOCKED
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[10px]">
                            DISCARDED
                          </Badge>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-bold text-sm text-rose-400">
                          {formatCurrency(ret.refundAmount)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-muted-foreground max-w-[200px] truncate">
                        {ret.reason}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal: Process Sales Return */}
      <Modal
        isOpen={showNewReturnModal}
        onClose={() => {
          setShowNewReturnModal(false);
          setLookupSale(null);
          setInvoiceLookup("");
          setLookupError("");
        }}
        title={
          <span className="flex items-center gap-2">
            <Undo2 className="h-5 w-5 text-amber-500" />
            Process Sales Return & Refund
          </span>
        }
        maxWidth="max-w-lg"
      >
        {lookupError && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-2.5 text-xs text-red-400 mb-4">
            {lookupError}
          </div>
        )}

        {/* Step 1: Lookup Invoice */}
        {!lookupSale ? (
          <form onSubmit={handleLookupInvoice} className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Enter the original customer invoice number printed on the receipt to locate sale items.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Invoice Number *</label>
              <Input
                placeholder="e.g. INV-2026-00001"
                value={invoiceLookup}
                onChange={(e) => setInvoiceLookup(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowNewReturnModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-amber-600 hover:bg-amber-500 text-white"
                isLoading={isLookingUp}
              >
                Find Invoice
              </Button>
            </div>
          </form>
        ) : (
          /* Step 2: Confirm Items & Disposition */
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-muted/30 border border-border/80 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice:</span>
                <span className="font-mono font-bold text-indigo-400">{lookupSale.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Patient:</span>
                <span className="font-semibold text-foreground">
                  {lookupSale.customer?.name || "Walk-in Patient"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Original Total:</span>
                <span className="font-mono font-bold text-foreground">
                  {formatCurrency(lookupSale.totalAmount)}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Physical Stock Disposition *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDisposition("RESTOCK")}
                  className={`p-2.5 rounded-lg border text-left text-xs transition ${
                    selectedDisposition === "RESTOCK"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 font-semibold"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Boxes className="h-4 w-4 mb-1 text-emerald-400" />
                  <div>Restock to Shelves</div>
                  <span className="text-[10px] font-normal opacity-80">Unopened & unexpired</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDisposition("DISCARD")}
                  className={`p-2.5 rounded-lg border text-left text-xs transition ${
                    selectedDisposition === "DISCARD"
                      ? "border-red-500 bg-red-500/10 text-red-400 font-semibold"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Trash2 className="h-4 w-4 mb-1 text-red-400" />
                  <div>Discard / Damaged</div>
                  <span className="text-[10px] font-normal opacity-80">Seal broken or unusable</span>
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Reason for Return *</label>
              <Input
                placeholder="e.g. Wrong dosage dispensed, customer change of mind..."
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLookupSale(null)}
              >
                Change Invoice
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewReturnModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleProcessReturn}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white"
                  isLoading={isSubmitting}
                >
                  Confirm Return & Refund ({formatCurrency(lookupSale.totalAmount)})
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
