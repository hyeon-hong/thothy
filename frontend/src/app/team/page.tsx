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
  Check,
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
import { v4 as uuidv4 } from "uuid";
import { Client } from "@langchain/langgraph-sdk";
import type { Cron as LangGraphCron } from "@langchain/langgraph-sdk";
import { createClient as createSupabaseClient } from "@/utils/supabase/client";
import { HumanMessage } from "@langchain/core/messages";

type Agent = {
  id: string;
  name: string;
  description: string;
  image_url: string;
};

type Cron = LangGraphCron;

type Team = {
  id: string;
  name: string;
  description: string;
  agent_list: string[];
  created_at: string;
  schedule: string; // cron expression
  cron_id?: string; // Optional cron ID reference
};

type TeamDialogProps = {
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
};

type Run = {
  run_id: string;
  thread_id: string;
  assistant_id: string;
  created_at: string;
  updated_at: string;
  status: string;
  metadata: Record<string, any> | null;
};

type CronJobsDialogProps = {
  crons: import("@langchain/langgraph-sdk").Cron[];
};

type Message = {
  content: string | Record<string, any>;
  type: string;
  name?: string;
  additional_kwargs?: Record<string, any>;
};

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
          <option value="0 0 * * *">Every day at midnight</option>
          <option value="0 12 * * *">Every day at noon</option>
          <option value="0 0 * * 0">Every Sunday at midnight</option>
          <option value="0 0 1 * *">
            First day of every month at midnight
          </option>
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

