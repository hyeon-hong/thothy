"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export type PriceData = {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
};

export type PricesChartProps = {
  ticker: string;
  priceData: PriceData[];
  startDate: string;
  endDate: string;
};

export function PricesChart({
  ticker,
  priceData,
  startDate,
  endDate,
}: PricesChartProps) {
  // Format dates for display
  const formattedStartDate = new Date(startDate).toLocaleDateString();
  const formattedEndDate = new Date(endDate).toLocaleDateString();

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          {ticker} Stock Price ({formattedStartDate} - {formattedEndDate})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={priceData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={["dataMin - 5", "dataMax + 5"]} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="open"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
              />
              <Line type="monotone" dataKey="close" stroke="#82ca9d" />
              <Line type="monotone" dataKey="high" stroke="#ff7300" />
              <Line type="monotone" dataKey="low" stroke="#ff0000" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 