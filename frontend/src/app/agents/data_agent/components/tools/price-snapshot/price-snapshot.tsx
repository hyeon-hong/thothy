"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PriceSnapshotToolArgs = {
  ticker: string;
};

type PriceSnapshotToolResult = {
  price: number;
  day_change: number;
  day_change_percent: number;
  time: string;
};

// Simple arrow components to avoid type issues
const ArrowUpIndicator = () => (
  <span className="mr-1 inline-block text-green-500">↑</span>
);

const ArrowDownIndicator = () => (
  <span className="mr-1 inline-block text-red-500">↓</span>
);

export function PriceSnapshot({
  ticker,
  price,
  day_change,
  day_change_percent,
  time,
}: PriceSnapshotToolArgs & PriceSnapshotToolResult) {
  const isPositive = day_change >= 0;
  const changeColor = isPositive ? "text-green-500" : "text-red-500";

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{ticker}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <p className="text-3xl font-semibold">${price?.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Day Change</p>
            <p className={`flex items-center text-lg font-medium ${changeColor}`}>
              {isPositive ? <ArrowUpIndicator /> : <ArrowDownIndicator />}$
              {Math.abs(day_change)?.toFixed(2)} (
              {Math.abs(day_change_percent)?.toFixed(2)}%)
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Last Updated</p>
            <p className="text-lg font-medium">
              {new Date(time).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
