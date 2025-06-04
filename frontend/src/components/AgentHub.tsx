"use client";

import React, { useState, useEffect } from "react";
import AgentCard from "./AgentCard";
import { useAuth } from "../contexts/AuthContext";

interface Agent {
    id: string;
    name: string;
    description: string;
    graph_name?: string;
    code?: string;
}

export default function AgentHub() {
    const { user } = useAuth();
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAgentIds, setSelectedAgentIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchAgents = async () => {
            setLoading(true);
            try {
                const response = await fetch("/api/agents");
                const data = await response.json();
                setAgents(data);
            } catch (error) {
                setAgents([]);
            } finally {
                setLoading(false);
            }
        };
        fetchAgents();
    }, []);

    useEffect(() => {
        const fetchSelectedAgents = async () => {
            if (!user?.id) {
                setSelectedAgentIds(new Set());
                return;
            }
            try {
                const response = await fetch(
                    `/api/agents/user?userId=${user.id}`
                );
                const data = await response.json();
                if (Array.isArray(data)) {
                    setSelectedAgentIds(new Set(data.map((agent: Agent) => agent.id)));
                } else {
                    setSelectedAgentIds(new Set());
                }
            } catch (error) {
                setSelectedAgentIds(new Set());
            }
        };
        fetchSelectedAgents();
    }, [user?.id]);

    const handleAgentSelect = (agentId: string) => {
        setSelectedAgentIds((prev) => new Set([...prev, agentId]));
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[200px]">
                <p>Loading...</p>
            </div>
        );
    }

    if (agents.length === 0) {
        return (
            <p className="text-center text-muted-foreground">
                No agents found. Start by creating your first agent!
            </p>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {agents.map((agent) => (
                <AgentCard
                    key={agent.id}
                    agent={{ ...agent, graph_name: agent.graph_name || '' }}
                    onSelect={handleAgentSelect}
                    isSelected={selectedAgentIds.has(agent.id)}
                />
            ))}
        </div>
    );
} 