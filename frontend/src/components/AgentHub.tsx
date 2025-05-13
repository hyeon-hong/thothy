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

    return (
        <div className="max-w-7xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold text-center mb-6 tracking-tight">Agent Hub</h1>
            {loading ? (
                <div className="flex justify-center items-center min-h-[300px]">
                    <span className="animate-spin h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full inline-block" />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-2">
                    {agents.map((agent) => (
                        <div key={agent.id}>
                            <AgentCard
                                agent={{
                                    ...agent,
                                    graph_name: agent.graph_name || ''
                                }}
                                onSelect={handleAgentSelect}
                                isSelected={selectedAgentIds.has(agent.id)}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
} 