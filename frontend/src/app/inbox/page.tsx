"use client";

import { AgentInbox } from "@/components/agent-inbox";
import React, { useEffect } from "react";
import { Toaster } from "sonner";
import { ThreadsProvider } from "@/components/agent-inbox/contexts/ThreadContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import Header from "@/components/Header";
import { AppSidebar, AppSidebarTrigger } from "@/components/app-sidebar";
import { BreadCrumb } from "@/components/agent-inbox/components/breadcrumb";
import { cn } from "@/lib/utils";

export default function InboxPage(): React.ReactNode {
  useEffect(() => {
    console.log("InboxPage mounted");
  }, []);

  return (
    <React.Suspense fallback={<div>Loading (layout)...</div>}>
      <Toaster position="top-right" expand={true} richColors />
      <Header currentView="inbox" />
      <ThreadsProvider>
        <SidebarProvider>
          <AppSidebar />
          <main className="flex flex-row w-full min-h-full pt-6 pl-6 gap-6">
            <AppSidebarTrigger isOutside={true} />
            <div className="flex flex-col gap-6 w-full min-h-full">
              <BreadCrumb className="pl-5" />
              <div
                className={cn(
                  "h-full bg-white rounded-tl-[58px]",
                  "overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                )}
              >
                <div className="flex flex-col w-full h-full">
                  <AgentInbox />
                </div>
              </div>
            </div>
          </main>
        </SidebarProvider>
      </ThreadsProvider>
    </React.Suspense>
  );
}
