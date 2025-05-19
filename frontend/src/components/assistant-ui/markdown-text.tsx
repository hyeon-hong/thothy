"use client";

import { FC } from "react";
import Markdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { CodeHeader } from "./code-header";
import { SyntaxHighlighter } from "./syntax-highlighter";

import "katex/dist/katex.min.css";

interface MarkdownTextProps {
  children: string;
}

const defaultComponents = {
  table: ({ children, ...props }) => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-muted" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }) => (
    <tbody className="divide-y divide-border bg-background" {...props}>
      {children}
    </tbody>
  ),
  tr: ({ children, ...props }) => (
    <tr className="transition-colors hover:bg-muted/50" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }) => (
    <th
      className="whitespace-nowrap px-4 py-3.5 text-left text-sm font-semibold text-foreground"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td
      className="whitespace-nowrap px-4 py-4 text-sm text-muted-foreground"
      {...props}
    >
      {children}
    </td>
  ),
  pre: ({ children }) => <>{children}</>,
  code: ({ className, children, ...props }) => {
    const language = className?.replace("language-", "");
    const code = String(children).replace(/\n$/, "");

    return (
      <div className="group relative my-4 rounded-lg border bg-zinc-950">
        {language && <CodeHeader language={language} code={code} />}
        <SyntaxHighlighter language={language} {...props}>
          {code}
        </SyntaxHighlighter>
      </div>
    );
  },
  details: ({ children, ...props }) => (
    <details className="my-4 rounded-lg border bg-muted p-4" {...props}>
      {children}
    </details>
  ),
  summary: ({ children, ...props }) => (
    <summary className="cursor-pointer font-medium" {...props}>
      {children}
    </summary>
  ),
  h1: ({ children, ...props }) => (
    <h1 className="scroll-m-20 text-4xl font-bold tracking-tight" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2
      className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3
      className="scroll-m-20 text-2xl font-semibold tracking-tight"
      {...props}
    >
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4
      className="scroll-m-20 text-xl font-semibold tracking-tight"
      {...props}
    >
      {children}
    </h4>
  ),
  h5: ({ children, ...props }) => (
    <h5
      className="scroll-m-20 text-lg font-semibold tracking-tight"
      {...props}
    >
      {children}
    </h5>
  ),
  h6: ({ className, ...props }) => (
    <h6 className={cn("my-4 font-semibold first:mt-0 last:mb-0", className)} {...props} />
  ),
  p: ({ className, ...props }) => (
    <p className={cn("mb-5 mt-5 leading-7 first:mt-0 last:mb-0", className)} {...props} />
  ),
  a: ({ className, ...props }) => (
    <a className={cn("text-primary font-medium underline underline-offset-4", className)} {...props} />
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote className={cn("border-l-2 pl-6 italic", className)} {...props} />
  ),
  ul: ({ className, ...props }) => (
    <ul className={cn("my-5 ml-6 list-disc [&>li]:mt-2", className)} {...props} />
  ),
  ol: ({ className, ...props }) => (
    <ol className={cn("my-5 ml-6 list-decimal [&>li]:mt-2", className)} {...props} />
  ),
  hr: ({ className, ...props }) => (
    <hr className={cn("my-5 border-b", className)} {...props} />
  ),
  sup: ({ className, ...props }) => (
    <sup className={cn("[&>a]:text-xs [&>a]:no-underline", className)} {...props} />
  ),
};

export const MarkdownText: FC<MarkdownTextProps> = ({ children }) => {
  return (
    <Markdown
      components={defaultComponents}
      remarkPlugins={[remarkGfm as any, remarkMath as any]}
      rehypePlugins={[rehypeKatex]}
    >
      {children}
    </Markdown>
  );
};
