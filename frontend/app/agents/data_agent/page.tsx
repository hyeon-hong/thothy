"use client";

import { Thread } from "@assistant-ui/react";
import { PriceSnapshotTool } from "./components/tools/price-snapshot/PriceSnapshotTool";
import { PurchaseStockTool } from "./components/tools/purchase-stock/PurchaseStockTool";
import { ToolFallback } from "./components/tools/ToolFallback";
import { makeMarkdownText } from "@assistant-ui/react-markdown";
import { MyRuntimeProvider } from "./MyRuntimeProvider";

const MarkdownText = makeMarkdownText({});

export default function DataAgentPage() {
  return (
    <div className="flex h-full flex-col">
      <MyRuntimeProvider>
        <Thread
          welcome={{
            suggestions: [
              {
                prompt: "How much revenue did Apple make last year?",
              },
              {
                prompt: "Is McDonald's profitable?",
              },
              {
                prompt: "What's the current stock price of Tesla?",
              },
            ],
          }}
          assistantMessage={{
            components: { Text: MarkdownText, ToolFallback },
          }}
          tools={[PriceSnapshotTool, PurchaseStockTool]}
        />
      </MyRuntimeProvider>
    </div>
  );
}
