import { FC, useState } from "react";
import { Check, Copy } from "lucide-react";
import { TooltipIconButton } from "./tooltip-icon-button";

export interface CodeHeaderProps {
  language?: string;
  code: string;
}

const useCopyToClipboard = () => {
  const [copied, setCopied] = useState(false);

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return { copied, copy };
};

export const CodeHeader: FC<CodeHeaderProps> = ({ language, code }) => {
  const { copied, copy } = useCopyToClipboard();

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted">
      <div className="text-sm text-muted-foreground">{language}</div>
      <TooltipIconButton
        onClick={() => copy(code)}
        tooltip={copied ? "Copied!" : "Copy code"}
      >
        {copied ? (
          <Check className="h-4 w-4" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </TooltipIconButton>
    </div>
  );
}; 