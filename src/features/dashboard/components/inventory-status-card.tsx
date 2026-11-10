import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertTriangle, ClockAlert, XCircle, CheckCircle2 } from "lucide-react";

interface InventoryStatusProps {
  lowStockCount: number;
  outOfStockCount: number;
  expiringCount: number;
  expiredCount: number;
}

export function InventoryStatusCard({
  lowStockCount,
  outOfStockCount,
  expiringCount,
  expiredCount,
}: InventoryStatusProps) {
  return (
    <Card className="col-span-1">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Inventory Health</CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">
          Real-time batch compliance and replenishment alerts
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Out of Stock */}
        <Link
          href="/inventory?status=out-of-stock"
          className="flex items-center justify-between p-3 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition"
        >
          <div className="flex items-center gap-3">
            <XCircle className="h-5 w-5 text-rose-500" />
            <div>
              <p className="text-xs font-semibold text-foreground">Out of Stock</p>
              <p className="text-[11px] text-muted-foreground">Immediate re-order required</p>
            </div>
          </div>
          <span className="font-mono text-base font-bold text-rose-500">
            {outOfStockCount}
          </span>
        </Link>

        {/* Low Stock */}
        <Link
          href="/inventory?status=low-stock"
          className="flex items-center justify-between p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-xs font-semibold text-foreground">Low Stock Threshold</p>
              <p className="text-[11px] text-muted-foreground">Below minimum safety levels</p>
            </div>
          </div>
          <span className="font-mono text-base font-bold text-amber-500">
            {lowStockCount}
          </span>
        </Link>

        {/* Expiring Soon */}
        <Link
          href="/expiry?filter=expiring-soon"
          className="flex items-center justify-between p-3 rounded-lg border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 transition"
        >
          <div className="flex items-center gap-3">
            <ClockAlert className="h-5 w-5 text-indigo-400" />
            <div>
              <p className="text-xs font-semibold text-foreground">Expiring Within 90 Days</p>
              <p className="text-[11px] text-muted-foreground">Prioritize FEFO sales or returns</p>
            </div>
          </div>
          <span className="font-mono text-base font-bold text-indigo-400">
            {expiringCount}
          </span>
        </Link>

        {/* Already Expired */}
        <Link
          href="/expiry?filter=expired"
          className="flex items-center justify-between p-3 rounded-lg border border-border/80 bg-muted/20 hover:bg-muted/40 transition"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-slate-400" />
            <div>
              <p className="text-xs font-semibold text-foreground">Quarantined / Expired</p>
              <p className="text-[11px] text-muted-foreground">Stock write-off or supplier return</p>
            </div>
          </div>
          <span className="font-mono text-base font-bold text-foreground">
            {expiredCount}
          </span>
        </Link>
      </CardContent>
    </Card>
  );
}
