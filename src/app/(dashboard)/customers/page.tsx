"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  DollarSign,
  Search,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  creditLimit: number;
  balance: number;
  loyaltyPoints: number;
  createdAt: string;
  sales: any[];
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPayCustomer, setSelectedPayCustomer] = useState<CustomerRecord | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // New Customer Form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [creditLimit, setCreditLimit] = useState("10000");

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/customers?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.customers) setCustomers(data.customers);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email: email || undefined,
          address,
          creditLimit: parseFloat(creditLimit) || 0,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setName("");
        setPhone("");
        setEmail("");
        setAddress("");
        fetchCustomers();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayCustomer) return;
    setIsProcessing(true);

    try {
      const res = await fetch("/api/customers/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedPayCustomer.id,
          amount: parseFloat(payAmount),
          notes: payNotes,
        }),
      });

      if (res.ok) {
        setSelectedPayCustomer(null);
        setPayAmount("");
        setPayNotes("");
        fetchCustomers();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const totalReceivables = customers.reduce((acc, c) => acc + Number(c.balance || 0), 0);
  const customersWithDue = customers.filter((c) => Number(c.balance) > 0).length;
  const totalLoyaltyPoints = customers.reduce((acc, c) => acc + Number(c.loyaltyPoints || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-indigo-500" />
            Patient Accounts & Customer Receivables
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Credit accounts, outstanding balance collection, prescription history, and loyalty points
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 text-xs shadow-md shadow-indigo-600/20"
        >
          <Plus className="h-4 w-4" />
          <span>Register Patient</span>
        </Button>
      </div>

      {/* Top Unified Summary Ribbon */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border/60">
          <div className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Total Registered Patients
              </span>
              <h3 className="text-2xl font-bold text-foreground font-mono">{customers.length}</h3>
              <p className="text-[11px] text-muted-foreground">Active dispensary patient records</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>

          <div className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Total Patient Receivables
              </span>
              <h3 className="text-2xl font-bold text-indigo-400 font-mono">{formatCurrency(totalReceivables)}</h3>
              <p className="text-[11px] text-muted-foreground">{customersWithDue} accounts with unpaid balances</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>

          <div className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Active Loyalty Points
              </span>
              <h3 className="text-2xl font-bold text-amber-400 font-mono">{totalLoyaltyPoints.toLocaleString()}</h3>
              <p className="text-[11px] text-muted-foreground">Patient reward points accrued</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <Card className="p-3">
        <div className="max-w-md">
          <Input
            placeholder="Search patient by name or phone (e.g. 0300...)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </div>
      </Card>

      {/* Enterprise Full-Width Patient Data Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4">Email / Address</th>
                  <th className="py-3 px-4 text-right">Credit Ceiling</th>
                  <th className="py-3 px-4 text-right">Outstanding Due</th>
                  <th className="py-3 px-4 text-center">Loyalty Points</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      Loading patient database...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      {searchQuery ? "No patients match your search criteria." : "No patient records registered."}
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-foreground text-sm">{c.name}</div>
                        <div className="text-[11px] text-muted-foreground">Registered: {formatDate(c.createdAt)}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-foreground font-medium">
                          <Phone className="h-3 w-3 text-indigo-400 shrink-0" />
                          <span>{c.phone}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 space-y-0.5 text-muted-foreground max-w-[200px] truncate">
                        {c.address && <div>{c.address}</div>}
                        {c.email && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Mail className="h-3 w-3 text-indigo-400 shrink-0" />
                            <span>{c.email}</span>
                          </div>
                        )}
                        {!c.address && !c.email && <div>—</div>}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                        {formatCurrency(c.creditLimit)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`font-mono font-bold text-sm ${
                            Number(c.balance) > 0 ? "text-amber-400" : "text-emerald-400"
                          }`}
                        >
                          {formatCurrency(c.balance)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Sparkles className="h-3 w-3" />
                          {c.loyaltyPoints} pts
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={Number(c.balance) > 0 ? "warning" : "success"} className="text-[10px]">
                          {Number(c.balance) > 0 ? "Balance Due" : "Clear"}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {Number(c.balance) > 0 ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/10 px-2.5"
                            onClick={() => setSelectedPayCustomer(c)}
                          >
                            <DollarSign className="h-3.5 w-3.5 mr-1" />
                            Collect
                          </Button>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">All Paid</span>
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

      {/* Modal: Collect Payment */}
      {selectedPayCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-[#111827] p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-foreground">
              Collect Credit Payment from {selectedPayCustomer.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              Current Outstanding Balance: <span className="font-mono font-bold text-foreground">{formatCurrency(selectedPayCustomer.balance)}</span>
            </p>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Amount Received (PKR) *</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 4500"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Notes / Receipt Ref</label>
                <Input
                  placeholder="Cash settlement / receipt no..."
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button variant="outline" size="sm" onClick={() => setSelectedPayCustomer(null)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white" isLoading={isProcessing}>
                  Record Collection
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Patient */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-[#111827] p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-foreground">Register New Patient</h3>
            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Full Name *</label>
                <Input placeholder="e.g. Haji Muhammad Rafique" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Phone *</label>
                  <Input placeholder="0300..." value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Email</label>
                  <Input type="email" placeholder="patient@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Residential Address</label>
                <Input placeholder="House #, Street, City..." value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Approved Credit Ceiling (PKR)</label>
                <Input type="number" placeholder="10000" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white" isLoading={isProcessing}>
                  Save Patient
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
