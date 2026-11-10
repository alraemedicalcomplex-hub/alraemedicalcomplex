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

  return (
    <div className="space-y-6">
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

      <Card className="p-4">
        <div className="max-w-md">
          <Input
            placeholder="Search patient by name or phone (e.g. 0300...)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-muted-foreground text-xs">
            Loading patient records...
          </div>
        ) : customers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground text-xs">
            No patient profiles found.
          </div>
        ) : (
          customers.map((c) => (
            <Card key={c.id} className="p-5 flex flex-col justify-between hover:border-indigo-500/40 transition">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-foreground text-sm">{c.name}</h3>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">{c.phone}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={Number(c.balance) > 0 ? "warning" : "success"} className="text-[10px]">
                      {Number(c.balance) > 0 ? "Balance Due" : "Clear"}
                    </Badge>
                    <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> {c.loyaltyPoints} pts
                    </span>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-muted-foreground pt-1 border-t border-border/60">
                  {c.email && (
                    <p className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                      <span>{c.email}</span>
                    </p>
                  )}
                  {c.address && (
                    <p className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                      <span className="line-clamp-1">{c.address}</span>
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400">
                    Credit Limit: {formatCurrency(c.creditLimit)} • Joined: {formatDate(c.createdAt)}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Outstanding Balance:</span>
                  <span className={`font-mono font-bold text-sm ${Number(c.balance) > 0 ? "text-amber-400" : "text-foreground"}`}>
                    {formatCurrency(c.balance)}
                  </span>
                </div>

                {Number(c.balance) > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/10"
                    onClick={() => setSelectedPayCustomer(c)}
                  >
                    <DollarSign className="h-3.5 w-3.5 mr-1" />
                    Receive Cash
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

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
