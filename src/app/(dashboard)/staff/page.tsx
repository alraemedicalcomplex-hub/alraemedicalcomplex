"use client";

import React, { useState, useEffect } from "react";
import {
  UserCog,
  Plus,
  Shield,
  ShieldAlert,
  Mail,
  Phone,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

interface StaffMember {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  role: string;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
}

export default function StaffPage() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("CASHIER");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/staff");
      const data = await res.json();
      if (data.staff) setStaffList(data.staff);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleToggleActive = async (staffId: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId, isActive: !currentStatus }),
      });

      if (res.ok) {
        fetchStaff();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password, phone, role }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to create staff account");
        setIsSubmitting(false);
        return;
      }

      setShowAddModal(false);
      setFullName("");
      setEmail("");
      setPassword("");
      fetchStaff();
    } catch {
      setErrorMsg("Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <UserCog className="h-6 w-6 text-indigo-500" />
            Staff & Role-Based Access Control (RBAC)
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage pharmacy employees, assign roles (Pharmacist, Cashier, Inventory Manager, Accountant), and monitor security
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 text-xs shadow-md shadow-indigo-600/20"
        >
          <Plus className="h-4 w-4" />
          <span>Add Staff Member</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-muted-foreground text-xs">
            Loading authorized staff directory...
          </div>
        ) : (
          staffList.map((user) => (
            <Card key={user.id} className="p-5 flex flex-col justify-between hover:border-indigo-500/40 transition">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-foreground text-sm">{user.fullName}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
                  </div>
                  <Badge variant={user.isActive ? "success" : "destructive"} className="text-[10px]">
                    {user.isActive ? "Active" : "Suspended"}
                  </Badge>
                </div>

                <div className="pt-2 border-t border-border/60 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Assigned Role:</span>
                    <span className="font-mono font-bold text-indigo-400">{user.role}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="font-mono text-foreground">{user.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Last Login:</span>
                    <span>{user.lastLoginAt ? formatDate(user.lastLoginAt, true) : "Never logged in"}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  Created: {formatDate(user.createdAt)}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleActive(user.id, user.isActive)}
                  className={`h-7 px-2 text-xs ${
                    user.isActive ? "text-rose-400 hover:bg-rose-500/10" : "text-emerald-400 hover:bg-emerald-500/10"
                  }`}
                >
                  {user.isActive ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal: Add Staff */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-[#111827] p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-foreground">Add New Staff Member</h3>

            {errorMsg && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-2.5 text-xs text-red-400">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Full Name *</label>
                <Input placeholder="e.g. Dr. Ayesha Siddiqa" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Email Address *</label>
                <Input type="email" placeholder="ayesha@pharmacy.local" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Temporary Password *</label>
                <Input type="password" placeholder="••••••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Contact Phone</label>
                  <Input placeholder="0300..." value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Staff Role *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="PHARMACIST">Pharmacist (Pharm.D)</option>
                    <option value="CASHIER">Cashier (POS)</option>
                    <option value="INVENTORY_MANAGER">Inventory Manager</option>
                    <option value="ACCOUNTANT">Accountant</option>
                    <option value="MANAGER">Pharmacy Manager</option>
                    <option value="ADMIN">System Administrator</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white" isLoading={isSubmitting}>
                  Save Staff Account
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
