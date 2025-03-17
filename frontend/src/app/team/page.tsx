"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Container, Typography, Box } from '@mui/material';
import Header from '@/components/Header';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

type Agent = {
  id: string;
  name: string;
  description: string;
  image_url: string;
};

export default function TeamPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch('/api/agents');
        const data = await response.json();
        setAgents(data);
      } catch (error) {
        console.error('Error fetching agents:', error);
      }
    };

    if (user) {
      fetchAgents();
    }
  }, [user]);

  const toggleAgent = (agentId: string) => {
    setSelectedAgents((current) =>
      current.includes(agentId)
        ? current.filter((id) => id !== agentId)
        : [...current, agentId]
    );
  };

  const removeAgent = (agentId: string, e: React.MouseEvent<SVGSVGElement> | React.KeyboardEvent<SVGSVGElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedAgents((current) => current.filter((id) => id !== agentId));
  };

  const getAgentName = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    return agent ? agent.name : '';
  };

  if (loading) {
    return (
      <>
        <Header currentView="team" />
        <Container maxWidth="lg">
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography>Loading...</Typography>
          </Box>
        </Container>
      </>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Header currentView="team" />
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Team
          </Typography>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Select Agents</CardTitle>
              <CardDescription>
                Choose the agents you want to work with. You can select multiple agents.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1 p-2 mb-2 border rounded-md min-h-10">
                {selectedAgents.length === 0 && (
                  <span className="text-sm text-muted-foreground px-1 py-0.5">
                    No agents selected
                  </span>
                )}
                {selectedAgents.map((agentId) => (
                  <Badge key={agentId} variant="secondary" className="flex items-center gap-1 px-2 py-1">
                    {getAgentName(agentId)}
                    <button
                      type="button"
                      onClick={() => setSelectedAgents(current => current.filter(id => id !== agentId))}
                      className="ml-1 h-4 w-4 rounded-full inline-flex items-center justify-center hover:bg-muted-foreground/20"
                      aria-label={`Remove ${getAgentName(agentId)}`}
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </button>
                  </Badge>
                ))}
              </div>
              
              <Command className="border rounded-lg">
                <CommandInput placeholder="Search agents..." />
                <CommandEmpty>No agents found.</CommandEmpty>
                <CommandGroup>
                  {agents.map((agent) => (
                    <CommandItem
                      key={agent.id}
                      onSelect={() => toggleAgent(agent.id)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center space-x-2 mr-2">
                        <Checkbox 
                          id={`checkbox-${agent.id}`}
                          checked={selectedAgents.includes(agent.id)}
                          onCheckedChange={() => toggleAgent(agent.id)}
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center">
                          {agent.name}
                          {selectedAgents.includes(agent.id) && (
                            <Badge variant="secondary" className="ml-2">
                              Selected
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {agent.description}
                        </p>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </>
  );
} 