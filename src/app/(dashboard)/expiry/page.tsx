"use client";

import React, { useState, useEffect } from "react";
import {
  ClockAlert,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  ArrowRight,
  Truck,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

interface BatchExpiryRecord {
  id: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  purchaseCost: number;
  retailPrice: number;
  status: string;
  quarantineReason?: string | null;
  medicine: {
    id: string;
    name: string;
    genericName: string;
    unitOfMeasure: string;
    manufacturer: { name: string };
  };
}

export default function ExpiryManagementPage() {
  const [activeTab, setActiveTab] = useState<"30" | "60" | "90" | "expired" | "quarantined">("30");
  const [data, setData] = useState<{
    expired: BatchExpiryRecord[];
    within30: BatchExpiryRecord[];
    within60: BatchExpiryRecord[];
    within90: BatchExpiryRecord[];
    quarantined: BatchExpiryRecord[];
    summary: {
      expiredCount: number;
      within30Count: number;
      within60Count: number;
      within90Count: number;
      quarantinedCount: number;
    };
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const fetchExpiryData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/inventory/expiry");
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpiryData();
  }, []);

  const handleAction = async (batchId: string, actionType: "QUARANTINE" | "WRITE_OFF") => {
    if (!confirm(`Are you sure you want to execute ${actionType} on this batch?`)) return;

    try {
      if (actionType === "QUARANTINE") {
        await fetch("/api/inventory/adjust", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ batchId, action: "QUARANTINE", reason: "Expired / Near-expiry isolation" }),
        });
      } else if (actionType === "WRITE_OFF") {
        // deduct remaining quantity
        const activeList = activeTab === "expired" ? data?.expired : data?.within30;
        const target = activeList?.find((b) => b.id === batchId);
        if (target) {
          await fetch("/api/inventory/adjust", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              batchId,
              quantityDelta: -target.quantity,
              type: "ADJUSTMENT_EXPIRED",
              reason: "Expired stock disposal / write-off",
            }),
          });
        }
      }
      fetchExpiryData();
    } catch (e) {
      console.error(e);
    }
  };

  const getListForTab = () => {
    if (!data) return [];
    switch (activeTab) {
      case "30":
        return data.within30;
      case "60":
        return data.within60;
      case "90":
        return data.within90;
      case "expired":
        return data.expired;
      case "quarantined":
        return data.quarantined;
      default:
        return [];
    }
  };

  const currentList = getListForTab();

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <ClockAlert className="h-6 w-6 text-amber-500" />
          Predictive Expiry & Quarantine Management
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          DRAP compliance standard for proactive FEFO dispensing, quarantine isolation, and supplier return candidate identification
        </p>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => setActiveTab("30")}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeTab === "30"
              ? "border-red-500 bg-red-500/10 text-red-400"
              : "border-border bg-card text-muted-foreground hover:bg-muted"
          }`}
        >
          <p className="text-xs font-semibold">Critical (≤ 30 Days)</p>
          <p className="font-mono text-xl font-bold mt-1 text-foreground">
            {data?.summary.within30Count || 0}
          </p>
        </button>

        <button
          onClick={() => setActiveTab("60")}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeTab === "60"
              ? "border-amber-500 bg-amber-500/10 text-amber-400"
              : "border-border bg-card text-muted-foreground hover:bg-muted"
          }`}
        >
          <p className="text-xs font-semibold">Urgent (31-60 Days)</p>
          <p className="font-mono text-xl font-bold mt-1 text-foreground">
            {data?.summary.within60Count || 0}
          </p>
        </button>

        <button
          onClick={() => setActiveTab("90")}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeTab === "90"
              ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
              : "border-border bg-card text-muted-foreground hover:bg-muted"
          }`}
        >
          <p className="text-xs font-semibold">Watchlist (61-90 Days)</p>
          <p className="font-mono text-xl font-bold mt-1 text-foreground">
            {data?.summary.within90Count || 0}
          </p>
        </button>

        <button
          onClick={() => setActiveTab("expired")}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeTab === "expired"
              ? "border-red-600 bg-red-600/20 text-red-300"
              : "border-border bg-card text-muted-foreground hover:bg-muted"
          }`}
        >
          <p className="text-xs font-semibold">Already Expired</p>
          <p className="font-mono text-xl font-bold mt-1 text-foreground">
            {data?.summary.expiredCount || 0}
          </p>
        </button>

        <button
          onClick={() => setActiveTab("quarantined")}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeTab === "quarantined"
              ? "border-violet-500 bg-violet-500/10 text-violet-400"
              : "border-border bg-card text-muted-foreground hover:bg-muted"
          }`}
        >
          <p className="text-xs font-semibold">Quarantined Stock</p>
          <p className="font-mono text-xl font-bold mt-1 text-foreground">
            {data?.summary.quarantinedCount || 0}
          </p>
        </button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                  <th className="py-3 px-4">Medicine & Generic</th>
                  <th className="py-3 px-4">Manufacturer</th>
                  <th className="py-3 px-4">Batch No</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4 text-right">Affected Stock</th>
                  <th className="py-3 px-4 text-right">Cost Value (PKR)</th>
                  <th className="py-3 px-4 text-right">Retail Value (PKR)</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      Analyzing expiry projections...
                    </td>
                  </tr>
                ) : currentList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      No batches found in this category. Excellent stock rotation!
                    </td>
                  </tr>
                ) : (
                  currentList.map((batch) => (
                    <tr key={batch.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-foreground text-sm">{batch.medicine.name}</p>
                        <p className="text-muted-foreground text-[11px]">{batch.medicine.genericName}</p>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-foreground">
                        {batch.medicine.manufacturer.name}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">
                        {batch.batchNumber}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold text-foreground">
                        {formatDate(batch.expiryDate)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-sm font-bold text-foreground">
                        {batch.quantity} {batch.medicine.unitOfMeasure}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-muted-foreground">
                        {formatCurrency(batch.quantity * batch.purchaseCost)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-foreground">
                        {formatCurrency(batch.quantity * batch.retailPrice)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {batch.status !== "QUARANTINED" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                              onClick={() => handleAction(batch.id, "QUARANTINE")}
                            >
                              <ShieldAlert className="h-3 w-3 mr-1" />
                              Quarantine
                            </Button>
                          )}

                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => handleAction(batch.id, "WRITE_OFF")}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Write-Off
                          </Button>
                        </div>
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
  );
}
