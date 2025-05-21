import React, { useEffect } from "react";
import { useStreamContext } from "@langchain/langgraph-sdk/react-ui";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

// Type definitions based on the Financial Datasets API
type PriceSnapshot = {
  price: number;
  ticker: string;
  day_change: number;
  day_change_percent: number;
  market_cap: number;
  time: string;
  time_milliseconds: number;
};

type PricePoint = {
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
  time: string;
  time_milliseconds: number;
};

type Prices = PricePoint[];

export default function DataGraphComponent() {
  const { meta } = useStreamContext<
    { price_snapshot?: { snapshot: PriceSnapshot }, prices?: { prices: Prices } },
    { MetaType: { ui: any; artifact: any } }
  >();
  
  const [ArtifactContent, { open, setOpen, context, setContext }] =
    meta.artifact;

  useEffect(() => {
    setOpen(true);
  }, [context]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Format large numbers (for market cap, volume)
  const formatNumber = (num: number) => {
    if (num >= 1_000_000_000) {
      return `$${(num / 1_000_000_000).toFixed(2)}B`;
    } else if (num >= 1_000_000) {
      return `$${(num / 1_000_000).toFixed(2)}M`;
    } else if (num >= 1_000) {
      return `$${(num / 1_000).toFixed(2)}K`;
    }
    return `$${num.toFixed(2)}`;
  };

  // Format price data for display
  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  // Format percentage for display
  const formatPercentage = (percentage: number) => {
    const value = percentage.toFixed(2);
    return `${value}%`;
  };

  // Generate the chart data from prices
  const getChartData = (prices: Prices) => {
    return prices.map(price => ({
      ...price,
      // Format the time for display in the chart tooltip
      formattedTime: formatDate(price.time)
    }));
  };

  return (
    <div className="h-full">
      <button
        className="mb-4 px-4 py-2 rounded text-white bg-blue-600 hover:bg-blue-700 transition-colors font-semibold shadow"
        onClick={() => setOpen(!open)}
      >
        {open ? "Click to hide data" : "Click to display data"}
      </button>
      
      <ArtifactContent title={<div>Financial Data</div>}>
        <div className="space-y-4">
          {/* Display Price Snapshot Card if available */}
          {context.price_snapshot && (
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{context.price_snapshot.snapshot.ticker} Price Snapshot</span>
                  <span className={`text-lg font-bold ${context.price_snapshot.snapshot.day_change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatPrice(context.price_snapshot.snapshot.price)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm text-gray-500">Change (Daily)</div>
                    <div className={`font-medium ${context.price_snapshot.snapshot.day_change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {formatPrice(context.price_snapshot.snapshot.day_change)} ({formatPercentage(context.price_snapshot.snapshot.day_change_percent)})
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-500">Market Cap</div>
                    <div className="font-medium">{formatNumber(context.price_snapshot.snapshot.market_cap)}</div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="text-sm text-gray-500">
                Last Updated: {formatDate(context.price_snapshot.snapshot.time)}
              </CardFooter>
            </Card>
          )}

          {/* Display Price History Chart if available */}
          {context.prices && context.prices.prices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Price History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getChartData(context.prices.prices)} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="time" 
                        tickFormatter={(time) => {
                          const date = new Date(time);
                          return `${date.getMonth()+1}/${date.getDate()}`;
                        }}
                      />
                      <YAxis domain={['auto', 'auto']} />
                      <Tooltip 
                        labelFormatter={(value) => {
                          return `Date: ${formatDate(value.toString())}`;
                        }}
                        formatter={(value, name) => {
                          if (name === 'close') return [`Close: ${formatPrice(Number(value))}`, name];
                          if (name === 'open') return [`Open: ${formatPrice(Number(value))}`, name];
                          if (name === 'high') return [`High: ${formatPrice(Number(value))}`, name];
                          if (name === 'low') return [`Low: ${formatPrice(Number(value))}`, name];
                          if (name === 'volume') return [`Volume: ${formatNumber(Number(value))}`, name];
                          return [value, name];
                        }}
                      />
                      <Line type="monotone" dataKey="close" stroke="#8884d8" activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="high" stroke="#82ca9d" />
                      <Line type="monotone" dataKey="low" stroke="#ff7300" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter className="text-sm text-gray-500">
                Showing {context.prices.prices.length} data points
              </CardFooter>
            </Card>
          )}
          
          {/* Show raw data for debugging if needed */}
          {(!context.price_snapshot && !context.prices) && (
            <div className="p-4 border rounded bg-gray-50">
              <p>No financial data available.</p>
            </div>
          )}
        </div>
      </ArtifactContent>
    </div>
  );
}
