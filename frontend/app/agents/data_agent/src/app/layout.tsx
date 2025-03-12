import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "./lib/utils";
import { NuqsAdapter } from "nuqs/adapters/next/app";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Open Canvas",
  description: "Open Canvas Chat UX by LangChain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-screen">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {/* <link href="/dist/styles.css" rel="stylesheet" /> */}
      </head>

      <body className={cn("min-h-full", inter.className)}>
        <NuqsAdapter>{children}</NuqsAdapter>
      </body>
    </html>
  );
}
