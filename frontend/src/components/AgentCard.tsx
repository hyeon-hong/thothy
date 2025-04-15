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

  return (
    <Card 
      className={cn(
        "max-w-[345px] h-full flex flex-col transition-all duration-300 ease-in-out hover:-translate-y-1 backdrop-blur-lg shadow-lg",
        isSelected ? "bg-primary/5" : "bg-card"
      )}
    >
      {agent.imageUrl && (
        <div className="h-[220px] w-full overflow-hidden border-b">
          <img
            src={agent.imageUrl}
            alt={agent.name}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="font-mono font-bold tracking-wide">
          {agent.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
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
