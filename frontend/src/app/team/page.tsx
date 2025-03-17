"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Container, Typography, Box, Button } from "@mui/material";
import Header from "@/components/Header";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Check, X, Users, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Agent = {
  id: string;
  name: string;
  description: string;
  image_url: string;
};

type Team = {
  id: string;
  name: string;
  description: string;
  agent_list: string[];
  created_at: string;
};

export default function TeamPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showSelectionList, setShowSelectionList] = useState(true);
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/signin");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch("/api/teams");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setTeams(data);
      } catch (error) {
        console.error("Error fetching teams:", error);
      }
    };

    if (user) {
      fetchTeams();
    }
  }, [user]);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch("/api/agents");
        const data = await response.json();
        setAgents(data);
      } catch (error) {
        console.error("Error fetching agents:", error);
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

  const removeAgent = (
    agentId: string,
    e: React.MouseEvent<SVGSVGElement> | React.KeyboardEvent<SVGSVGElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedAgents((current) => current.filter((id) => id !== agentId));
  };

  const getAgentName = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    return agent ? agent.name : "";
  };

  const handleBuildTeam = async () => {
    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: teamName,
          description: teamDescription,
          agent_ids: selectedAgents,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      // Add the new team to the teams list
      setTeams((prevTeams) => [data, ...prevTeams]);

      // Reset form
      setTeamName("");
      setTeamDescription("");
      setSelectedAgents([]);
      setDialogOpen(false);
    } catch (error) {
      console.error("Error creating team:", error);
    }
  };

  if (loading) {
    return (
      <>
        <Header currentView="team" />
        <Container maxWidth="lg">
          <Box sx={{ mt: 4, textAlign: "center" }}>
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
                  Your Teams
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {teams.length === 0
                    ? "No teams created yet"
                    : `${teams.length} team${teams.length > 1 ? "s" : ""}`}
                </Typography>
              </div>

              <Button
                variant="outlined"
                startIcon={<Users />}
                onClick={() => setDialogOpen(true)}
              >
                Build a team
              </Button>
            </div>

            {/* Display Teams */}
            {teams.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {teams.map((team) => (
                  <Card key={team.id} className="flex flex-col">
                    <CardHeader>
                      <CardTitle>{team.name}</CardTitle>
                      <CardDescription>
                        Created on{" "}
                        {new Date(team.created_at).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {team.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {team.agent_list.map((agentId) => {
                          const agent = agents.find((a) => a.id === agentId);
                          return agent ? (
                            <Badge key={agentId} variant="secondary">
                              {agent.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Build a team</DialogTitle>
                  <DialogDescription>
                    Create your team and choose the agents you want to work
                    with.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label htmlFor="team-name">Team name</Label>
                    <Input
                      id="team-name"
                      value={teamName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setTeamName(e.target.value)
                      }
                      placeholder="Enter team name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="team-description">Team description</Label>
                    <Textarea
                      id="team-description"
                      value={teamDescription}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setTeamDescription(e.target.value)
                      }
                      placeholder="Describe your team's purpose"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-col" style={{ height: "400px" }}>
                  <div className="flex flex-wrap gap-1 p-2 mb-2 border rounded-md min-h-10 relative">
                    {selectedAgents.length === 0 && (
                      <span className="text-sm text-muted-foreground px-1 py-0.5">
                        No agents selected
                      </span>
                    )}
                    {selectedAgents.map((agentId) => (
                      <Badge
                        key={agentId}
                        variant="secondary"
                        className="flex items-center gap-1 px-2 py-1"
                      >
                        {getAgentName(agentId)}
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedAgents((current) =>
                              current.filter((id) => id !== agentId)
                            )
                          }
                          className="ml-1 h-4 w-4 rounded-full inline-flex items-center justify-center hover:bg-muted-foreground/20"
                          aria-label={`Remove ${getAgentName(agentId)}`}
                        >
                          <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                        </button>
                      </Badge>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowSelectionList((prev) => !prev)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 rounded-full flex items-center justify-center hover:bg-muted-foreground/10"
                      aria-label={
                        showSelectionList
                          ? "Hide selection list"
                          : "Show selection list"
                      }
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
                      <Command
                        className="border rounded-lg flex-1 overflow-hidden"
                        style={{
                          height: "300px",
                        }}
                      >
                        <CommandInput placeholder="Search agents..." />
                        <CommandEmpty>No agents found.</CommandEmpty>
                        <CommandGroup className="overflow-y-auto h-full custom-scrollbar">
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
                                  onClick={(e: React.MouseEvent) =>
                                    e.stopPropagation()
                                  }
                                  className={cn(
                                    "transition-colors",
                                    selectedAgents.includes(agent.id)
                                      ? "border-primary data-[state=checked]:bg-white data-[state=checked]:text-black"
                                      : ""
                                  )}
                                  style={
                                    {
                                      ...(selectedAgents.includes(agent.id)
                                        ? {
                                            "--tw-checkbox-bg": "white",
                                            "--tw-checkbox-fg": "black",
                                          }
                                        : {}),
                                    } as React.CSSProperties
                                  }
                                />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center">
                                  <span
                                    className={
                                      selectedAgents.includes(agent.id)
                                        ? "font-medium"
                                        : ""
                                    }
                                  >
                                    {agent.name}
                                  </span>
                                  {selectedAgents.includes(agent.id) && (
                                    <Badge
                                      variant="secondary"
                                      className="ml-2 bg-white text-black border border-gray-300"
                                    >
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

                <DialogFooter className="mt-4">
                  <Button variant="contained" onClick={handleBuildTeam}>
                    Build
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </Box>
      </Container>
    </>
  );
}
