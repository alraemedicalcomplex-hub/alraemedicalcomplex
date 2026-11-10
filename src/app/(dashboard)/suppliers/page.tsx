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

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-muted-foreground text-xs">
            Loading supplier profiles...
          </div>
        ) : suppliers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground text-xs">
            No suppliers found. Click &quot;Add New Supplier&quot; to register distributors.
          </div>
        ) : (
          suppliers.map((s) => (
            <Card key={s.id} className="p-5 flex flex-col justify-between hover:border-indigo-500/40 transition">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-foreground text-sm">{s.name}</h3>
                    {s.contactPerson && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Rep: {s.contactPerson}
                      </p>
                    )}
                  </div>
                  <Badge variant={Number(s.balance) > 0 ? "warning" : "success"} className="text-[10px]">
                    {Number(s.balance) > 0 ? "Pending Balance" : "Clear"}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground pt-1 border-t border-border/60">
                  <p className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                    <span>{s.phone}</span>
                  </p>
                  {s.email && (
                    <p className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                      <span>{s.email}</span>
                    </p>
                  )}
                  {s.address && (
                    <p className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                      <span className="line-clamp-1">{s.address}</span>
                    </p>
                  )}
                  {s.ntnNumber && (
                    <p className="font-mono text-[10px] text-slate-400">
                      NTN: {s.ntnNumber} • Terms: {s.paymentTerms || "Cash"}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Accounts Payable:</span>
                  <span className="font-mono font-bold text-sm text-foreground">
                    {formatCurrency(s.balance)}
                  </span>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/10"
                  onClick={() => setSelectedPaySupplier(s)}
                >
                  <DollarSign className="h-3.5 w-3.5 mr-1" />
                  Pay
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

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
