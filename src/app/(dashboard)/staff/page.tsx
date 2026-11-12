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
  Search,
  Users,
  X,
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
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

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

  const activeStaffCount = staffList.filter((s) => s.isActive).length;
  const suspendedStaffCount = staffList.filter((s) => !s.isActive).length;
  const pharmacistCount = staffList.filter((s) => s.role === "PHARMACIST").length;

  const filteredStaff = staffList.filter((u) => {
    if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone && u.phone.toLowerCase().includes(q)) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const getRoleBadgeColor = (r: string) => {
    switch (r) {
      case "SUPER_ADMIN":
      case "ADMIN":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "PHARMACIST":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "MANAGER":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "ACCOUNTANT":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "INVENTORY_MANAGER":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "CASHIER":
      default:
        return "bg-slate-500/10 text-slate-300 border-slate-500/20";
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
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

      {/* Top Unified Summary Ribbon */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border/60">
          <div className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Total Team Members
              </span>
              <h3 className="text-2xl font-bold text-foreground font-mono">{staffList.length}</h3>
              <p className="text-[11px] text-muted-foreground">Authorized staff personnel</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>

          <div className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Active Accounts
              </span>
              <h3 className="text-2xl font-bold text-emerald-400 font-mono">{activeStaffCount}</h3>
              <p className="text-[11px] text-muted-foreground">Logged-in eligible accounts</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>

          <div className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Clinical Pharmacists
              </span>
              <h3 className="text-2xl font-bold text-blue-400 font-mono">{pharmacistCount}</h3>
              <p className="text-[11px] text-muted-foreground">Pharm.D clinical sign-off</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Shield className="h-4 w-4" />
            </div>
          </div>

          <div className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Suspended Access
              </span>
              <h3 className="text-2xl font-bold text-rose-400 font-mono">{suspendedStaffCount}</h3>
              <p className="text-[11px] text-muted-foreground">Access blocked / former</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <Card className="p-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:max-w-md">
            <Input
              placeholder="Search staff by name, email, role, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto ml-auto overflow-x-auto pb-1 sm:pb-0">
            {["ALL", "PHARMACIST", "CASHIER", "MANAGER", "INVENTORY_MANAGER", "ACCOUNTANT", "ADMIN"].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  roleFilter === r
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted"
                }`}
              >
                {r.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Enterprise Full-Width Staff Data Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4">Last Login</th>
                  <th className="py-3 px-4">Date Added</th>
                  <th className="py-3 px-4 text-center">Account Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      Loading staff directory...
                    </td>
                  </tr>
                ) : filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      {searchQuery || roleFilter !== "ALL"
                        ? "No staff members match the selected filter."
                        : "No staff records found."}
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-bold flex items-center justify-center text-xs shrink-0">
                            {user.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground text-sm">{user.fullName}</div>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3 text-slate-500" />
                              <span>{user.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${getRoleBadgeColor(
                            user.role
                          )}`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {user.phone ? (
                          <div className="flex items-center gap-1.5 font-mono text-foreground">
                            <Phone className="h-3 w-3 text-indigo-400 shrink-0" />
                            <span>{user.phone}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-slate-500 shrink-0" />
                          <span>{user.lastLoginAt ? formatDate(user.lastLoginAt, true) : "Never logged in"}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={user.isActive ? "success" : "destructive"} className="text-[10px]">
                          {user.isActive ? "Active" : "Suspended"}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(user.id, user.isActive)}
                          className={`h-7 px-2.5 text-xs ${
                            user.isActive
                              ? "text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
                              : "text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                          }`}
                        >
                          {user.isActive ? "Suspend" : "Activate"}
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

      {/* Modal: Add Staff */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6 text-center">
            <div className="w-full max-w-lg rounded-2xl border border-border bg-[#111827] p-6 sm:p-8 text-left shadow-2xl space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-border/80">
                <div>
                  <h3 className="text-xl font-bold text-foreground">Add New Staff Member</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Configure role & access credentials</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="h-8 w-8 rounded-lg border border-border bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition shrink-0 ml-4"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {errorMsg && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-2.5 text-xs text-red-400">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleCreateStaff} className="space-y-4">
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

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
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
        </div>
      )}
    </div>
  );
}
