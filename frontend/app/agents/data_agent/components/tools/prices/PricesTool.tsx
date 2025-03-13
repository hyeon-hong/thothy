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

// This is a mock implementation that returns sample data for GOOGL
// In a real implementation, this would fetch data from an API
const mockGetPriceData = (ticker?: string, startDate?: string, endDate?: string): PriceData[] => {
  console.log(`[PricesTool] mockGetPriceData called with ticker: ${ticker}, startDate: ${startDate}, endDate: ${endDate}`);
  if (ticker && ticker.toUpperCase() === "GOOGL") {
    console.log(`[PricesTool] Returning sample data for GOOGL with ${sampleGooglePriceData.length} entries`);
    return sampleGooglePriceData;
  }
  console.log(`[PricesTool] No data available for ticker: ${ticker || 'undefined'}`);
  return [];
};

export const PricesTool = makeAssistantToolUI<PricesToolArgs, string>({
  toolName: "prices",
  render: function PricesUI({ args, result, status }) {
    console.log(`[PricesTool] Render called with args:`, args);
    console.log(`[PricesTool] Result provided:`, result ? "yes" : "no");
    console.log(`[PricesTool] Status:`, status?.type);
    
    // If no arguments yet, don't render anything
    if (!args || !args.ticker) {
      console.log(`[PricesTool] Tool not yet called with valid arguments`);
      return null;
    }
    
    let resultObj: PricesToolResult;
    
    // If no result is provided yet, use our mock implementation
    if (!result) {
      console.log(`[PricesTool] No result provided, using mock implementation`);
      const priceData = mockGetPriceData(args.ticker, args.startDate, args.endDate);
      resultObj = { priceData };
      console.log(`[PricesTool] Mock data obtained with ${priceData.length} entries`);
    } else {
      try {
        console.log(`[PricesTool] Parsing result from JSON`);
        resultObj = JSON.parse(result);
        console.log(`[PricesTool] Result parsed successfully with ${resultObj.priceData?.length || 0} entries`);
      } catch (e) {
        console.error(`[PricesTool] Error parsing result:`, e);
        resultObj = { priceData: [], error: result };
      }
    }

    console.log(`[PricesTool] Rendering component with ${resultObj.priceData?.length || 0} data points`);
    
    return (
      <div className="mb-4 flex flex-col items-center gap-2">
        <pre className="whitespace-pre-wrap break-all text-center">
          prices({JSON.stringify(args)})
        </pre>
        {resultObj.priceData && resultObj.priceData.length > 0 && (
          <PricesChart
            ticker={args.ticker}
            priceData={resultObj.priceData}
            startDate={args.startDate}
            endDate={args.endDate}
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