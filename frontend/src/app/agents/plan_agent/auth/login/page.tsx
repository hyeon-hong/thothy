"use client";

import { Login } from "@/app/agents/plan_agent/components/auth/login/Login";
import { Suspense } from "react";

export default function Page() {
  return (
    <main className="h-screen">
      <Suspense fallback={<div>Loading...</div>}>
        <Login />
      </Suspense>
    </main>
  );
}
