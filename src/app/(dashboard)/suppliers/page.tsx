"use client";

import React, { useState, useEffect } from "react";
import {
  Truck,
  Plus,
  Phone,
  Mail,
  MapPin,
  FileText,
  CreditCard,
  DollarSign,
  AlertCircle,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

interface SupplierItem {
  id: string;
  name: string;
  contactPerson?: string | null;
  phone: string;
  email?: string | null;
  address?: string | null;
  ntnNumber?: string | null;
  balance: number;
  paymentTerms?: string | null;
  purchases: any[];
  payments: any[];
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPaySupplier, setSelectedPaySupplier] = useState<SupplierItem | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payRef, setPayRef] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  // New Supplier Form
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [ntn, setNtn] = useState("");
  const [terms, setTerms] = useState("Net 30 Days");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSuppliers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/suppliers");
      const data = await res.json();
      if (data.suppliers) setSuppliers(data.suppliers);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          contactPerson,
          phone,
          email: email || undefined,
          address,
          ntnNumber: ntn,
          paymentTerms: terms,
          openingBalance: 0,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setName("");
        setPhone("");
        fetchSuppliers();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaySupplier) return;
    setIsPaying(true);

    try {
      const res = await fetch("/api/suppliers/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: selectedPaySupplier.id,
          amount: parseFloat(payAmount),
          reference: payRef,
          method: "BANK_TRANSFER",
        }),
      });

      if (res.ok) {
        setSelectedPaySupplier(null);
        setPayAmount("");
        setPayRef("");
        fetchSuppliers();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsPaying(false);
    }
  };

  const totalPayables = suppliers.reduce((acc, s) => acc + Number(s.balance || 0), 0);
  const pendingSuppliersCount = suppliers.filter((s) => Number(s.balance) > 0).length;

  const filteredSuppliers = suppliers.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(q)) ||
      s.phone.toLowerCase().includes(q) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.ntnNumber && s.ntnNumber.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Truck className="h-6 w-6 text-indigo-500" />
            Supplier Directory & Accounts Payable
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pharmaceutical distributors, procurement payment terms, NTN registration, and payables ledger
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 text-xs shadow-md shadow-indigo-600/20"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Supplier</span>
        </Button>
      </div>

      {/* Top Unified Summary Ribbon */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border/60">
          <div className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Total Registered Suppliers
              </span>
              <h3 className="text-2xl font-bold text-foreground font-mono">{suppliers.length}</h3>
              <p className="text-[11px] text-muted-foreground">Authorized pharma distributors</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Truck className="h-4 w-4" />
            </div>
          </div>

          <div className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Total Accounts Payable
              </span>
              <h3 className="text-2xl font-bold text-amber-400 font-mono">{formatCurrency(totalPayables)}</h3>
              <p className="text-[11px] text-muted-foreground">Outstanding procurement liability</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>

          <div className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Distributors with Due Balances
              </span>
              <h3 className="text-2xl font-bold text-rose-400 font-mono">{pendingSuppliersCount}</h3>
              <p className="text-[11px] text-muted-foreground">Require invoice settlement</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <Card className="p-3">
        <div className="max-w-md">
          <Input
            placeholder="Search suppliers by name, representative, phone, or NTN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </div>
      </Card>

      {/* Enterprise Full-Width Supplier Data Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                  <th className="py-3 px-4">Supplier & Representative</th>
                  <th className="py-3 px-4">Contact Details</th>
                  <th className="py-3 px-4">Address / City</th>
                  <th className="py-3 px-4">NTN / Registration</th>
                  <th className="py-3 px-4">Payment Terms</th>
                  <th className="py-3 px-4 text-right">Accounts Payable</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      Loading supplier ledger...
                    </td>
                  </tr>
                ) : filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      {searchQuery ? "No suppliers match your search criteria." : "No suppliers registered. Click 'Add New Supplier' to add."}
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-foreground text-sm">{s.name}</div>
                        {s.contactPerson ? (
                          <div className="text-[11px] text-muted-foreground">Rep: {s.contactPerson}</div>
                        ) : (
                          <div className="text-[11px] text-muted-foreground">Direct Account</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="flex items-center gap-1.5 font-mono text-foreground">
                          <Phone className="h-3 w-3 text-indigo-400 shrink-0" />
                          <span>{s.phone}</span>
                        </div>
                        {s.email && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Mail className="h-3 w-3 text-indigo-400 shrink-0" />
                            <span>{s.email}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground max-w-[180px] truncate">
                        {s.address || "—"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[11px] text-slate-300">
                          {s.ntnNumber || "Unregistered"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-muted/60 text-foreground border border-border/60">
                          {s.paymentTerms || "Net 30 Days"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`font-mono font-bold text-sm ${
                            Number(s.balance) > 0 ? "text-amber-400" : "text-emerald-400"
                          }`}
                        >
                          {formatCurrency(s.balance)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={Number(s.balance) > 0 ? "warning" : "success"} className="text-[10px]">
                          {Number(s.balance) > 0 ? "Due" : "Settled"}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/10 px-2.5"
                          onClick={() => setSelectedPaySupplier(s)}
                        >
                          <DollarSign className="h-3.5 w-3.5 mr-1" />
                          Pay
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal: Record Supplier Payment */}
      {selectedPaySupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-[#111827] p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-foreground">
              Record Payment to {selectedPaySupplier.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              Current Outstanding Payable: <span className="font-mono font-bold text-foreground">{formatCurrency(selectedPaySupplier.balance)}</span>
            </p>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Amount Paid (PKR) *</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 50000"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Transaction Ref / Cheque # *</label>
                <Input
                  placeholder="Raast ID or Cheque No..."
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button variant="outline" size="sm" onClick={() => setSelectedPaySupplier(null)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white" isLoading={isPaying}>
                  Confirm Payment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Supplier */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-[#111827] p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-foreground">Add New Supplier</h3>
            <form onSubmit={handleCreateSupplier} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Company Name *</label>
                <Input placeholder="e.g. Allied Drug Distribution" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Contact Person</label>
                <Input placeholder="e.g. Tariq Khan" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Phone *</label>
                  <Input placeholder="0423..." value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Email</label>
                  <Input type="email" placeholder="orders@dist.pk" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Address</label>
                <Input placeholder="e.g. Circular Road, Lahore" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">NTN Number</label>
                  <Input placeholder="2871192-1" value={ntn} onChange={(e) => setNtn(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Payment Terms</label>
                  <Input placeholder="Net 30 Days" value={terms} onChange={(e) => setTerms(e.target.value)} />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white" isLoading={isSubmitting}>
                  Save Supplier
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
