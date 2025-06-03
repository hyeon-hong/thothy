"use client";

import { Thread } from "@/components/thread";
import React from "react";

export default function UIBuildAgentPage(props: {
  apiUrl: string;
  assistantId: string;
}): React.ReactNode {
  return <Thread />;
}
