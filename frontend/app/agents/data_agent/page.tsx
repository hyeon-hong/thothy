"use client";

import { Thread } from "@/components/assistant-ui/thread";
import { PriceSnapshotTool } from "./components/tools/price-snapshot/PriceSnapshotTool";
import { PurchaseStockTool } from "./components/tools/purchase-stock/PurchaseStockTool";
import { PricesTool } from "./components/tools/prices/PricesTool";
import { ToolFallback } from "./components/tools/ToolFallback";
import { MarkdownText } from "@/components/assistant-ui/markdown-text";
import { MyRuntimeProvider } from "./MyRuntimeProvider";
import { useEffect } from "react";

export default function DataAgentPage() {
  // Log that page is rendering and the tools are being loaded
  useEffect(() => {
    console.log('[DataAgentPage] Page mounted, initializing tools');
    console.log('[DataAgentPage] Tools being registered with AssistantRuntimeProvider:');
    // Access toolName using type assertion since it's a property of the component definition
    console.log('[DataAgentPage] - PriceSnapshotTool:', (PriceSnapshotTool as any).toolName);
    console.log('[DataAgentPage] - PurchaseStockTool:', (PurchaseStockTool as any).toolName);
    console.log('[DataAgentPage] - PricesTool:', (PricesTool as any).toolName);
  }, []);
  
  return (
    <div className="flex h-full flex-col">
      <MyRuntimeProvider>
        {/* Render tool UIs directly inside the AssistantRuntimeProvider */}
        <PriceSnapshotTool />
        <PurchaseStockTool />
        <PricesTool />
        
        {/* Thread component now only needs welcomeSuggestions and toolFallback */}
        <Thread 
          toolFallback={ToolFallback}
          welcomeSuggestions={[
            { prompt: "How much revenue did Apple make last year?" },
            { prompt: "Is McDonald's profitable?" },
            { prompt: "What's the current stock price of Tesla?" },
            { prompt: "Show me the price history of GOOGL for the past month" },
          ]}
        />
      </MyRuntimeProvider>
    </div>
  );
}
