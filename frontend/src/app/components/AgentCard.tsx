"use client";

import React, { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardMedia,
    Typography,
    Button,
    Box,
    Paper,
    Chip,
    Tooltip,
    Avatar,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { createClient } from "@/utils/supabase/client";
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined';
import PsychologyAltOutlinedIcon from '@mui/icons-material/PsychologyAltOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import CodeIcon from '@mui/icons-material/Code';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import SchoolIcon from '@mui/icons-material/School';
import VideoCameraBackIcon from '@mui/icons-material/VideoCameraBack';
import RssFeedIcon from '@mui/icons-material/RssFeed';

interface Agent {
    id: string;
    name: string;
    description: string;
    imageUrl?: string;
    graph_name: string;
}

interface AgentCardProps {
    agent: Agent;
    onSelect?: (agentId: string) => void;
    isSelected?: boolean;
    showUnselect?: boolean;
}

const HeadlineTypography = styled(Typography)({
    fontFamily: "'Roboto Mono', monospace",
    fontWeight: 700,
    letterSpacing: "0.5px",
});

const StyledCard = styled(Card)({
    background: "rgba(255, 255, 255, 0.9)",
    backdropFilter: "blur(10px)",
    borderRadius: "12px",
    boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
    transition: "transform 0.3s ease-in-out, background-color 0.3s ease-in-out",
    "&:hover": {
        transform: "translateY(-5px)",
    },
});

const SelectButton = styled(Button)({
    borderRadius: "8px",
    padding: "8px 16px",
    textTransform: "uppercase",
    fontWeight: 600,
    letterSpacing: "1px",
    fontSize: "0.875rem",
});

const RunButton = styled(Button)({
    borderRadius: "8px",
    padding: "8px 16px",
    textTransform: "uppercase",
    fontWeight: 600,
    letterSpacing: "1px",
    fontSize: "0.875rem",
    backgroundColor: "#bbdefb",
    color: "#1976d2",
    "&:hover": {
        backgroundColor: "#90caf9",
    },
});

export default function AgentCard({
    agent,
    onSelect,
    isSelected: propIsSelected = false,
    showUnselect = false,
}: AgentCardProps) {
    const router = useRouter();
    const { user } = useAuth();
    const [isSelected, setIsSelected] = useState(propIsSelected);
    const supabase = createClient();

    useEffect(() => {
        const checkIfSelected = async () => {
            if (!user) return;

            try {
                const { data, error } = await supabase
                    .from("user_agents")
                    .select()
                    .eq("user_id", user.id)
                    .eq("agent_id", agent.id)
                    .maybeSingle();

                if (error) throw error;
                setIsSelected(!!data);
            } catch (error) {
                setIsSelected(false);
            }
        };

        checkIfSelected();
    }, [user, agent.id, supabase]);

    const handleSelect = async () => {
        if (!user) {
            alert("Please login to select an agent");
            return;
        }

        try {
            if (isSelected) {
                return;
            }

            const { error } = await supabase
                .from("user_agents")
                .insert({
                    user_id: user.id,
                    agent_id: agent.id,
                })
                .select()
                .single();

            if (error) {
                throw error;
            }

            setIsSelected(true);
            if (onSelect) {
                onSelect(agent.id);
            }
        } catch (error) {
            alert("Failed to select agent. Please try again.");
        }
    };

    const handleUnselect = async () => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from("user_agents")
                .delete()
                .eq("user_id", user.id)
                .eq("agent_id", agent.id);

            if (error) {
                throw error;
            }

            setIsSelected(false);
            if (onSelect) {
                onSelect(agent.id);
            }
        } catch (error) {
            alert("Failed to unselect agent. Please try again.");
        }
    };

    const handleCardClick = () => {
        if (agent.graph_name) {
            router.push(`/agents/${agent.graph_name}`);
        } else {
            alert("This agent doesn't have a valid configuration");
        }
    };

    return (
        <StyledCard
            sx={{
                maxWidth: 345,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                backgroundColor: isSelected
                    ? "rgba(237, 247, 237, 0.9)"
                    : "rgba(255, 255, 255, 0.9)",
            }}
        >
            {agent.imageUrl && (
                <CardMedia
                    component="img"
                    image={agent.imageUrl}
                    alt={agent.name}
                    sx={{
                        maxHeight: "220px",
                        height: "220px",
                        objectFit: "cover",
                        borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
                    }}
                />
            )}
            <CardContent sx={{ flexGrow: 1 }}>
                <HeadlineTypography gutterBottom variant="h5">
                    {agent.name}
                </HeadlineTypography>
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                        lineHeight: 1.6,
                        opacity: 0.8,
                    }}
                >
                    {agent.description}
                </Typography>
            </CardContent>
            <Box
                sx={{ p: 2, display: "flex", gap: 1, flexDirection: "column" }}
            >
                {showUnselect ? (
                    <>
                        <SelectButton
                            variant="contained"
                            color="error"
                            fullWidth
                            onClick={handleUnselect}
                        >
                            Unselect
                        </SelectButton>
                        <RunButton
                            variant="contained"
                            fullWidth
                            onClick={handleCardClick}
                        >
                            Run
                        </RunButton>
                    </>
                ) : (
                    <>
                        <SelectButton
                            variant="contained"
                            color={isSelected ? "success" : "primary"}
                            fullWidth
                            onClick={handleSelect}
                            disabled={isSelected}
                        >
                            {isSelected ? "Selected" : "Select"}
                        </SelectButton>
                        <RunButton
                            variant="contained"
                            fullWidth
                            onClick={handleCardClick}
                        >
                            Run
                        </RunButton>
                    </>
                )}
            </Box>
        </StyledCard>
    );
}
