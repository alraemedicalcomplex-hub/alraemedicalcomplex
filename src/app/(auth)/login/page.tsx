"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, Lock, Mail, AlertCircle, ArrowRight, Pill } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Login failed. Please verify credentials.");
        setIsLoading(false);
        return;
      }

      router.push(from);
      router.refresh();
    } catch {
      setErrorMessage("Network error. Please check server connectivity.");
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-xl shadow-indigo-500/25">
          <Pill className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Sufi Pharmacy Management
        </h1>
        <p className="text-xs text-slate-400">
          DRAP Compliant Dispensary & Clinical Retail System • Pakistan
        </p>
      </div>

      {/* Card Form */}
      <div className="rounded-2xl border border-border bg-[#111827]/90 p-8 shadow-2xl backdrop-blur-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Staff Email</label>
            <Input
              type="email"
              placeholder="name@pharmacy.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="h-4 w-4" />}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Password</label>
            <Input
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="h-4 w-4" />}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 mt-2"
            isLoading={isLoading}
          >
            Sign In to Terminal <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>

        {/* Quick Demo Credentials for Fast Testing */}
        <div className="mt-6 pt-6 border-t border-border/80">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
            Quick Role Switcher (Pre-Configured Staff)
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickLogin("admin@pharmacy.local", "Admin@Pharmacy2026!")}
              className="rounded-lg border border-border/80 bg-slate-900/60 p-2 text-left hover:border-indigo-500/50 hover:bg-indigo-950/20 transition"
            >
              <div className="font-semibold text-indigo-300">Super Admin</div>
              <div className="text-[10px] text-slate-400 truncate">admin@pharmacy.local</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("pharmacist@pharmacy.local", "Staff@Pharmacy2026!")}
              className="rounded-lg border border-border/80 bg-slate-900/60 p-2 text-left hover:border-emerald-500/50 hover:bg-emerald-950/20 transition"
            >
              <div className="font-semibold text-emerald-300">Pharmacist</div>
              <div className="text-[10px] text-slate-400 truncate">pharmacist@pharmacy.local</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("cashier@pharmacy.local", "Staff@Pharmacy2026!")}
              className="rounded-lg border border-border/80 bg-slate-900/60 p-2 text-left hover:border-amber-500/50 hover:bg-amber-950/20 transition"
            >
              <div className="font-semibold text-amber-300">Cashier (POS)</div>
              <div className="text-[10px] text-slate-400 truncate">cashier@pharmacy.local</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("inventory@pharmacy.local", "Staff@Pharmacy2026!")}
              className="rounded-lg border border-border/80 bg-slate-900/60 p-2 text-left hover:border-violet-500/50 hover:bg-violet-950/20 transition"
            >
              <div className="font-semibold text-violet-300">Inventory Mgr</div>
              <div className="text-[10px] text-slate-400 truncate">inventory@pharmacy.local</div>
            </button>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
        <span>Encrypted Session • Rate-Limited • DRAP Standard Auditing</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070A12] px-4 py-12">
      <Suspense fallback={<div className="text-white text-sm">Loading login terminal...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
