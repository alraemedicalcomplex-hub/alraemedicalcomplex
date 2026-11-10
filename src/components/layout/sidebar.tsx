"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Pill,
  Boxes,
  ShoppingCart,
  Receipt,
  Truck,
  Users,
  FileText,
  ClockAlert,
  Wallet,
  Undo2,
  BarChart3,
  UserCog,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  PackagePlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeVariant?: "default" | "warning" | "destructive";
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const NAVIGATION_GROUPS: NavGroup[] = [
  {
    group: "Overview",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "POS Terminal", href: "/pos", icon: ShoppingCart, badge: "F2" },
    ],
  },
  {
    group: "Catalog & Stock",
    items: [
      { title: "Medicines", href: "/medicines", icon: Pill },
      { title: "Inventory & Batches", href: "/inventory", icon: Boxes },
      { title: "Expiry Management", href: "/expiry", icon: ClockAlert },
    ],
  },
  {
    group: "Procurement & Sales",
    items: [
      { title: "Sales Invoices", href: "/sales", icon: Receipt },
      { title: "Purchases & PO", href: "/purchases", icon: PackagePlus },
      { title: "Suppliers", href: "/suppliers", icon: Truck },
      { title: "Customers", href: "/customers", icon: Users },
      { title: "Prescriptions", href: "/prescriptions", icon: FileText },
      { title: "Sales Returns", href: "/returns", icon: Undo2 },
    ],
  },
  {
    group: "Finance & Reports",
    items: [
      { title: "Accounting & Cash", href: "/accounting", icon: Wallet },
      { title: "Reports & Analytics", href: "/reports", icon: BarChart3 },
    ],
  },
  {
    group: "Administration",
    items: [
      { title: "Staff & RBAC", href: "/staff", icon: UserCog },
      { title: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function Sidebar({
  isCollapsed,
  setIsCollapsed,
}: {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-border bg-[#0B0F19] text-slate-100 transition-all duration-300 z-30 select-none",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border/80">
        {!isCollapsed ? (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-md shadow-indigo-500/20">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-wide text-white leading-tight">
                SUFI PHARMACY
              </span>
              <span className="text-[11px] font-medium text-emerald-400">
                DRAP Certified
              </span>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-md shadow-indigo-500/20">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {NAVIGATION_GROUPS.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {!isCollapsed && (
              <h4 className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
                {group.group}
              </h4>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={isCollapsed ? item.title : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all group relative",
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30"
                      : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 shrink-0 transition-transform group-hover:scale-105",
                      isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                    )}
                  />
                  {!isCollapsed && (
                    <span className="truncate flex-1">{item.title}</span>
                  )}
                  {!isCollapsed && item.badge && (
                    <span className="ml-auto rounded bg-indigo-950/80 border border-indigo-500/40 px-1.5 py-0.5 text-[10px] font-bold text-indigo-300">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Info */}
      {!isCollapsed && (
        <div className="p-3 border-t border-border/80 text-center">
          <div className="rounded-lg bg-slate-900/60 p-2.5 border border-border/60">
            <p className="text-[11px] text-slate-400">Pakistan Pharmacy Standard</p>
            <p className="text-[10px] font-mono text-slate-500 mt-0.5">PKR • Asia/Karachi • FEFO</p>
          </div>
        </div>
      )}
    </aside>
  );
}
