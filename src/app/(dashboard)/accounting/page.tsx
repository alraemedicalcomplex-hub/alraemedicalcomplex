"use client";

import React, { useState, useEffect } from "react";
import {
  Wallet,
  Plus,
  TrendingUp,
  Receipt,
  DollarSign,
  Building2,
  Calendar,
  Lock,
  Unlock,
  CreditCard,
  Banknote,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AccountingPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // New Expense Modal
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("UTILITIES");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paidTo, setPaidTo] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAccountingData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/accounting");
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountingData();
  }, []);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          amount: parseFloat(amount),
          paymentMethod,
          paidTo,
          notes,
        }),
      });

      if (res.ok) {
        setShowAddExpense(false);
        setTitle("");
        setAmount("");
        setPaidTo("");
        setNotes("");
        fetchAccountingData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Wallet className="h-6 w-6 text-indigo-500" />
            Accounting, Expenses & Cash Registers
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time Profit & Loss statement, operational overheads, cashier shifts, and financial ledgers
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setShowAddExpense(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 text-xs shadow-md shadow-indigo-600/20"
        >
          <Plus className="h-4 w-4" />
          <span>Record Expense</span>
        </Button>
      </div>

      {/* Unified P&L Financial Ribbon */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border/60">
          <div className="p-5 space-y-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Sales Revenue (MTD)
            </span>
            <h3 className="text-2xl font-bold text-foreground font-mono">
              {formatCurrency(data?.summary?.totalSales || 0)}
            </h3>
            <p className="text-[11px] text-muted-foreground">Gross pharmaceutical turnover</p>
          </div>

          <div className="p-5 space-y-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Procurement Cost (COGS)
            </span>
            <h3 className="text-2xl font-bold text-blue-400 font-mono">
              {formatCurrency(data?.summary?.totalPurchases || 0)}
            </h3>
            <p className="text-[11px] text-muted-foreground">Stock billed by distributors</p>
          </div>

          <div className="p-5 space-y-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Operating Expenses
            </span>
            <h3 className="text-2xl font-bold text-rose-400 font-mono">
              {formatCurrency(data?.summary?.totalExpenses || 0)}
            </h3>
            <p className="text-[11px] text-muted-foreground">Rent, utility bills, salaries & supplies</p>
          </div>

          <div className="p-5 space-y-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Estimated Net Profit
            </span>
            <h3
              className={`text-2xl font-bold font-mono ${
                (data?.summary?.netProfit || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {formatCurrency(data?.summary?.netProfit || 0)}
            </h3>
            <p className="text-[11px] text-muted-foreground">Turnover minus COGS & operational overheads</p>
          </div>
        </div>
      </div>

      {/* Cash Registers & Recent Expenses Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cash Register Shifts (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>POS Cash Register Terminals</span>
                <Badge variant="success" className="text-[10px]">Active Shift</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {data?.registers?.length === 0 ? (
                <p className="text-xs text-muted-foreground py-8 text-center">No cash register shifts logged.</p>
              ) : (
                data?.registers?.map((reg: any) => (
                  <div key={reg.id} className="p-3 rounded-lg border border-border/80 bg-muted/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-xs text-foreground">{reg.terminalName}</span>
                        <p className="text-[11px] text-muted-foreground">Cashier: {reg.cashier?.fullName}</p>
                      </div>
                      <Badge variant={reg.status === "OPEN" ? "success" : "default"} className="text-[10px]">
                        {reg.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/40 font-mono">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Opening Float:</span>
                        <span className="font-semibold">{formatCurrency(reg.openingCash)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-muted-foreground block">Shift Transactions:</span>
                        <span className="font-semibold">{reg.transactions?.length || 0} entries</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Operating Expenses (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-semibold">Recent Operational Expenses</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-muted-foreground font-semibold">
                      <th className="py-2.5 px-4">Expense Title</th>
                      <th className="py-2.5 px-4">Category</th>
                      <th className="py-2.5 px-4">Paid To</th>
                      <th className="py-2.5 px-4 text-right">Amount (PKR)</th>
                      <th className="py-2.5 px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data?.recentExpenses?.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground">
                          No operating expenses recorded yet.
                        </td>
                      </tr>
                    ) : (
                      data?.recentExpenses?.map((exp: any) => (
                        <tr key={exp.id} className="hover:bg-muted/30">
                          <td className="py-3 px-4 font-medium text-foreground">
                            {exp.title}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="text-[10px]">
                              {exp.category}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {exp.paidTo || "-"}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-rose-400">
                            {formatCurrency(exp.amount)}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {formatDate(exp.date)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal: Add Expense */}
      {showAddExpense && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm p-3 sm:p-6 flex min-h-full items-start sm:items-center justify-center">
          <div className="relative w-full max-w-md my-4 sm:my-auto max-h-[calc(100vh-2rem)] sm:max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-[#111827] p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between pb-2 border-b border-border/80">
              <div>
                <h3 className="text-base font-bold text-foreground">Record Operating Expense</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Input disbursement vouchers & overheads</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddExpense(false)}
                className="h-8 w-8 rounded-lg border border-border bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition shrink-0 ml-3"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateExpense} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Expense Title *</label>
                <Input placeholder="e.g. October Commercial Electricity Bill" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="RENT">Rent & Property</option>
                    <option value="UTILITIES">Utilities (Electricity/Water/Net)</option>
                    <option value="SALARIES">Staff Salaries & Allowances</option>
                    <option value="SUPPLIES">Packaging, Bags & Receipt Rolls</option>
                    <option value="LICENSES_PERMITS">DRAP & Health Department Fees</option>
                    <option value="MAINTENANCE">Equipment / AC Maintenance</option>
                    <option value="OTHER">Other Operating Expenses</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Amount (PKR) *</label>
                  <Input type="number" step="0.01" placeholder="42500" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="CASH">Cash Drawer</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CARD">Card</option>
                    <option value="EASYPAISA_JAZZCASH">Mobile Wallet</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Paid To</label>
                  <Input placeholder="e.g. LESCO, DHA..." value={paidTo} onChange={(e) => setPaidTo(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Notes / Invoice Ref</label>
                <Input placeholder="Bill consumer number, cheque number..." value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button variant="outline" size="sm" onClick={() => setShowAddExpense(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white" isLoading={isSubmitting}>
                  Save Expense
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
