"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { createClient } from "@/utils/supabase/client";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  graph_name: string;
  created_at?: string;
}

interface AgentCardProps {
  agent: Agent;
  onSelect?: (agentId: string) => void;
  isSelected?: boolean;
  showUnselect?: boolean;
}

// Function to generate a consistent gradient based on agent name
const getGradientColors = (name: string): [string, string] => {
  // Simple hash function to generate consistent numbers from string
  const hash = name.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  // Vibrant color pairs with explicit typing
  const colorPairs: Array<[string, string]> = [
    ['#FF6B6B', '#4ECDC4'], // Red to Teal
    ['#FFE66D', '#4CB8C4'], // Yellow to Cyan
    ['#A64DFF', '#FF6B6B'], // Purple to Red
    ['#00D2FF', '#FF5E62'], // Blue to Coral
    ['#4776E6', '#8E54E9'], // Electric Blue to Purple
    ['#FF8008', '#FFC837'], // Orange to Yellow
    ['#7303c0', '#ec38bc'], // Deep Purple to Pink
    ['#38ef7d', '#11998e'], // Bright Green to Teal
  ];

  // Use hash to select a consistent color pair
  const pairIndex = Math.abs(hash) % colorPairs.length;
  return colorPairs[pairIndex];
};

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
          .from("staffs")
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
        .from("staffs")
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
        .from("staffs")
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

  const [gradientStart, gradientEnd] = getGradientColors(agent.name);

  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>{agent.name}</CardTitle>
          <CardDescription>
            {agent.created_at ? (
              <>Added on {new Date(agent.created_at).toLocaleDateString()}</>
            ) : (
              <>Agent</>
            )}
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button size="icon" variant="outline" disabled>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" aria-label="Delete agent" disabled>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className={agent.graph_name ? "cursor-pointer" : ""} onClick={handleCardClick}>
        <p className="text-sm text-muted-foreground mb-2">{agent.description}</p>
        {agent.graph_name && (
          <div>
            <p className="text-sm font-medium mb-1">Graph Name:</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="cursor-pointer hover:bg-gray-100 transition-colors">
                {agent.graph_name}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
