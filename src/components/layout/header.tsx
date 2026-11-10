"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sun,
  Moon,
  Bell,
  LogOut,
  User as UserIcon,
  ShoppingCart,
  Clock,
  Menu,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  user?: {
    fullName: string;
    email: string;
    role: string;
  } | null;
  onMobileToggle?: () => void;
}

export function Header({ user, onMobileToggle }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const [currentTime, setCurrentTime] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-PK", {
          timeZone: "Asia/Karachi",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-border bg-card/80 px-4 md:px-6 backdrop-blur-md">
      {/* Left side: Mobile menu toggle + Live Clock */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileToggle}
          className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-1.5 border border-border/60 text-xs font-mono text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <Clock className="h-3.5 w-3.5 text-indigo-400" />
          <span>PKT:</span>
          <span className="font-semibold text-foreground">{currentTime || "--:--:--"}</span>
        </div>
      </div>

      {/* Right side: Quick POS, Notifications, Theme switcher, Profile */}
      <div className="flex items-center gap-2 md:gap-3">
        <Link href="/pos">
          <Button
            size="sm"
            className="hidden sm:inline-flex bg-emerald-600 hover:bg-emerald-500 text-white font-medium gap-1.5 shadow-sm"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>POS Terminal</span>
          </Button>
        </Link>

        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground hover:bg-muted transition"
          aria-label="Toggle Theme"
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-indigo-500" />
          )}
        </button>

        {/* Notifications Icon */}
        <Link href="/dashboard#notifications">
          <button
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground hover:bg-muted transition"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-card animate-pulse" />
          </button>
        </Link>

        {/* User Card & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-border/80">
          <div className="hidden lg:flex flex-col text-right">
            <span className="text-xs font-semibold text-foreground leading-tight">
              {user?.fullName || "Pharmacy Staff"}
            </span>
            <span className="text-[10px] font-medium text-indigo-400 uppercase tracking-wider">
              {user?.role || "Staff"}
            </span>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-semibold text-xs">
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : <UserIcon className="h-4 w-4" />}
          </div>

          <button
            onClick={handleLogout}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition"
            title="Log Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
