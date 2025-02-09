"use client";

import React from "react";
import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import Header from "../../components/Header";
import RunAgent from "../../components/RunAgent";
import { Container } from "@mui/material";

const StyledContainer = styled(Container)(({ theme }) => ({
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
}));

export default function AgentPage() {
    return (
        <Box>
            <Header currentView="run" />
            <StyledContainer maxWidth="lg">
                <RunAgent />
            </StyledContainer>
        </Box>
    );
}
