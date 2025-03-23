"use client";

import { ThreadPrimitive } from "@assistant-ui/react";
import { PriceSnapshotTool } from "./components/tools/price-snapshot/PriceSnapshotTool";
import { PurchaseStockTool } from "./components/tools/purchase-stock/PurchaseStockTool";
import { PricesTool } from "./components/tools/prices/PricesTool";
import { ToolFallback } from "./components/tools/ToolFallback";
import { MyRuntimeProvider } from "./MyRuntimeProvider";
import { useEffect } from "react";
import React from "react";
import { MarkdownText } from "@/components/assistant-ui/markdown-text";
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
          ]}
          toolFallback={ToolFallback}
        />
      </MyRuntimeProvider>
    </div>
  );
}

// Simple Thread component directly in this file to avoid type issues
const SimpleThread = () => {
  const welcomeSuggestions = [
    { prompt: "How much revenue did Apple make last year?" },
    { prompt: "Is McDonald's profitable?" },
    { prompt: "What's the current stock price of Tesla?" },
    { prompt: "Show me the price history of GOOGL for the past month" },
  ];

  return (
    <ThreadPrimitive.Root
      className="bg-background box-border flex h-full flex-col overflow-hidden"
      style={{
        ["--thread-max-width" as string]: "42rem",
      }}
    >
      <ThreadPrimitive.Viewport className="flex h-full flex-col items-center overflow-y-scroll scroll-smooth bg-inherit px-4 pt-8">
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold mb-4">How can I help you today?</h2>
          <div className="flex flex-wrap gap-2 justify-center">
            {welcomeSuggestions.map((suggestion, i) => (
              <button
                key={i}
                className="bg-gray-100 hover:bg-gray-200 rounded-lg px-4 py-2 text-sm"
              >
                {suggestion.prompt}
              </button>
            ))}
          </div>
        </div>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
};

function DataAgentPageBackUp() {
  // Log that page is rendering and the tools are being loaded
  useEffect(() => {
    console.log("[DataAgentPage] Page mounted, initializing tools");
    console.log(
      "[DataAgentPage] Tools being registered with AssistantRuntimeProvider:"
    );
    // Access toolName using type assertion since it's a property of the component definition
    console.log(
      "[DataAgentPage] - PriceSnapshotTool:",
      (PriceSnapshotTool as any).toolName
    );
    console.log(
      "[DataAgentPage] - PurchaseStockTool:",
      (PurchaseStockTool as any).toolName
    );
    console.log("[DataAgentPage] - PricesTool:", (PricesTool as any).toolName);
  }, []);

  return (
    <div className="flex h-full flex-col">
      <MyRuntimeProvider>
        {/* Render tool UIs directly inside the AssistantRuntimeProvider */}
        <PriceSnapshotTool />
        <PurchaseStockTool />
        <PricesTool />

        {/* Use simplified thread component */}
        <SimpleThread />
      </MyRuntimeProvider>
    </div>
  );
}
