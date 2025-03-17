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
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedAgents.includes(agent.id) ? "opacity-100" : "opacity-0"
                        )}
                      />
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