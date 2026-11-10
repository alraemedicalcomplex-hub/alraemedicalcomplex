import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";

interface RecentSalesProps {
  sales: {
    id: string;
    invoiceNumber: string;
    customerName: string;
    totalAmount: number;
    paymentStatus: string;
    createdAt: string;
  }[];
}

export function RecentSalesTable({ sales }: RecentSalesProps) {
  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-semibold">Recent Sales</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Latest point of sale transactions
          </p>
        </div>
        <Link
          href="/sales"
          className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
        >
          View all <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        {sales.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No sales recorded yet.
          </div>
        ) : (
          <div className="space-y-3">
            {sales.map((sale) => (
              <div
                key={sale.id}
                className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-foreground">
                      {sale.invoiceNumber}
                    </span>
                    <Badge
                      variant={
                        sale.paymentStatus === "PAID"
                          ? "success"
                          : sale.paymentStatus === "PARTIAL"
                          ? "warning"
                          : "destructive"
                      }
                      className="text-[10px] py-0 px-1.5"
                    >
                      {sale.paymentStatus}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{sale.customerName}</p>
                </div>
                <div className="text-right space-y-0.5">
                  <span className="font-mono text-xs font-bold text-foreground">
                    {formatCurrency(sale.totalAmount)}
                  </span>
                  <p className="text-[10px] text-muted-foreground">
                    {formatDate(sale.createdAt, true)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
