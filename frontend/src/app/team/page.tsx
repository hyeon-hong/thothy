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
import { Check, X, Users, ChevronUp, ChevronDown, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { v4 as uuidv4 } from "uuid";

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

type TeamDialogProps = {
  isEdit?: boolean;
  teamName: string;
  setTeamName: (name: string) => void;
  teamDescription: string;
  setTeamDescription: (desc: string) => void;
  selectedAgents: string[];
  setSelectedAgents: React.Dispatch<React.SetStateAction<string[]>>;
  showSelectionList: boolean;
  setShowSelectionList: React.Dispatch<React.SetStateAction<boolean>>;
  agents: Agent[];
  onSubmit: () => void;
  getAgentName: (id: string) => string;
  toggleAgent: (id: string) => void;
};

const TeamDialog = ({
  isEdit = false,
  teamName,
  setTeamName,
  teamDescription,
  setTeamDescription,
  selectedAgents,
  setSelectedAgents,
  showSelectionList,
  setShowSelectionList,
  agents = [],
  onSubmit,
  getAgentName,
  toggleAgent,
}: TeamDialogProps) => (
  <DialogContent className="sm:max-w-[600px]">
    <DialogHeader>
      <DialogTitle>{isEdit ? "Edit team" : "Build a team"}</DialogTitle>
      <DialogDescription>
        {isEdit
          ? "Update your team details and agents."
          : "Create your team and choose the agents you want to work with."}
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
            showSelectionList ? "Hide selection list" : "Show selection list"
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
          agents ? (
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
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
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
          )
        ) : (
          <div className="border rounded-lg flex-1 flex items-center justify-center p-4 text-muted-foreground text-sm">
            Click the arrow button above to view agents
          </div>
        )}
      </div>
    </div>

    <DialogFooter className="mt-4">
      <Button variant="contained" onClick={onSubmit}>
        {isEdit ? "Save changes" : "Build"}
      </Button>
    </DialogFooter>
  </DialogContent>
);

export default function TeamPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showSelectionList, setShowSelectionList] = useState(true);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  useEffect(() => {
    // Don't redirect while auth is loading
    if (loading) return;
    
    // Only redirect if auth has finished loading and there's no user
    if (!loading && !user) {
      router.push("/auth/login");
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [teamsResponse, agentsResponse] = await Promise.all([
          fetch("/api/teams"),
          fetch("/api/agents"),
        ]);

        if (!teamsResponse.ok || !agentsResponse.ok) {
          throw new Error("Failed to fetch data");
        }

        const [teamsData, agentsData] = await Promise.all([
          teamsResponse.json(),
          agentsResponse.json(),
        ]);

        setTeams(teamsData);
        setAgents(agentsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, router]);

  const toggleAgent = (agentId: string) => {
    setSelectedAgents((current) =>
      current.includes(agentId)
        ? current.filter((id) => id !== agentId)
        : [...current, agentId]
    );
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
      setShowDialog(false);
    } catch (error) {
      console.error("Error creating team:", error);
    }
  };

  const handleEditTeam = async () => {
    if (!editingTeam) return;

    try {
      const response = await fetch(`/api/teams/${editingTeam.id}`, {
        method: "PUT",
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

      // Update the team in the teams list
      setTeams((prevTeams) =>
        prevTeams.map((team) => (team.id === editingTeam.id ? data : team))
      );

      // Reset form
      setTeamName("");
      setTeamDescription("");
      setSelectedAgents([]);
      setEditingTeam(null);
      setShowDialog(false);
    } catch (error) {
      console.error("Error updating team:", error);
    }
  };

  const handleDialogChange = (open: boolean, isEdit: boolean) => {
    if (!open) {
      setTeamName("");
      setTeamDescription("");
      setSelectedAgents([]);
      setShowSelectionList(false);
      if (isEdit) {
        setEditingTeam(null);
        setShowDialog(false);
      } else {
        setShowDialog(false);
      }
    }
  };

  return (
    <Container maxWidth="lg">
      <Header currentView="team" />
      {isLoading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="200px"
        >
          <Typography>Loading...</Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Typography variant="h4" component="h1" gutterBottom>
                Teams
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Create and manage your agent teams
              </Typography>
            </div>
            <Dialog
              open={showDialog}
              onOpenChange={(open) =>
                handleDialogChange(open, Boolean(editingTeam))
              }
            >
              <DialogTrigger asChild>
                <Button
                  variant="contained"
                  startIcon={<Users />}
                  onClick={() => setShowDialog(true)}
                >
                  Build a team
                </Button>
              </DialogTrigger>
              <TeamDialog
                isEdit={Boolean(editingTeam)}
                teamName={teamName}
                setTeamName={setTeamName}
                teamDescription={teamDescription}
                setTeamDescription={setTeamDescription}
                selectedAgents={selectedAgents}
                setSelectedAgents={setSelectedAgents}
                showSelectionList={showSelectionList}
                setShowSelectionList={setShowSelectionList}
                agents={agents}
                onSubmit={editingTeam ? handleEditTeam : handleBuildTeam}
                getAgentName={getAgentName}
                toggleAgent={toggleAgent}
              />
            </Dialog>
          </Box>

          {/* Teams grid */}
          <Box sx={{ mt: 4 }}>
            {teams.length === 0 ? (
              <Typography
                variant="body1"
                color="text.secondary"
                textAlign="center"
              >
                No teams created yet. Start by building your first team!
              </Typography>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map((team) => (
                  <Card key={team.id} className="flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div>
                        <CardTitle>{team.name}</CardTitle>
                        <CardDescription>
                          Created on{" "}
                          {new Date(team.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => {
                          setEditingTeam(team);
                          setTeamName(team.name);
                          setTeamDescription(team.description);
                          setSelectedAgents(team.agent_list);
                          setShowDialog(true);
                        }}
                        className="h-8 w-8 p-0"
                        variant="outlined"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
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
          </Box>
        </>
      )}
    </Container>
  );
}
