"use client";

import { PriceSnapshotTool } from "./components/tools/price-snapshot/PriceSnapshotTool";
import { PurchaseStockTool } from "./components/tools/purchase-stock/PurchaseStockTool";
import { PricesTool } from "./components/tools/prices/PricesTool";
import { ToolFallback } from "./components/tools/ToolFallback";
import { MyRuntimeProvider } from "./MyRuntimeProvider";
import React from "react";
import { Thread } from "@/components/assistant-ui/thread";

export default function DataAgentPage() {
  return (
    <div className="flex h-full flex-col">
      <MyRuntimeProvider>
        {/* Render tool UIs */}
        <PriceSnapshotTool />
        <PurchaseStockTool />
        <PricesTool />
        
        <Thread
          welcomeSuggestions={[
            {
              prompt: "How much revenue did Apple make last year?",
            },
            {
              prompt: "Is McDonald's profitable?",
            },
            {
              prompt: "What's the current stock price of Tesla?",
            },
            {
              prompt: "Show me the price history of GOOGL for the past month",
            },
          ]}
          toolFallback={ToolFallback}
        />
      </MyRuntimeProvider>
    </div>
  );
}
