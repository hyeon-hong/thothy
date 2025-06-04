"use client";

import React from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";

const sidebarTriggerSVG = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6 2V14M5.2 2H10.8C11.9201 2 12.4802 2 12.908 2.21799C13.2843 2.40973 13.5903 2.71569 13.782 3.09202C14 3.51984 14 4.0799 14 5.2V10.8C14 11.9201 14 12.4802 13.782 12.908C13.5903 13.2843 13.2843 13.5903 12.908 13.782C12.4802 14 11.9201 14 10.8 14H5.2C4.07989 14 3.51984 14 3.09202 13.782C2.71569 13.5903 2.40973 13.2843 2.21799 12.908C2 12.4802 2 11.9201 2 10.8V5.2C2 4.07989 2 3.51984 2.21799 3.09202C2.40973 2.71569 2.71569 2.40973 3.09202 2.21799C3.51984 2 4.0799 2 5.2 2Z"
      stroke="#3F3F46"
      strokeWidth="1.66667"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function AppSidebarTrigger({
  isOutside,
  className,
}: {
  isOutside: boolean;
  className?: string;
}) {
  const { toggleSidebar, open } = useSidebar();

  if (isOutside && open) {
    // If this component is being rendered outside the sidebar view, then do not render if open.
    // This way we can render the trigger inside the main view when open.
    return null;
  }

  return (
    <TooltipIconButton
      tooltip="Toggle Sidebar"
      onClick={toggleSidebar}
      className={className}
    >
      {sidebarTriggerSVG}
    </TooltipIconButton>
  );
}
