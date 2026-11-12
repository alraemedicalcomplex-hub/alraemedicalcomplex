"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HospitalLogo } from "@/components/ui/hospital-logo";

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

      window.location.href = from;
    } catch {
      setErrorMessage("Network error. Please check server connectivity.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-14 w-14 items-center justify-center">
          <HospitalLogo className="h-14 w-14 shadow-xl shadow-indigo-500/25" size={56} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Al Rae Hospital
        </h1>
        <p className="text-xs text-slate-400">
          Hospital Pharmacy & Clinical Management System • Pakistan
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
            <label className="text-xs font-medium text-slate-300">Username or Email</label>
            <Input
              type="text"
              placeholder="Username or email..."
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
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 mt-2 shadow-lg shadow-indigo-600/20"
            isLoading={isLoading}
          >
            Sign In to Terminal <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
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
