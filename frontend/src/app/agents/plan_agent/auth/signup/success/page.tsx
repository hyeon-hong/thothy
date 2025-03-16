"use client";

import { UserProvider } from "@/app/agents/plan_agent/contexts/UserContext";
import { SignupSuccess } from "@/app/agents/plan_agent/components/auth/signup/success";

export default function Page() {
  return (
    <UserProvider>
      <SignupSuccess />
    </UserProvider>
  );
}
