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
import {
  X,
  Users,
  ChevronUp,
  ChevronDown,
  Pencil,
  Clock,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Client } from "@langchain/langgraph-sdk";
import { HumanMessage } from "@langchain/core/messages";
import { createClient as createSupabaseClient } from "@/utils/supabase/client";

type TeamMessage = {
  content: string | Record<string, any>;
  role: string;
  type: string;
  name?: string;
  additional_kwargs?: Record<string, any>;
};

type Agent = {
  id: string;
  name: string;
  description: string;
  image_url: string;
};

interface Team {
  id: string;
  name: string;
  description: string;
  agent_list: string[];
  created_at: string;
  schedule: string;
  thread_id?: string;
}

// Add metadata type for crons
type CronMetadata = {
  team_id?: string;
  team_name?: string;
  agent_list?: string[];
  [key: string]: any;
};

// Update the imported Cron type to include metadata
declare module "@langchain/langgraph-sdk" {
  interface Cron {
    cron_id: string;
    schedule: string;
    created_at: string;
    end_time: string | null;
    metadata?: CronMetadata;
    payload: Record<string, unknown>;
  }
}

// Helper function to safely check team_id in metadata
const getTeamIdFromMetadata = (metadata: unknown): string | undefined => {
  if (metadata && typeof metadata === "object" && "team_id" in metadata) {
    return (metadata as { team_id: string }).team_id;
  }
  return undefined;
};

interface TeamDialogProps {
  isEdit?: boolean;
  teamName: string;
  setTeamName: (name: string) => void;
  teamDescription: string;
  setTeamDescription: (desc: string) => void;
  schedule: string;
  setSchedule: (schedule: string) => void;
  selectedAgents: string[];
  setSelectedAgents: React.Dispatch<React.SetStateAction<string[]>>;
  agents: Agent[];
  onSubmit: () => void;
  getAgentName: (id: string) => string;
  toggleAgent: (id: string) => void;
}

type Run = {
  run_id: string;
  thread_id: string;
  assistant_id: string;
  created_at: string;
  updated_at: string;
  status: string;
  metadata: Record<string, any> | null;
};

interface CronJobsDialogProps {
  localCrons: import("@langchain/langgraph-sdk").Cron[];
  setLocalCrons: React.Dispatch<React.SetStateAction<import("@langchain/langgraph-sdk").Cron[]>>;
}

// Add helper function to convert cron to readable text
const cronToText = (cron: string): string => {
  if (!cron) return "Not scheduled";

  const parts = cron.split(" ");
  if (parts.length !== 5) return "Invalid schedule";

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  if (
    minute === "*" &&
    hour === "*" &&
    dayOfMonth === "*" &&
    month === "*" &&
    dayOfWeek === "*"
  ) {
    return "Every minute";
  }

  if (
    minute === "0" &&
    hour === "*" &&
    dayOfMonth === "*" &&
    month === "*" &&
    dayOfWeek === "*"
  ) {
    return "Every hour";
  }

  if (
    minute === "0" &&
    hour === "0" &&
    dayOfMonth === "*" &&
    month === "*" &&
    dayOfWeek === "*"
  ) {
    return "Every day at midnight";
  }

  if (
    minute === "0" &&
    hour === "12" &&
    dayOfMonth === "*" &&
    month === "*" &&
    dayOfWeek === "*"
  ) {
    return "Every day at noon";
  }

  if (
    minute === "0" &&
    hour === "0" &&
    dayOfMonth === "*" &&
    month === "*" &&
    dayOfWeek === "0"
  ) {
    return "Every Sunday at midnight";
  }

  if (
    minute === "0" &&
    hour === "0" &&
    dayOfMonth === "1" &&
    month === "*" &&
    dayOfWeek === "*"
  ) {
    return "First day of every month at midnight";
  }

  return `Cron: ${cron}`;
};

