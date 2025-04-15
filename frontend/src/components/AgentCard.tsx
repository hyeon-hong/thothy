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
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
    <Card 
      className={cn(
        "max-w-[345px] h-full flex flex-col transition-all duration-300 ease-in-out hover:-translate-y-1 backdrop-blur-lg shadow-lg overflow-hidden",
        isSelected ? "bg-primary/5" : "bg-card"
      )}
    >
      <div 
        className="h-[220px] w-full relative group"
        style={{
          background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="text-center">
            <h3 className="font-mono text-[2.5rem] font-black tracking-tight text-white drop-shadow-sm mb-2">
              {agent.name.split(' ').map((word, i) => (
                <React.Fragment key={i}>
                  {word}
                  <br />
                </React.Fragment>
              ))}
            </h3>
            <div className="w-16 h-1 mx-auto bg-white/50 rounded-full shadow-sm" />
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <CardContent className="flex-grow pt-6">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {agent.description}
        </p>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 p-4">
        {showUnselect ? (
          <>
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleUnselect}
            >
              Unselect
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleCardClick}
            >
              Run
            </Button>
          </>
        ) : (
          <>
            <Button
              variant={isSelected ? "outline" : "default"}
              className="w-full"
              onClick={handleSelect}
              disabled={isSelected}
            >
              {isSelected ? "Selected" : "Select"}
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleCardClick}
            >
              Run
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
