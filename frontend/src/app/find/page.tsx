"use client";

import React from "react";
import { Box } from "@mui/material";
import Header from "../components/Header";
import AgentHub from "../components/AgentHub";

export default function FindPage() {
  return (
    <Box>
      <Header currentView="find" />
      <AgentHub />
    </Box>
  );
} 