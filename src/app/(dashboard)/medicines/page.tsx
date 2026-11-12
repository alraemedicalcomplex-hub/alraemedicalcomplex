"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  Pill,
  Search,
  Plus,
  FileSpreadsheet,
  Upload,
  AlertTriangle,
  Barcode,
  Eye,
  CheckCircle2,
  XCircle,
  Filter,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

interface MedicineItem {
  id: string;
  name: string;
  genericName: string;
  dosageForm: string;
  strength: string;
  packSize: number;
  unitOfMeasure: string;
  barcode: string | null;
  sku: string | null;
  drapRegNo: string | null;
  prescriptionRequired: boolean;
  totalStock: number;
  earliestExpiry: string | null;
  currentPrice: number;
  minStockLevel: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
  category: { id: string; name: string };
  manufacturer: { id: string; name: string };
}

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState<MedicineItem[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [manufacturers, setManufacturers] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedManufacturer, setSelectedManufacturer] = useState("");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formGeneric, setFormGeneric] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formManufacturer, setFormManufacturer] = useState("");
  const [formStrength, setFormStrength] = useState("500mg");
  const [formDosage, setFormDosage] = useState("TABLET");
  const [formPackSize, setFormPackSize] = useState("1");
  const [formBarcode, setFormBarcode] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formDrap, setFormDrap] = useState("");
  const [formMinStock, setFormMinStock] = useState("15");
  const [formRx, setFormRx] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMetadata = async () => {
    try {
      const res = await fetch("/api/medicines/metadata");
      const data = await res.json();
      if (data.categories) setCategories(data.categories);
      if (data.manufacturers) setManufacturers(data.manufacturers);
      if (data.categories?.length > 0) setFormCategory(data.categories[0].id);
      if (data.manufacturers?.length > 0) setFormManufacturer(data.manufacturers[0].id);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMedicines = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("query", searchQuery);
      if (selectedCategory) params.set("categoryId", selectedCategory);
      if (selectedManufacturer) params.set("manufacturerId", selectedManufacturer);

      const res = await fetch(`/api/medicines?${params.toString()}`);
      const data = await res.json();
      if (data.items) {
        setMedicines(data.items);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMedicines();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, selectedManufacturer]);

  const handleCreateMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError("");

    try {
      const payload = {
        name: formName,
        genericName: formGeneric,
        categoryId: formCategory,
        manufacturerId: formManufacturer,
        dosageForm: formDosage,
        strength: formStrength,
        packSize: parseInt(formPackSize, 10) || 1,
        barcode: formBarcode || undefined,
        sku: formSku || undefined,
        drapRegNo: formDrap || undefined,
        minStockLevel: parseInt(formMinStock, 10) || 10,
        prescriptionRequired: formRx,
        storageCondition: "ROOM_TEMPERATURE",
      };

      const res = await fetch("/api/medicines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to create medicine");
        setIsSubmitting(false);
        return;
      }

      setShowAddModal(false);
      resetForm();
      fetchMedicines();
    } catch {
      setFormError("Server error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormGeneric("");
    setFormStrength("500mg");
    setFormBarcode("");
    setFormSku("");
    setFormDrap("");
    setFormRx(false);
  };

  const handleCSVImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportStatus("Importing...");

    try {
      const res = await fetch("/api/medicines/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvData: csvText }),
      });

      const data = await res.json();
      if (!res.ok) {
        setImportStatus(`Error: ${data.error}`);
        return;
      }

      setImportStatus(
        `Successfully imported ${data.importedCount} medicines. ${
          data.errors?.length > 0 ? `(${data.errors.length} skipped)` : ""
        }`
      );
      fetchMedicines();
      setTimeout(() => {
        setShowImportModal(false);
        setImportStatus(null);
        setCsvText("");
      }, 2000);
    } catch {
      setImportStatus("Failed to process CSV import");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Pill className="h-6 w-6 text-indigo-500" />
            Medicine Catalog & Formulary
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            DRAP-registered pharmaceutical products, generic formulas, and stock thresholds
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a href="/api/medicines/export" download>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
              <span>Export Excel</span>
            </Button>
          </a>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImportModal(true)}
            className="gap-1.5 text-xs"
          >
            <Upload className="h-4 w-4 text-indigo-400" />
            <span>Import CSV</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 text-xs shadow-md shadow-indigo-600/20"
          >
            <Plus className="h-4 w-4" />
            <span>Add Medicine</span>
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <Input
              placeholder="Search by Brand Name, Generic Formula, Barcode, or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedManufacturer}
              onChange={(e) => setSelectedManufacturer(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">All Manufacturers</option>
              {manufacturers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Catalog Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                  <th className="py-3 px-4">Medicine & Generic Formula</th>
                  <th className="py-3 px-4">Manufacturer & Category</th>
                  <th className="py-3 px-4">Dosage & Strength</th>
                  <th className="py-3 px-4">Barcode / DRAP</th>
                  <th className="py-3 px-4 text-right">Available Stock</th>
                  <th className="py-3 px-4">Earliest Expiry</th>
                  <th className="py-3 px-4 text-right">MRP (PKR)</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      Loading medicine catalog...
                    </td>
                  </tr>
                ) : medicines.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      No medicines matched the filter criteria.
                    </td>
                  </tr>
                ) : (
                  medicines.map((med) => (
                    <tr
                      key={med.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground text-sm">{med.name}</span>
                          {med.prescriptionRequired && (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[10px] font-semibold text-rose-300 shadow-sm leading-none whitespace-nowrap">
                              <span className="font-extrabold text-rose-200">Rx</span>
                              <span className="font-mono text-[9px] text-rose-400">Sched D</span>
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground text-[11px] mt-0.5">
                          {med.genericName}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-medium text-foreground">{med.manufacturer.name}</p>
                        <p className="text-muted-foreground text-[11px]">{med.category.name}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-medium text-foreground">{med.strength}</span>
                        <p className="text-muted-foreground text-[11px]">
                          {med.dosageForm} ({med.packSize} / {med.unitOfMeasure})
                        </p>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        {med.barcode ? (
                          <div className="flex items-center gap-1 text-indigo-400">
                            <Barcode className="h-3.5 w-3.5 shrink-0" />
                            <span>{med.barcode}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No Barcode</span>
                        )}
                        <p className="text-muted-foreground text-[10px]">
                          {med.drapRegNo ? `DRAP: ${med.drapRegNo}` : "DRAP Pending"}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="font-mono text-sm font-bold text-foreground">
                          {med.totalStock}
                        </div>
                        {med.isOutOfStock ? (
                          <Badge variant="destructive" className="text-[10px] py-0 px-1">
                            Out of Stock
                          </Badge>
                        ) : med.isLowStock ? (
                          <Badge variant="warning" className="text-[10px] py-0 px-1">
                            Low Stock (≤{med.minStockLevel})
                          </Badge>
                        ) : (
                          <Badge variant="success" className="text-[10px] py-0 px-1">
                            In Stock
                          </Badge>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-xs">
                        {med.earliestExpiry ? (
                          <span className="text-foreground">
                            {formatDate(med.earliestExpiry)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-xs font-bold text-foreground">
                        {med.currentPrice > 0 ? formatCurrency(med.currentPrice) : "Not Set"}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <Link href={`/inventory?medicineId=${med.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-indigo-400 hover:text-indigo-300">
                            <Eye className="h-4 w-4 mr-1" />
                            <span>Batches</span>
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal: Add New Medicine */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6 text-center">
            <div className="w-full max-w-2xl rounded-2xl border border-border bg-[#111827] p-6 sm:p-8 text-left shadow-2xl">
              <div className="flex items-start justify-between pb-4 mb-6 border-b border-border/80">
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    Add New Medicine Master Record
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter pharmaceutical details, generic formula, and DRAP classification
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="h-8 w-8 rounded-lg border border-border bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition shrink-0 ml-4"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

            {formError && (
              <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-400">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateMedicine} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Commercial Brand Name *</label>
                  <Input
                    placeholder="e.g. Panadol Forte"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Generic Formula (API) *</label>
                  <Input
                    placeholder="e.g. Paracetamol"
                    value={formGeneric}
                    onChange={(e) => setFormGeneric(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Manufacturer *</label>
                  <select
                    value={formManufacturer}
                    onChange={(e) => setFormManufacturer(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  >
                    {manufacturers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Strength *</label>
                  <Input
                    placeholder="e.g. 500mg"
                    value={formStrength}
                    onChange={(e) => setFormStrength(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Dosage Form</label>
                  <select
                    value={formDosage}
                    onChange={(e) => setFormDosage(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="TABLET">Tablet</option>
                    <option value="CAPSULE">Capsule</option>
                    <option value="SYRUP">Syrup</option>
                    <option value="SUSPENSION">Suspension</option>
                    <option value="INJECTION">Injection</option>
                    <option value="OINTMENT">Ointment</option>
                    <option value="CREAM">Cream</option>
                    <option value="DROPS">Drops</option>
                    <option value="INHALER">Inhaler</option>
                    <option value="DEVICE">Medical Device</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Pack Size</label>
                  <Input
                    type="number"
                    value={formPackSize}
                    onChange={(e) => setFormPackSize(e.target.value)}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Barcode (EAN-13)</label>
                  <Input
                    placeholder="8964000..."
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Internal SKU</label>
                  <Input
                    placeholder="PAN-500"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">DRAP Reg No</label>
                  <Input
                    placeholder="001294"
                    value={formDrap}
                    onChange={(e) => setFormDrap(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/60">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-foreground">
                    Prescription Required (Schedule D / Controlled)
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Enforces pharmacist verification and doctor PMDC verification at checkout
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formRx}
                  onChange={(e) => setFormRx(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-indigo-600 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white"
                  isLoading={isSubmitting}
                >
                  Save Medicine
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
      )}

      {/* Modal: Bulk CSV Import */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6 text-center">
            <div className="w-full max-w-xl rounded-2xl border border-border bg-[#111827] p-6 sm:p-8 text-left shadow-2xl space-y-4">
              <div className="flex items-start justify-between pb-4 border-b border-border/80">
                <div>
                  <h3 className="text-xl font-bold text-foreground">Bulk CSV Medicine Import</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Paste standard CSV rows with columns: <code>name,genericName,category,manufacturer,strength,dosageForm,barcode</code>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="h-8 w-8 rounded-lg border border-border bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition shrink-0 ml-4"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {importStatus && (
                <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/30 p-3 text-xs text-indigo-300">
                  {importStatus}
                </div>
              )}

              <form onSubmit={handleCSVImport} className="space-y-4">
                <textarea
                  rows={8}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder={`name,genericName,category,manufacturer,strength,dosageForm,barcode\nDisprin 300mg,Aspirin,Analgesics,Reckitt Benckiser,300mg,TABLET,8964000998811\nFlagyl 400mg,Metronidazole,Antibiotics,Sanofi Pakistan,400mg,TABLET,8964000441122`}
                  className="w-full font-mono text-xs p-3 rounded-lg border border-input bg-card text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                />

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/50">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowImportModal(false)}
                  >
                    Close
                  </Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white">
                    Execute Import
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