const TeamDialog = ({
  isEdit = false,
  teamName,
  setTeamName,
  teamDescription,
  setTeamDescription,
  schedule,
  setSchedule,
  selectedAgents,
  setSelectedAgents,
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
          autoComplete="on"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="team-schedule">Schedule</Label>
        <select
          id="team-schedule"
          value={schedule}
          onChange={(e) => setSchedule(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
        >
          <option value="">Not scheduled</option>
          <option value="* * * * *">Every minute</option>
          <option value="0 * * * *">Every hour</option>
          <option value="0 0 * * *">Every day</option>
        </select>
        <p className="text-sm text-muted-foreground mt-1">
          {cronToText(schedule)}
        </p>
      </div>
    </div>

    <div className="mt-4 flex flex-col" style={{ height: "400px" }}>
      <div className="flex flex-wrap gap-1 p-2 mb-2 border rounded-md min-h-10">
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
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {agents ? (
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
                          selectedAgents.includes(agent.id) ? "font-medium" : ""
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
            Loading agents...
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

// Move fetchCrons before CronJobsDialog
const fetchCrons = async (setIsLoading?: (loading: boolean) => void) => {
  try {
    if (setIsLoading) setIsLoading(true);
    const client = await createLangGraphClient();
    const cronJobs = await client.crons.search();
    console.log("cronJobs: ", cronJobs);
    return cronJobs;
  } catch (error) {
    console.error("Failed to fetch cron jobs:", error);
    throw error;
  } finally {
    if (setIsLoading) setIsLoading(false);
  }
};

const CronJobsDialog = ({ localCrons, setLocalCrons }: CronJobsDialogProps) => {
  const [expandedCron, setExpandedCron] = useState<string | null>(null);
  const [runs, setRuns] = useState<Record<string, Run[]>>({});
  const [isLoadingRuns, setIsLoadingRuns] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCrons = async () => {
      try {
        const cronJobs = await fetchCrons(setIsLoading);
        setLocalCrons(cronJobs);
      } catch (error) {
        console.error("Failed to load scheduled tasks:", error);
        alert("Failed to load scheduled tasks");
      }
    };
    loadCrons();
  }, [setLocalCrons]);

  const handleDeleteCron = async (cronId: string) => {
    try {
      const client = await createLangGraphClient();
      await client.crons.delete(cronId);

      // Update local state to remove the deleted cron
      setLocalCrons((prevCrons) =>
        prevCrons.filter((cron) => cron.cron_id !== cronId)
      );

      // Also update the team's cron_id in the database
      const cronToDelete = localCrons.find((cron) => cron.cron_id === cronId);
      if (cronToDelete?.metadata?.team_id) {
        await fetch(`/api/teams/${cronToDelete.metadata.team_id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cron_id: null,
          }),
        });
      }
    } catch (error) {
      console.error("Failed to delete cron job:", error);
      alert("Failed to delete scheduled task");
    }
  };

  const fetchRunsForThread = async (threadId: string) => {
    if (!threadId) return;

    try {
      setIsLoadingRuns((prev) => ({ ...prev, [threadId]: true }));
      const client = await createLangGraphClient();
      const runsData = await client.runs.list(threadId, {
        limit: 10, // Get last 10 runs
      });

      // Convert LangGraph runs to our Run type
      const convertedRuns = runsData.map((run) => ({
        run_id: run.run_id,
        thread_id: run.thread_id,
        assistant_id: run.assistant_id,
        created_at: run.created_at,
        updated_at: run.updated_at,
        status: run.status,
        metadata: run.metadata || null,
      }));

      setRuns((prev) => ({ ...prev, [threadId]: convertedRuns }));
    } catch (error) {
      console.error("❌ Failed to fetch runs:", {
        thread_id: threadId,
        error: error,
      });
    } finally {
      setIsLoadingRuns((prev) => ({ ...prev, [threadId]: false }));
    }
  };

  const toggleCron = (threadId: string) => {
    if (!threadId) return;

    if (expandedCron === threadId) {
      setExpandedCron(null);
    } else {
      setExpandedCron(threadId);
      if (!runs[threadId]) {
        fetchRunsForThread(threadId);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-500";
      case "error":
        return "text-red-500";
      case "pending":
        return "text-yellow-500";
      case "timeout":
        return "text-orange-500";
      case "interrupted":
        return "text-purple-500";
      default:
        return "text-gray-500";
    }
  };

  const renderRunsList = (threadId: string) => {
    if (isLoadingRuns[threadId]) {
      return (
        <div className="text-center py-4 text-muted-foreground">
          Loading runs...
        </div>
      );
    }

    const threadRuns = runs[threadId];
    if (!threadRuns || threadRuns.length === 0) {
      return (
        <div className="text-center py-4 text-muted-foreground">
          No runs found
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {threadRuns.map((run: Run) => (
          <div key={run.run_id} className="bg-muted p-3 rounded-md">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium">Run ID: {run.run_id}</p>
                <p className="text-sm text-muted-foreground">
                  Created: {new Date(run.created_at).toLocaleString()}
                </p>
              </div>
              <Badge className={getStatusColor(run.status)}>{run.status}</Badge>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <DialogContent className="sm:max-w-[800px]">
      <DialogHeader>
        <DialogTitle>Scheduled Tasks</DialogTitle>
        <DialogDescription>
          View all scheduled tasks and their status
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 mt-2">
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">
            Loading scheduled tasks...
          </div>
        ) : localCrons.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No scheduled tasks found
          </div>
        ) : (
          <div className="space-y-4">
            {localCrons.map((cron) => (
              <div key={cron.cron_id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => cron.thread_id && toggleCron(cron.thread_id)}
                  >
                    <div>
                      <h4 className="font-medium">
                        Schedule: {cronToText(cron.schedule)}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Created: {new Date(cron.created_at).toLocaleString()}
                      </p>
                      {cron.thread_id && (
                        <p className="text-sm">Thread ID: {cron.thread_id}</p>
                      )}
                      <p className="text-sm">
                        End time:{" "}
                        {cron.end_time
                          ? new Date(cron.end_time).toLocaleString()
                          : "No end time"}
                      </p>
                      {cron.metadata?.team_name && (
                        <p className="text-sm">
                          Team: {cron.metadata.team_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDeleteCron(cron.cron_id)}
                      className="p-2 hover:bg-red-100 rounded-full text-red-500 transition-colors"
                      title="Delete scheduled task"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="p-2 hover:bg-muted rounded-full"
                      onClick={() =>
                        cron.thread_id && toggleCron(cron.thread_id)
                      }
                    >
                      {expandedCron === cron.thread_id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {expandedCron === cron.thread_id && cron.thread_id && (
                  <div className="mt-4 border-t pt-4">
                    <h5 className="font-medium mb-2 flex items-center gap-2">
                      <Play className="h-4 w-4" /> Recent Runs
                    </h5>
                    {renderRunsList(cron.thread_id)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DialogContent>
  );
};

const createTeamMessage = (
  teamId: string,
  description: string
): Record<string, any> => ({
  role: "human",
  content: description || "Do your job.",
  additional_kwargs: {
    team_id: teamId,
    action: "run_team",
    timestamp: new Date().toISOString(),
    source: "team_page",
  },
});

const createLangGraphClient = async () => {
  const supabase = createSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const apiUrl = process.env.NEXT_PUBLIC_LANGGRAPH_API_URL;
  const apiKey = process.env.NEXT_PUBLIC_LANGSMITH_API_KEY;

  return new Client({
    apiUrl,
    apiKey,
    defaultHeaders: {
      Authorization: `Bearer ${session?.access_token}`,
    },
  });
};

export default function TeamPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [schedule, setSchedule] = useState("");
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [showCronJobsDialog, setShowCronJobsDialog] = useState(false);
  const [localCrons, setLocalCrons] = useState<import("@langchain/langgraph-sdk").Cron[]>([]);

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
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, router, loading]);

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
    console.log("handleBuildTeam");
    try {
      const client = await createLangGraphClient();
      console.log("client: ", client);

      // Create a new thread first
      const thread = await client.threads.create({
        metadata: {
          team_name: teamName,
          agent_list: selectedAgents,
        },
      });
      console.log("thread: ", thread);

      // Create the team with the thread ID
      const teamData = {
        name: teamName,
        description: teamDescription,
        agent_list: selectedAgents,
        schedule: schedule,
        thread_id: thread.thread_id,
      };
      console.log("Creating team with data:", teamData);

      const response = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(teamData),
      });
      console.log("response: ", response);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error response:", errorData);
        throw new Error(errorData.error || "Failed to create team");
      }

      const responseData = await response.json();
      console.log("responseData: ", responseData);

      let cronId = null;
      // Only create cron job if schedule is set
      if (schedule) {
        // Create a cron job
        console.log("Creating cron job...");
        const cronJob = await client.crons.createForThread(
          thread.thread_id,
          "team_graph",
          {
            schedule: schedule,
            streamMode: "messages",
            input: {
              messages: [createTeamMessage(responseData.id, teamDescription)],
            },
            metadata: {
              team_id: responseData.id,
              team_name: teamName,
              agent_list: selectedAgents,
            },
            config: {
              configurable: {
                project_id: "default",
                team_id: responseData.id,
                staff_id: "default",
                user_id: user?.id || "default",
                agent_id_list: selectedAgents.join(","),
              },
            },
            multitaskStrategy: "enqueue",
            onCompletion: "continue",
            onDisconnect: "continue",
            afterSeconds: 1,
            ifNotExists: "reject",
          }
        );
        console.log("cronJob: ", cronJob);
        cronId = cronJob.cron_id;

        // Update the cron job id in the teams table
        await fetch(`/api/teams/${responseData.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cron_id: cronId,
          }),
        });
      }

      // Add the new team to the teams list
      setTeams((prevTeams) => [
        { ...responseData, cron_id: cronId },
        ...prevTeams,
      ]);

      // Reset form
      setTeamName("");
      setTeamDescription("");
      setSelectedAgents([]);
      setSchedule("");
      setShowDialog(false);
    } catch (error) {
      console.error("Error creating team:", error);
      alert(error instanceof Error ? error.message : "Failed to create team");
    }
  };

  const handleEditTeam = async () => {
    console.log("editingTeam: ", editingTeam);
    if (!editingTeam) return;

    try {
      const client = await createLangGraphClient();

      // Update thread metadata if it exists
      if (editingTeam.thread_id) {
        // Search for existing cron jobs and delete them
        const cronJobs = await client.crons.search({
          assistantId: "team_graph",
          threadId: editingTeam.thread_id,
        });
        if (cronJobs.length > 0) {
          await client.crons.delete(cronJobs[0].cron_id);
        }

        let cronId = null;
        // Only create new cron job if schedule is set
        if (schedule) {
          // Create a cron job
          const cronJob = await client.crons.createForThread(
            editingTeam.thread_id,
            "team_graph",
            {
              schedule: schedule,
              streamMode: "messages",
              input: {
                messages: [createTeamMessage(editingTeam.id, teamDescription)],
              },
              metadata: {
                team_id: editingTeam.id,
                team_name: teamName,
                agent_list: selectedAgents,
              },
              config: {
                configurable: {
                  project_id: "default",
                  team_id: editingTeam.id,
                  staff_id: "default",
                  user_id: user?.id || "default",
                  agent_id_list: selectedAgents.join(","),
                },
              },
              multitaskStrategy: "enqueue",
              onCompletion: "continue",
              onDisconnect: "continue",
              afterSeconds: 1,
              ifNotExists: "reject",
            }
          );
          console.log("cronJob: ", cronJob);
          cronId = cronJob.cron_id;
        }

        // Update team in database
        const response = await fetch(`/api/teams/${editingTeam.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: teamName,
            description: teamDescription,
            agent_list: selectedAgents,
            schedule: schedule,
            thread_id: editingTeam.thread_id,
            cron_id: cronId, // Will be null if no schedule is set
          }),
        });

        const responseData = await response.json();
        if (!response.ok) throw new Error(responseData.error);

        // Update the team in the teams list
        setTeams((prevTeams) =>
          prevTeams.map((team) =>
            team.id === editingTeam.id
              ? {
                  ...responseData,
                  schedule: schedule,
                  cron_id: cronId,
                }
              : team
          )
        );

        // Reset form
        setTeamName("");
        setTeamDescription("");
        setSelectedAgents([]);
        setSchedule("");
        setEditingTeam(null);
        setShowDialog(false);
      } else {
        throw new Error("Thread ID not found");
      }
    } catch (error) {
      console.error("Error updating team:", error);
      alert(error instanceof Error ? error.message : "Failed to update team");
    }
  };

  const handleDialogChange = (open: boolean, isEdit: boolean) => {
    if (!open) {
      setTeamName("");
      setTeamDescription("");
      setSelectedAgents([]);
      setSchedule("");
      if (isEdit) {
        setEditingTeam(null);
      }
      setShowDialog(false);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm("Are you sure you want to delete this team?")) {
      return;
    }

    try {
      // Find the team to get its cron_id
      const team = teams.find(t => t.id === teamId);
      console.log("team: ", team);
      if (team?.thread_id) {
        // Get the client and search for crons associated with this thread
        const client = await createLangGraphClient();
        const cronJobs = await client.crons.search({
          threadId: team.thread_id
        });

        // Delete any found crons
        for (const cron of cronJobs) {
          await client.crons.delete(cron.cron_id);
        }
      }

      // Now delete the team
      const response = await fetch(`/api/teams/${teamId}`, {
        method: "DELETE",
      });
      console.log("response: ", response);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete team");
      }

      // Remove the team from the teams list
      setTeams((prevTeams) => prevTeams.filter((team) => team.id !== teamId));

      // Refresh crons list
      const newCrons = await fetchCrons();
      setLocalCrons(newCrons);
    } catch (error) {
      console.error("Error deleting team:", error);
      alert(error instanceof Error ? error.message : "Failed to delete team");
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
          <Box
            sx={{
              mt: 4,
              mb: 4,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <Typography variant="h4" component="h1" gutterBottom>
                Teams
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Create and manage your agent teams
              </Typography>
            </div>
            <div className="flex gap-2">
              <Dialog
                open={showCronJobsDialog}
                onOpenChange={setShowCronJobsDialog}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outlined"
                    startIcon={<Clock />}
                    onClick={() => setShowCronJobsDialog(true)}
                  >
                    View jobs
                  </Button>
                </DialogTrigger>
                <CronJobsDialog 
                  localCrons={localCrons} 
                  setLocalCrons={setLocalCrons} 
                />
              </Dialog>
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
                  schedule={schedule}
                  setSchedule={setSchedule}
                  selectedAgents={selectedAgents}
                  setSelectedAgents={setSelectedAgents}
                  agents={agents}
                  onSubmit={editingTeam ? handleEditTeam : handleBuildTeam}
                  getAgentName={getAgentName}
                  toggleAgent={toggleAgent}
                />
              </Dialog>
            </div>
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
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleDeleteTeam(team.id)}
                          className="h-8 w-8 p-0"
                          variant="outlined"
                          color="error"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingTeam(team);
                            setTeamName(team.name);
                            setTeamDescription(team.description);
                            setSelectedAgents(team.agent_list);
                            setSchedule(team.schedule || "");
                            setShowDialog(true);
                          }}
                          className="h-8 w-8 p-0"
                          variant="outlined"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2">
                        {team.description}
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Schedule:{" "}
                        {team.schedule
                          ? cronToText(team.schedule)
                          : "Not scheduled"}
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
