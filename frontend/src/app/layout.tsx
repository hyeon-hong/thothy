import '@/app/globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from "@/contexts/AuthContext";
import { NuqsAdapter } from "nuqs/adapters/next/app";

export const metadata: Metadata = {
  title: "Thothy",
  description: "Thothy",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <NuqsAdapter>
          <AuthProvider>{children}</AuthProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
