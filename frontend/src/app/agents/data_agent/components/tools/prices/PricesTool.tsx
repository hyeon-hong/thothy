"use client";

import { PricesChart, PriceData } from "./prices-chart";
import { makeAssistantToolUI } from "@assistant-ui/react";
import { sampleGooglePriceData } from "./sample-data";

type PricesToolArgs = {
  ticker: string;
  startDate: string;
  endDate: string;
};

type PricesToolResult = {
  priceData: PriceData[];
  error?: string;
};

// API response might have 'prices' instead of 'priceData'
type APIResponse = {
  ticker: string;
  prices: Array<{
    ticker: string;
    open: number;
    close: number;
    high: number;
    low: number;
    time: string;
    volume: number;
  }>;
  error?: string;
};

// This is a mock implementation that returns sample data for GOOGL
// In a real implementation, this would fetch data from an API
const mockGetPriceData = (ticker?: string, startDate?: string, endDate?: string): PriceData[] => {
  if (ticker && ticker.toUpperCase() === "GOOGL") {
    return sampleGooglePriceData;
  }
  return [];
};

// Convert API response format to our internal format
const transformAPIResponse = (response: any): PricesToolResult => {
  // If the response already has priceData, just return it
  if (response.priceData && Array.isArray(response.priceData)) {
    return response as PricesToolResult;
  }
  
  // If the response has prices array, transform it to priceData
  if (response.prices && Array.isArray(response.prices)) {
    // Map API data format to our PriceData format
    const priceData = response.prices.map((item: {
      ticker: string;
      open: number;
      close: number;
      high: number;
      low: number;
      time: string;
      volume: number;
    }) => {
      // Parse the date from the time string
      const date = new Date(item.time);
      // Format the date as a readable string (e.g., "September 15, 2023")
      const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      return {
        date: formattedDate,
        open: item.open,
        close: item.close,
        high: item.high,
        low: item.low
      };
    });
    
    return { priceData };
  }
  
  // If no valid data format found
  return { priceData: [], error: "Invalid data format" };
};

export const PricesTool = makeAssistantToolUI<PricesToolArgs, string>({
  toolName: "prices",
  render: function PricesUI({ args, result, status }) {
    // If no arguments yet, don't render anything
    if (!args || !args.ticker) {
      return null;
    }
    
    let resultObj: PricesToolResult;
    
    // If no result is provided yet, use our mock implementation
    if (!result) {
      const priceData = mockGetPriceData(args.ticker, args.startDate, args.endDate);
      resultObj = { priceData };
    } else {
      try {
        const parsedResult = JSON.parse(result);
        
        // Transform the API response to our internal format
        resultObj = transformAPIResponse(parsedResult);
      } catch (e) {
        resultObj = { priceData: [], error: result };
      }
    }
    
    // Extract actual date range from the price data if available
    let startDate = args.startDate || "";
    let endDate = args.endDate || "";
    
    // If we have price data, extract the first and last dates
    if (resultObj.priceData && resultObj.priceData.length > 0) {
      const sortedData = [...resultObj.priceData].sort((a, b) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
      
      // Get the first and last dates from sorted data
      startDate = sortedData[0].date;
      endDate = sortedData[sortedData.length - 1].date;
    }
    
    return (
      <div className="mb-4 flex flex-col items-center gap-2">
        <pre className="whitespace-pre-wrap break-all text-center">
          prices({JSON.stringify(args)})
        </pre>
        {resultObj.priceData && resultObj.priceData.length > 0 && (
          <PricesChart
            ticker={args.ticker}
            priceData={resultObj.priceData}
            startDate={startDate}
            endDate={endDate}
          />
        )}
        {resultObj.error && (
          <p className="text-red-500">{resultObj.error}</p>
        )}
        {(!resultObj.priceData || resultObj.priceData.length === 0) && !resultObj.error && (
          <p className="text-yellow-500">No price data available for {args.ticker}</p>
        )}
      </div>
    );
  },
}); 