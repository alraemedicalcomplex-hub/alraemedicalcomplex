"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Boxes,
  Plus,
  AlertTriangle,
  ClockAlert,
  ArrowUpDown,
  History,
  ShieldAlert,
  CheckCircle2,
  Filter,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

interface BatchItem {
  id: string;
  batchNumber: string;
  expiryDate: string;
  manufacturingDate?: string | null;
  purchaseCost: number;
  tradePrice: number;
  retailPrice: number;
  quantity: number;
  status: string;
  quarantineReason?: string | null;
  medicine: {
    id: string;
    name: string;
    genericName: string;
    strength: string;
    dosageForm: string;
    unitOfMeasure: string;
    category: { name: string };
    manufacturer: { name: string };
  };
}

function InventoryContent() {
  const searchParams = useSearchParams();
  const filterMedicineId = searchParams.get("medicineId") || "";
  const filterStatus = searchParams.get("status") || "";

  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [medicines, setMedicines] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter State
  const [selectedMedicine, setSelectedMedicine] = useState(filterMedicineId);
  const [selectedStatus, setSelectedStatus] = useState(filterStatus);

  // Adjust Modal
  const [adjustBatch, setAdjustBatch] = useState<BatchItem | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<string>("");
  const [adjustType, setAdjustType] = useState<string>("ADJUSTMENT_AUDIT");
  const [adjustReason, setAdjustReason] = useState<string>("");
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState("");

  // New Batch Modal
  const [showAddBatchModal, setShowAddBatchModal] = useState(false);
  const [newMedicineId, setNewMedicineId] = useState("");
  const [newBatchNumber, setNewBatchNumber] = useState("");
  const [newExpiry, setNewExpiry] = useState("");
  const [newMfgDate, setNewMfgDate] = useState("");
  const [newCost, setNewCost] = useState("");
  const [newTrade, setNewTrade] = useState("");
  const [newRetail, setNewRetail] = useState("");
  const [newQty, setNewQty] = useState("");
  const [addBatchError, setAddBatchError] = useState("");
  const [isAddingBatch, setIsAddingBatch] = useState(false);

  const fetchBatches = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedMedicine) params.set("medicineId", selectedMedicine);
      if (selectedStatus) params.set("status", selectedStatus);

      const res = await fetch(`/api/inventory/batches?${params.toString()}`);
      const data = await res.json();
      if (data.batches) setBatches(data.batches);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMedicineOptions = async () => {
    try {
      const res = await fetch("/api/medicines?limit=100");
      const data = await res.json();
      if (data.items) {
        setMedicines(data.items.map((m: any) => ({ id: m.id, name: m.name })));
        if (data.items.length > 0 && !newMedicineId) {
          setNewMedicineId(data.items[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMedicineOptions();
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [selectedMedicine, selectedStatus]);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustBatch) return;

    setIsAdjusting(true);
    setAdjustError("");

    try {
      const delta = parseInt(adjustDelta, 10);
      if (isNaN(delta) || delta === 0) {
        setAdjustError("Please specify a valid non-zero adjustment quantity");
        setIsAdjusting(false);
        return;
      }

      const res = await fetch("/api/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId: adjustBatch.id,
          quantityDelta: delta,
          type: adjustType,
          reason: adjustReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAdjustError(data.error || "Adjustment failed");
        setIsAdjusting(false);
        return;
      }

      setAdjustBatch(null);
      setAdjustDelta("");
      setAdjustReason("");
      fetchBatches();
    } catch {
      setAdjustError("Server connection error");
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleQuarantine = async (batchId: string) => {
    if (!confirm("Are you sure you want to quarantine this batch? It will be blocked from sale.")) return;

    try {
      const res = await fetch("/api/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId,
          action: "QUARANTINE",
          reason: "Pharmacist safety quarantine",
        }),
      });

      if (res.ok) {
        fetchBatches();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingBatch(true);
    setAddBatchError("");

    try {
      const res = await fetch("/api/inventory/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicineId: newMedicineId,
          batchNumber: newBatchNumber,
          expiryDate: newExpiry,
          manufacturingDate: newMfgDate || undefined,
          purchaseCost: parseFloat(newCost),
          tradePrice: parseFloat(newTrade),
          retailPrice: parseFloat(newRetail),
          quantity: parseInt(newQty, 10),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAddBatchError(data.error || "Failed to create batch");
        setIsAddingBatch(false);
        return;
      }

      setShowAddBatchModal(false);
      setNewBatchNumber("");
      setNewCost("");
      setNewTrade("");
      setNewRetail("");
      setNewQty("");
      fetchBatches();
    } catch {
      setAddBatchError("Server communication error");
    } finally {
      setIsAddingBatch(false);
    }
  };

  const getExpiryBadge = (expiryStr: string) => {
    const expiry = new Date(expiryStr);
    const now = new Date();
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24));

    if (diffDays <= 0) {
      return <Badge variant="destructive">EXPIRED</Badge>;
    }
    if (diffDays <= 30) {
      return <Badge variant="destructive">{diffDays}d left</Badge>;
    }
    if (diffDays <= 90) {
      return <Badge variant="warning">{diffDays}d left</Badge>;
    }
    return <Badge variant="success">{diffDays}d left</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Boxes className="h-6 w-6 text-indigo-500" />
            Inventory & FEFO Batch Engine
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Strict First-Expiry-First-Out batch tracking, physical stock reconciliation, and quarantine control
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            onClick={() => setShowAddBatchModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 text-xs shadow-md shadow-indigo-600/20"
          >
            <Plus className="h-4 w-4" />
            <span>Intake New Batch</span>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Filter by Medicine</label>
            <select
              value={selectedMedicine}
              onChange={(e) => setSelectedMedicine(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">All Medicines ({medicines.length})</option>
              {medicines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Batch Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="QUARANTINED">Quarantined</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedMedicine("");
                setSelectedStatus("");
              }}
              className="h-10 text-xs w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Batches Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                  <th className="py-3 px-4">Medicine & Manufacturer</th>
                  <th className="py-3 px-4">Batch Number</th>
                  <th className="py-3 px-4">Expiry Date (FEFO)</th>
                  <th className="py-3 px-4 text-right">Available Qty</th>
                  <th className="py-3 px-4 text-right">Cost (PKR)</th>
                  <th className="py-3 px-4 text-right">Trade (PKR)</th>
                  <th className="py-3 px-4 text-right">MRP (PKR)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-muted-foreground">
                      Loading inventory batches...
                    </td>
                  </tr>
                ) : batches.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-muted-foreground">
                      No inventory batches found matching criteria.
                    </td>
                  </tr>
                ) : (
                  batches.map((b) => (
                    <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-foreground text-sm">{b.medicine.name}</p>
                        <p className="text-muted-foreground text-[11px]">
                          {b.medicine.manufacturer.name} • {b.medicine.strength}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold text-indigo-400">
                        {b.batchNumber}
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex items-center gap-2">
                          <span className="text-foreground">{formatDate(b.expiryDate)}</span>
                          {getExpiryBadge(b.expiryDate)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-sm font-bold text-foreground">
                        {b.quantity} {b.medicine.unitOfMeasure}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-muted-foreground">
                        {formatCurrency(b.purchaseCost)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-muted-foreground">
                        {formatCurrency(b.tradePrice)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-foreground">
                        {formatCurrency(b.retailPrice)}
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            b.status === "ACTIVE"
                              ? "success"
                              : b.status === "QUARANTINED"
                              ? "destructive"
                              : b.status === "LOW_STOCK"
                              ? "warning"
                              : "destructive"
                          }
                          className="text-[10px]"
                        >
                          {b.status}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => setAdjustBatch(b)}
                          >
                            <ArrowUpDown className="h-3 w-3 mr-1" />
                            Adjust
                          </Button>

                          {b.status !== "QUARANTINED" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                              onClick={() => handleQuarantine(b.id)}
                            >
                              <ShieldAlert className="h-3 w-3 mr-1" />
                              Quarantine
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

      {/* Modal: Adjust Stock */}
      {adjustBatch && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6 text-center">
            <div className="w-full max-w-lg rounded-2xl border border-border bg-[#111827] p-6 sm:p-8 text-left shadow-2xl space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-border/80">
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    Adjust Stock: {adjustBatch.medicine.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Batch: <span className="font-mono text-indigo-400">{adjustBatch.batchNumber}</span> • Current: <span className="font-bold text-foreground">{adjustBatch.quantity}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAdjustBatch(null)}
                  className="h-8 w-8 rounded-lg border border-border bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition shrink-0 ml-4"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {adjustError && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-2.5 text-xs text-red-400">
                  {adjustError}
                </div>
              )}

              <form onSubmit={handleAdjustSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">
                    Adjustment Delta (Signed Integer) *
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g. -5 (for breakage) or +10 (for found stock)"
                    value={adjustDelta}
                    onChange={(e) => setAdjustDelta(e.target.value)}
                    required
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Use negative numbers (e.g. -2) to deduct damaged/expired stock, positive (+5) to add.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Reason Category *</label>
                  <select
                    value={adjustType}
                    onChange={(e) => setAdjustType(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="ADJUSTMENT_AUDIT">Physical Stock Recount Reconciliation</option>
                    <option value="ADJUSTMENT_DAMAGE">Damaged / Broken Packaging</option>
                    <option value="ADJUSTMENT_EXPIRED">Expired Stock Isolation</option>
                    <option value="DISPOSAL">Controlled Medical Waste Disposal</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Audit Notes *</label>
                  <Input
                    placeholder="Explain why this adjustment is authorized..."
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAdjustBatch(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white"
                    isLoading={isAdjusting}
                  >
                    Commit Adjustment
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Intake New Batch */}
      {showAddBatchModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6 text-center">
            <div className="w-full max-w-lg rounded-2xl border border-border bg-[#111827] p-6 sm:p-8 text-left shadow-2xl space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-border/80">
                <div>
                  <h3 className="text-xl font-bold text-foreground">Intake New Medicine Batch</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Add individual batch with manufacturing and expiration details
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddBatchModal(false)}
                  className="h-8 w-8 rounded-lg border border-border bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition shrink-0 ml-4"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {addBatchError && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-2.5 text-xs text-red-400">
                  {addBatchError}
                </div>
              )}

              <form onSubmit={handleAddBatch} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Select Medicine *</label>
                  <select
                    value={newMedicineId}
                    onChange={(e) => setNewMedicineId(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  >
                    {medicines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Batch / Lot Number *</label>
                    <Input
                      placeholder="e.g. BTH-2026-90"
                      value={newBatchNumber}
                      onChange={(e) => setNewBatchNumber(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Expiry Date *</label>
                    <Input
                      type="date"
                      value={newExpiry}
                      onChange={(e) => setNewExpiry(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Purchase Cost (PKR) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="650"
                      value={newCost}
                      onChange={(e) => setNewCost(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Trade Price (PKR) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="720"
                      value={newTrade}
                      onChange={(e) => setNewTrade(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Retail / MRP (PKR) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="800"
                      value={newRetail}
                      onChange={(e) => setNewRetail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Opening Quantity *</label>
                  <Input
                    type="number"
                    placeholder="50"
                    value={newQty}
                    onChange={(e) => setNewQty(e.target.value)}
                    min="0"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddBatchModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white"
                    isLoading={isAddingBatch}
                  >
                    Save Batch
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading inventory engine...</div>}>
      <InventoryContent />
    </Suspense>
  );
}
