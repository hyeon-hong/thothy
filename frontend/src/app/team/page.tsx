"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Container, Typography, Box, Button } from '@mui/material';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Check, X, Users, ChevronUp, ChevronDown } from "lucide-react";
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showSelectionList, setShowSelectionList] = useState(true);

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
          
          <div className="my-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Typography variant="h6" component="h3">
                  Your Selected Agents
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {selectedAgents.length === 0 
                    ? "No agents selected yet" 
                    : `${selectedAgents.length} agent${selectedAgents.length > 1 ? 's' : ''} selected`}
                </Typography>
              </div>
              
              <Button 
                variant="outlined" 
                startIcon={<Users />}
                onClick={() => setDialogOpen(true)}
              >
                Select Agents
              </Button>
            </div>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Select Agents</DialogTitle>
                  <DialogDescription>
                    Choose the agents you want to work with. You can select multiple agents.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="mt-4 flex flex-col" style={{ height: "400px" }}>
                  <div className="flex flex-wrap gap-1 p-2 mb-2 border rounded-md min-h-10 relative">
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
                    <button
                      type="button"
                      onClick={() => setShowSelectionList(prev => !prev)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 rounded-full flex items-center justify-center hover:bg-muted-foreground/10"
                      aria-label={showSelectionList ? "Hide selection list" : "Show selection list"}
                    >
                      {showSelectionList ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-hidden flex flex-col">
                    {showSelectionList ? (
                      <Command className="border rounded-lg flex-1 overflow-auto">
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
                                  className={cn(
                                    "transition-colors",
                                    selectedAgents.includes(agent.id) 
                                      ? "border-primary data-[state=checked]:bg-white data-[state=checked]:text-black" 
                                      : ""
                                  )}
                                  style={{
                                    ...(selectedAgents.includes(agent.id) ? {
                                      '--tw-checkbox-bg': 'white',
                                      '--tw-checkbox-fg': 'black',
                                    } : {})
                                  } as React.CSSProperties}
                                />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center">
                                  <span className={selectedAgents.includes(agent.id) ? "font-medium" : ""}>
                                    {agent.name}
                                  </span>
                                  {selectedAgents.includes(agent.id) && (
                                    <Badge variant="secondary" className="ml-2 bg-white text-black border border-gray-300">
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
                    ) : (
                      <div className="border rounded-lg flex-1 flex items-center justify-center p-4 text-muted-foreground text-sm">
                        Click the arrow button above to view agents
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            {selectedAgents.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {selectedAgents.map((agentId) => {
                  const agent = agents.find(a => a.id === agentId);
                  return agent ? (
                    <Card key={agent.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{agent.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{agent.description}</p>
                      </CardContent>
                    </Card>
                  ) : null;
                })}
              </div>
            )}
          </div>
        </Box>
      </Container>
    </>
  );
} 