"use client";

import type React from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { NuqsAdapter } from "nuqs/adapters/next/app";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NuqsAdapter>
      <AuthProvider>{children}</AuthProvider>
    </NuqsAdapter>
  );
}
