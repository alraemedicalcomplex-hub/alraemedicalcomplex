"use client";

import React, { useState, useEffect } from "react";
import {
  PackagePlus,
  Plus,
  Truck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Eye,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

interface PurchaseRecord {
  id: string;
  purchaseOrderNo: string;
  supplierInvoiceNo?: string | null;
  totalCost: number;
  netAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  supplier: { id: string; name: string; phone: string };
  createdBy?: { fullName: string };
  items: any[];
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New PO Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState("");
  const [poNotes, setPoNotes] = useState("");
  const [items, setItems] = useState<any[]>([
    {
      medicineId: "",
      batchNumber: "",
      expiryDate: "",
      quantity: "50",
      bonusQuantity: "0",
      unitCost: "",
      tradePrice: "",
      retailPrice: "",
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchPurchases = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/purchases");
      const data = await res.json();
      if (data.purchases) setPurchases(data.purchases);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [supRes, medRes] = await Promise.all([
        fetch("/api/suppliers"),
        fetch("/api/medicines?limit=100"),
      ]);
      const supData = await supRes.json();
      const medData = await medRes.json();

      if (supData.suppliers) {
        setSuppliers(supData.suppliers);
        if (supData.suppliers.length > 0) setSelectedSupplierId(supData.suppliers[0].id);
      }
      if (medData.items) {
        setMedicines(medData.items);
        if (medData.items.length > 0) {
          setItems([
            {
              medicineId: medData.items[0].id,
              batchNumber: `BTH-${Date.now().toString().slice(-4)}`,
              expiryDate: "2028-12-31",
              quantity: "50",
              bonusQuantity: "0",
              unitCost: "650",
              tradePrice: "720",
              retailPrice: "800",
            },
          ]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPurchases();
    fetchMetadata();
  }, []);

  const handleReceiveGoods = async (purchaseId: string) => {
    if (!confirm("Are you sure you want to receive these goods into inventory? Stock will automatically increase.")) return;

    try {
      const res = await fetch("/api/purchases/receive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchaseId }),
      });

      if (res.ok) {
        fetchPurchases();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to receive goods");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError("");

    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: selectedSupplierId,
          supplierInvoiceNo,
          notes: poNotes,
          items,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to create PO");
        setIsSubmitting(false);
        return;
      }

      setShowAddModal(false);
      fetchPurchases();
    } catch {
      setFormError("Server error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <PackagePlus className="h-6 w-6 text-indigo-500" />
            Purchase Orders & Goods Receiving (GRN)
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Procurement tracking, supplier batch intake, trade pricing, and accounts payable ledger
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 text-xs shadow-md shadow-indigo-600/20"
        >
          <Plus className="h-4 w-4" />
          <span>Create Purchase Order</span>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">Order Date</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Supplier Invoice #</th>
                  <th className="py-3 px-4 text-center">Items</th>
                  <th className="py-3 px-4 text-right">Order Amount</th>
                  <th className="py-3 px-4">Receipt Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      Loading purchase orders...
                    </td>
                  </tr>
                ) : purchases.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      No purchase orders found.
                    </td>
                  </tr>
                ) : (
                  purchases.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">
                        {p.purchaseOrderNo}
                      </td>

                      <td className="py-3.5 px-4 text-muted-foreground">
                        {formatDate(p.createdAt)}
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-foreground">{p.supplier.name}</p>
                        <p className="text-[10px] text-muted-foreground">{p.supplier.phone}</p>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-muted-foreground">
                        {p.supplierInvoiceNo || "Pending"}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono">
                        {p.items.length} lines
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-sm font-bold text-foreground">
                        {formatCurrency(p.netAmount)}
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge
                          variant={p.status === "RECEIVED" ? "success" : "warning"}
                          className="text-[10px]"
                        >
                          {p.status}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {p.status !== "RECEIVED" ? (
                          <Button
                            size="sm"
                            className="h-7 px-2 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                            onClick={() => handleReceiveGoods(p.id)}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Receive Stock
                          </Button>
                        ) : (
                          <span className="text-[11px] text-emerald-400 font-medium">
                            Stock Restocked
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal: Create Purchase Order */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-[#111827] p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Create Purchase Order</h3>
            <p className="text-xs text-muted-foreground">
              Select supplier and input medicine batches to procure
            </p>

            {formError && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-2.5 text-xs text-red-400">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreatePO} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Supplier *</label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (Bal: Rs.{Number(s.balance).toFixed(0)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Supplier Billed Invoice #</label>
                  <Input
                    placeholder="e.g. INV-SUP-891"
                    value={supplierInvoiceNo}
                    onChange={(e) => setSupplierInvoiceNo(e.target.value)}
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300 block">Ordered Medicines</label>
                {items.map((it, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-border bg-card/60 space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-0.5">Medicine *</label>
                        <select
                          value={it.medicineId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setItems((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, medicineId: val } : item))
                            );
                          }}
                          className="flex h-8 w-full rounded border border-input bg-card px-2 text-xs text-foreground"
                          required
                        >
                          {medicines.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-0.5">Batch / Lot # *</label>
                        <Input
                          value={it.batchNumber}
                          onChange={(e) => {
                            const val = e.target.value;
                            setItems((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, batchNumber: val } : item))
                            );
                          }}
                          className="h-8 text-xs font-mono"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-0.5">Expiry Date *</label>
                        <Input
                          type="date"
                          value={it.expiryDate}
                          onChange={(e) => {
                            const val = e.target.value;
                            setItems((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, expiryDate: val } : item))
                            );
                          }}
                          className="h-8 text-xs"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-0.5">Quantity</label>
                        <Input
                          type="number"
                          value={it.quantity}
                          onChange={(e) => {
                            const val = e.target.value;
                            setItems((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, quantity: val } : item))
                            );
                          }}
                          className="h-8 text-xs font-mono"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-0.5">Bonus Free Qty</label>
                        <Input
                          type="number"
                          value={it.bonusQuantity}
                          onChange={(e) => {
                            const val = e.target.value;
                            setItems((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, bonusQuantity: val } : item))
                            );
                          }}
                          className="h-8 text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-0.5">Purchase Cost (PKR)</label>
                        <Input
                          type="number"
                          value={it.unitCost}
                          onChange={(e) => {
                            const val = e.target.value;
                            setItems((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, unitCost: val } : item))
                            );
                          }}
                          className="h-8 text-xs font-mono"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-0.5">Trade Price (PKR)</label>
                        <Input
                          type="number"
                          value={it.tradePrice}
                          onChange={(e) => {
                            const val = e.target.value;
                            setItems((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, tradePrice: val } : item))
                            );
                          }}
                          className="h-8 text-xs font-mono"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-0.5">Retail MRP (PKR)</label>
                        <Input
                          type="number"
                          value={it.retailPrice}
                          onChange={(e) => {
                            const val = e.target.value;
                            setItems((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, retailPrice: val } : item))
                            );
                          }}
                          className="h-8 text-xs font-mono"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <Button variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white"
                  isLoading={isSubmitting}
                >
                  Generate Purchase Order
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
