import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "warning" | "destructive" | "indigo";
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
}: MetricCardProps) {
  const iconColorMap = {
    default: "text-slate-400 bg-slate-800/80 border-slate-700/60",
    success: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    warning: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    destructive: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  };

  return (
    <Card className="hover:border-border/80 transition-all">
      <CardContent className="p-5 flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
            {title}
          </p>
          <h4 className="text-2xl font-bold tracking-tight text-foreground">{value}</h4>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <p
              className={cn(
                "text-xs font-medium flex items-center gap-1",
                trend.isPositive ? "text-emerald-400" : "text-rose-400"
              )}
            >
              <span>{trend.isPositive ? "↑" : "↓"}</span>
              <span>{trend.value}</span>
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl border p-2.5",
            iconColorMap[variant]
          )}
        >
          <Icon className="h-5 w-5 shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}
