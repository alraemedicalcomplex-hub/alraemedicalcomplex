"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface SalesChartProps {
  data: {
    month: string;
    sales: number;
    purchases: number;
    expenses: number;
  }[];
}

export function SalesChart({ data }: SalesChartProps) {
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base font-semibold">
            Financial Performance Overview
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quarterly Revenue vs Inventory Purchases & Operating Expenses (PKR)
          </p>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.6} />
              <XAxis
                dataKey="month"
                stroke="#64748B"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `Rs.${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border border-border bg-card p-3 shadow-xl text-xs space-y-1">
                        <p className="font-semibold text-foreground mb-1">
                          {payload[0]?.payload?.month}
                        </p>
                        {payload.map((entry, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between gap-4"
                          >
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              />
                              {entry.name}:
                            </span>
                            <span className="font-mono font-medium text-foreground">
                              {formatCurrency(entry.value as number)}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
              />
              <Bar
                dataKey="sales"
                name="Sales Revenue"
                fill="#6366F1"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="purchases"
                name="Procurement Cost"
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="expenses"
                name="Expenses"
                fill="#EF4444"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
