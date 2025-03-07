"use client";

import React from "react";
import { Box } from "@mui/material";
import Header from "../components/Header";
import MyAgents from "../components/MyAgents";

export default function StaffPage() {
  return (
    <Box>
      <Header currentView="staff" />
      <MyAgents />
    </Box>
  );
} 