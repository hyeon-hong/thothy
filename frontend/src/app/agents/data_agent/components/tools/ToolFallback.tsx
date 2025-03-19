import { ToolCallContentPartComponent } from "@assistant-ui/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

// Simple icon components to avoid type issues
const CheckMarkIcon = () => (
  <span className="inline-flex size-4 items-center justify-center">✓</span>
);

const ChevronUpIcon = () => (
  <span className="inline-flex items-center justify-center">▲</span>
);

const ChevronDownIcon = () => (
  <span className="inline-flex items-center justify-center">▼</span>
);

export const ToolFallback: ToolCallContentPartComponent = ({
  toolName,
  argsText,
  result,
}) => {
  console.log("[ToolFallback] Render called for tool:", toolName);
  console.log("[ToolFallback] Args text:", argsText);
  console.log("[ToolFallback] Result:", result);

  const [isCollapsed, setIsCollapsed] = useState(true);
  
  // If no tool name or args, don't render
  if (!toolName) {
    console.log("[ToolFallback] Missing tool name");
    return null;
  }

  return (
    <div className="mb-4 flex w-full flex-col gap-3 rounded-lg border py-3">
      <div className="flex items-center gap-2 px-4">
        <CheckMarkIcon />
        <p className="">
          Used tool: <b>{toolName}</b>
        </p>
        <div className="flex-grow" />
        <Button onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </Button>
      </div>
      {!isCollapsed && (
        <div className="flex flex-col gap-2 border-t pt-2">
          <div className="px-4">
            <pre className="whitespace-pre-wrap">{argsText || "No arguments"}</pre>
          </div>
          {result !== undefined && (
            <div className="border-t border-dashed px-4 pt-2">
              <p className="font-semibold">Result:</p>
              <pre className="whitespace-pre-wrap">
                {typeof result === "string"
                  ? result
                  : JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