const CronJobsDialog = ({ crons }: CronJobsDialogProps) => {
  const [expandedCron, setExpandedCron] = useState<string | null>(null);
  const [runs, setRuns] = useState<Record<string, Run[]>>({});
  const [isLoadingRuns, setIsLoadingRuns] = useState<Record<string, boolean>>(
    {}
  );
  const [localCrons, setLocalCrons] =
    useState<import("@langchain/langgraph-sdk").Cron[]>(crons);

  useEffect(() => {
    // Log initial cron jobs when dialog opens
    console.log(
      "🔄 Loaded Cron Jobs:",
      crons.map((cron) => ({
        cron_id: cron.cron_id,
        thread_id: cron.thread_id,
        schedule: cron.schedule,
        created_at: new Date(cron.created_at).toLocaleString(),
        end_time: cron.end_time
          ? new Date(cron.end_time).toLocaleString()
          : "No end time",
        payload: cron.payload,
      }))
    );
  }, [crons]);

  const handleDeleteCron = async (cronId: string) => {
    try {
      const cronToDelete = localCrons.find((cron) => cron.cron_id === cronId);
      console.log("🗑️ Deleting Cron Job:", {
        cron_id: cronId,
        thread_id: cronToDelete?.thread_id,
        schedule: cronToDelete?.schedule,
        created_at: cronToDelete?.created_at
          ? new Date(cronToDelete.created_at).toLocaleString()
          : undefined,
        payload: cronToDelete?.payload,
      });

      const client = await createLangGraphClient();
      await client.crons.delete(cronId);

      // Update local state to remove the deleted cron
      setLocalCrons((prevCrons) => {
        const updatedCrons = prevCrons.filter(
          (cron) => cron.cron_id !== cronId
        );
        console.log(
          "✅ Successfully deleted cron job. Remaining crons:",
          updatedCrons.length
        );
        return updatedCrons;
      });
    } catch (error) {
      console.error("❌ Failed to delete cron:", error);
      throw new Error("Failed to delete cron job");
    }
  };

  const fetchRunsForThread = async (threadId: string) => {
    if (!threadId) return;

    try {
      console.log("📥 Fetching runs for thread:", threadId);
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

      console.log("📊 Thread Runs Data:", {
        thread_id: threadId,
        total_runs: convertedRuns.length,
        runs: convertedRuns.map((run) => ({
          run_id: run.run_id,
          status: run.status,
          assistant_id: run.assistant_id,
          created_at: new Date(run.created_at).toLocaleString(),
          metadata: run.metadata,
        })),
      });

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
      console.log("🔺 Collapsing cron details:", threadId);
      setExpandedCron(null);
    } else {
      console.log("🔽 Expanding cron details:", threadId);
      setExpandedCron(threadId);
      if (!runs[threadId]) {
        fetchRunsForThread(threadId);
      } else {
        console.log("📋 Using cached runs for thread:", {
          thread_id: threadId,
          cached_runs: runs[threadId].length,
        });
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
        <DialogTitle>Scheduled Jobs</DialogTitle>
        <DialogDescription>
          View all scheduled jobs and their status
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 mt-2">
        {localCrons.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No scheduled jobs found
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
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDeleteCron(cron.cron_id)}
                      className="p-2 hover:bg-red-100 rounded-full text-red-500 transition-colors"
                      title="Delete cron job"
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

const createTeamMessage = (teamId: string, description: string): Message => ({
  content: description || "No description provided",
  type: "team_action",
  name: "team_runner",
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

  // Get apiUrl as development or production
  const apiUrl =
    process.env.NODE_ENV === "development"
      ? process.env.NEXT_PUBLIC_DEVELOP_LANGGRAPH_API_URL
      : process.env.NEXT_PUBLIC_MAIN_LANGGRAPH_API_URL;

  return new Client({
    apiUrl: apiUrl,
    apiKey: process.env.NEXT_PUBLIC_LANGSMITH_API_KEY,
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
  const [crons, setCrons] = useState<import("@langchain/langgraph-sdk").Cron[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [schedule, setSchedule] = useState("");
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [showCronJobsDialog, setShowCronJobsDialog] = useState(false);

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
      const client = await createLangGraphClient();
      let cronsData: import("@langchain/langgraph-sdk").Cron[] = [];
      try {
        // Fetch crons using LangGraph client
        cronsData = await client.crons.search({
          limit: 100,
        });
      } catch (error) {
        throw new Error("Failed to fetch crons data");
      } finally {
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

        // Match crons with teams and update team schedules
        const teamsWithCrons = teamsData.map((team: Team) => {
          const matchingCron = cronsData.find(
            (cron) => cron.cron_id === team.cron_id
          );
          return {
            ...team,
            schedule: matchingCron ? matchingCron.schedule : team.schedule,
          };
        });

        setTeams(teamsWithCrons);
        setAgents(agentsData);
        setCrons(cronsData);
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
          schedule: schedule,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      // If schedule is set, create a cron job
      if (schedule) {
        try {
          const client = await createLangGraphClient();
          console.log("📅 Creating new cron job for team:", {
            team_id: data.id,
            schedule: schedule,
            agent_count: selectedAgents.length,
            description: teamDescription,
          });

          const newCron = await client.crons.create("team_graph", {
            schedule: schedule,
            streamMode: "values",
            streamSubgraphs: true,
            metadata: {
              team_id: data.id,
              team_name: teamName,
              agent_list: selectedAgents,
            },
            input: createTeamMessage(data.id, teamDescription),
          });

          console.log("✅ Successfully created cron job:", {
            cron_id: newCron.cron_id,
            schedule: schedule,
            team_id: data.id,
            agent_count: selectedAgents.length,
          });

          // Update the team with the cron ID
          data.cron_id = newCron.cron_id;
        } catch (error) {
          console.error("❌ Failed to create cron job:", error);
          throw new Error("Error creating cron job");
        }
      }

      // Add the new team to the teams list
      setTeams((prevTeams) => [data, ...prevTeams]);

      // Reset form
      setTeamName("");
      setTeamDescription("");
      setSelectedAgents([]);
      setSchedule("");
      setShowDialog(false);
    } catch (error) {
      console.error("❌ Failed to build team:", error);
      throw new Error("Error creating team");
    }
  };

  const handleEditTeam = async () => {
    if (!editingTeam) return;

    try {
      const client = await createLangGraphClient();

      // If schedule changed, handle cron updates
      if (editingTeam.schedule !== schedule) {
        // 1. Delete existing cron if it exists
        if (editingTeam.cron_id) {
          try {
            console.log("🔍 Searching for existing cron:", {
              team_id: editingTeam.id,
              cron_id: editingTeam.cron_id,
            });

            // Search for existing cron
            const crons = await client.crons.search({
              limit: 1,
              threadId: editingTeam.id,
            });

            const existingCron = crons.find(
              (cron) => cron.cron_id === editingTeam.cron_id
            );

            if (existingCron) {
              console.log("🗑️ Deleting existing cron:", {
                cron_id: existingCron.cron_id,
                team_id: editingTeam.id,
              });
              // Delete the existing cron
              await client.crons.delete(existingCron.cron_id);
            }
          } catch (error) {
            console.error("❌ Failed to delete existing cron:", error);
            throw new Error("Error deleting existing cron");
          }
        }

        // 2. Create new cron if schedule is set
        if (schedule) {
          try {
            console.log("📅 Creating new cron job for team:", {
              team_id: editingTeam.id,
              schedule: schedule,
              agent_count: selectedAgents.length,
              description: teamDescription,
            });

            const newCron = await client.crons.create("team_graph", {
              schedule: schedule,
              streamMode: "values",
              streamSubgraphs: true,
              metadata: {
                team_id: editingTeam.id,
                team_name: teamName,
                agent_list: selectedAgents,
              },
              input: createTeamMessage(editingTeam.id, teamDescription)
            });

            console.log("✅ Successfully created new cron job:", {
              cron_id: newCron.cron_id,
              schedule: schedule,
              team_id: editingTeam.id,
              agent_count: selectedAgents.length,
            });

            editingTeam.cron_id = newCron.cron_id;
          } catch (error) {
            console.error("❌ Failed to create new cron:", error);
            throw new Error("Error creating new cron");
          }
        }
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
          agent_ids: selectedAgents,
          schedule: schedule,
          cron_id: editingTeam.cron_id,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      // Update the team in the teams list
      setTeams((prevTeams) =>
        prevTeams.map((team) =>
          team.id === editingTeam.id
            ? {
                ...data,
                schedule: schedule, // Ensure we use the new schedule
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
    } catch (error) {
      throw new Error("Error updating team");
    }
  };

  const handleDialogChange = (open: boolean, isEdit: boolean) => {
    if (!open) {
      setTeamName("");
      setTeamDescription("");
      setSelectedAgents([]);
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
                <CronJobsDialog crons={crons} />
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
