"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Plus, Edit, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button as ShadcnButton } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Client } from "@langchain/langgraph-sdk";
import { useAuth } from "@/contexts/AuthContext";
import { Thread } from "@/components/thread";
import { ThreadProvider } from "@/providers/Thread";
import { StreamProvider } from "@/providers/Stream";
import { ArtifactProvider } from "@/components/thread/artifact";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { useQueryState } from "nuqs";

interface Project {
  id: string;
  name: string;
  description?: string;
  agent_id: string;
  prompt: string;
  session_id?: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
}

interface Agent {
  id: string;
  name: string;
  description: string;
  graph_name: string;
}

// Custom Sidebar component for projects
function ProjectSidebar({ 
  currentProject, 
  setCurrentProject 
}: { 
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', agent_id: '', prompt: '' });
  const [submitting, setSubmitting] = useState(false);
  const [openProjects, setOpenProjects] = useState(true);
  const [showThreadList, setShowThreadList] = useQueryState("showThreadList", { defaultValue: "false" });
  
  const { session } = useAuth();

  // Fetch projects and agents
  useEffect(() => {
    fetchProjects();
    fetchAgents();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
        // Set first project as current if none selected
        if (data.length > 0 && !currentProject) {
          setCurrentProject(data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents');
      if (response.ok) {
        const data = await response.json();
        setAgents(data);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const createLangGraphClient = () => {
    const apiUrl = process.env.NEXT_PUBLIC_LANGGRAPH_API_URL;
    const accessToken = session?.access_token;
    
    if (!accessToken) {
      throw new Error("No access token found. User might not be authenticated.");
    }
    
    return new Client({
      apiUrl,
      defaultHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  };

  const handleCreateProject = () => {
    setFormData({ name: '', description: '', agent_id: '', prompt: '' });
    setCreateDialogOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      agent_id: project.agent_id,
      prompt: project.prompt,
    });
    setEditDialogOpen(true);
  };

  const handleDeleteProject = (project: Project) => {
    setSelectedProject(project);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (isEdit: boolean = false) => {
    if (!formData.name || !formData.agent_id || !formData.prompt) {
      alert('Please fill in all required fields (Name, Agent, and Prompt)');
      return;
    }

    setSubmitting(true);
    
    try {
      let threadId = selectedProject?.session_id;
      
      // Create thread if it's a new project or if editing and no thread exists
      if (!isEdit || !threadId) {
        const client = createLangGraphClient();
        const thread = await client.threads.create();
        threadId = thread.thread_id;
      }

      const projectData = {
        ...formData,
        session_id: threadId,
      };

      const url = isEdit ? `/api/projects/${selectedProject?.id}` : '/api/projects';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      if (response.ok) {
        const updatedProject = await response.json();
        await fetchProjects();
        setCreateDialogOpen(false);
        setEditDialogOpen(false);
        setFormData({ name: '', description: '', agent_id: '', prompt: '' });
        setSelectedProject(null);
        
        // Set as current project if it's new
        if (!isEdit) {
          setCurrentProject(updatedProject);
        }
        
        // Start the run if it's a new project
        if (!isEdit && threadId) {
          await startRun(threadId, formData.agent_id, formData.prompt);
        }
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Failed to save project');
    } finally {
      setSubmitting(false);
    }
  };

  const startRun = async (threadId: string, agentId: string, prompt: string) => {
    try {
      const client = createLangGraphClient();
      const agent = agents.find(a => a.id === agentId);
      if (!agent) return;

      await client.runs.create(threadId, agent.graph_name, {
        input: { messages: [{ role: 'user', content: prompt }] },
        interrupt_after: ["chatbot"],
      });
    } catch (error) {
      console.error('Error starting run:', error);
    }
  };

  const confirmDeleteProject = async () => {
    if (!selectedProject) return;

    setSubmitting(true);
    
    try {
      const response = await fetch(`/api/projects/${selectedProject.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchProjects();
        setDeleteDialogOpen(false);
        // Reset current project if it was deleted
        if (currentProject?.id === selectedProject.id) {
          setCurrentProject(null);
        }
        setSelectedProject(null);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getAgentName = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    return agent?.name || 'Unknown Agent';
  };

  const gradients = [
    "linear-gradient(to right, #FF416C, #FF4B2B)",
    "linear-gradient(to right, #4158D0, #C850C0)",
    "linear-gradient(to right, #0093E9, #80D0C7)",
    "linear-gradient(to right, #8EC5FC, #E0C3FC)",
    "linear-gradient(to right, #43E97B, #38F9D7)",
    "linear-gradient(to right, #FA8BFF, #2BD2FF)",
    "linear-gradient(to right, #FEE140, #FA709A)",
    "linear-gradient(to right, #3EECAC, #EE74E1)",
    "linear-gradient(to right, #4facfe, #00f2fe)",
    "linear-gradient(to right, #F6D242, #FF52E5)",
  ];

  function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  return (
    <>
      <div className="flex-shrink-0 w-64 bg-[#F9FAFB] border-r-0">
        <div className="flex flex-col pb-9 pt-6">
          <div className="flex items-center justify-between px-11">
            <span className="text-xl font-semibold flex-shrink-0">Projects</span>
          </div>
          <div className="flex-1 pt-6 px-2">
            {loading ? (
              <div className="flex flex-col gap-2 pl-7">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2 animate-pulse"
                  >
                    <div className="w-6 h-6 rounded-md bg-gray-200" />
                    <div className="h-4 bg-gray-200 rounded w-24" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Create Project Button */}
                <div className="px-7 mb-4">
                  <ShadcnButton 
                    onClick={handleCreateProject}
                    className="w-full flex items-center gap-2"
                    size="sm"
                  >
                    <Plus className="w-4 h-4" />
                    New Project
                  </ShadcnButton>
                </div>

                {/* Show Thread List Toggle */}
                <div className="px-7 mb-4">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="show-thread-list" 
                      checked={showThreadList === "true"}
                      onCheckedChange={(checked) => setShowThreadList(checked ? "true" : "false")}
                    />
                    <Label htmlFor="show-thread-list" className="text-sm">Show Thread List</Label>
                  </div>
                </div>

                {/* Collapsible Projects Section */}
                <Collapsible open={openProjects} onOpenChange={setOpenProjects}>
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center cursor-pointer select-none text-sm font-medium text-gray-500 mb-2 pl-2">
                      <span className="mr-2">My Projects</span>
                      <span>{openProjects ? "▾" : "▸"}</span>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="flex flex-col gap-2 pl-7 mb-6">
                      {projects.length === 0 ? (
                        <p className="text-sm text-gray-500 p-2">No projects yet</p>
                      ) : (
                        projects.map((project, idx) => {
                          const label = project.name;
                          return (
                            <div
                              key={`project-${project.id}-${idx}`}
                              className={cn(
                                "flex items-center w-full",
                                currentProject?.id === project.id ? "bg-gray-100 rounded-md" : ""
                              )}
                            >
                              <TooltipProvider>
                                <Tooltip delayduration={200}>
                                  <TooltipTrigger asChild>
                                    <button
                                      className="flex items-center gap-2 p-2 w-full text-left hover:bg-gray-100 rounded-md"
                                      onClick={() => setCurrentProject(project)}
                                    >
                                      <div
                                        className="w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center text-white"
                                        style={{
                                          background:
                                            gradients[
                                              hashString(project.id) %
                                                gradients.length
                                            ],
                                        }}
                                      >
                                        {label.slice(0, 1).toUpperCase()}
                                      </div>
                                      <span className="truncate min-w-0 font-medium text-gray-600">
                                        {label}
                                      </span>
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div>
                                      <p className="font-medium">{label}</p>
                                      <p className="text-xs text-gray-500">{getAgentName(project.agent_id)}</p>
                                      <p className="text-xs text-gray-500">Created {formatDate(project.created_at)}</p>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <div className="flex gap-1 pr-2">
                                <ShadcnButton
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditProject(project);
                                  }}
                                  className="h-6 w-6 p-0"
                                >
                                  <Edit className="w-3 h-3" />
                                </ShadcnButton>
                                <ShadcnButton
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteProject(project);
                                  }}
                                  className="h-6 w-6 p-0"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </ShadcnButton>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Project Dialog */}
      <Dialog open={createDialogOpen || editDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setCreateDialogOpen(false);
          setEditDialogOpen(false);
          setFormData({ name: '', description: '', agent_id: '', prompt: '' });
          setSelectedProject(null);
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editDialogOpen ? 'Edit Project' : 'Create New Project'}</DialogTitle>
            <DialogDescription>
              {editDialogOpen ? 'Update your project details.' : 'Create a new project and run it with an agent.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter project name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your project (optional)"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="agent">Select Agent</Label>
              <Select value={formData.agent_id} onValueChange={(value) => setFormData({ ...formData, agent_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="prompt">Initial Prompt</Label>
              <Textarea
                id="prompt"
                value={formData.prompt}
                onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                placeholder="Enter your initial prompt for the agent"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <ShadcnButton variant="outline" onClick={() => {
              setCreateDialogOpen(false);
              setEditDialogOpen(false);
            }}>
              Cancel
            </ShadcnButton>
            <ShadcnButton 
              onClick={() => handleFormSubmit(editDialogOpen)}
              disabled={submitting}
            >
              {submitting ? 'Saving...' : (editDialogOpen ? 'Update Project' : 'Create & Run')}
            </ShadcnButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the project "{selectedProject?.name}" and stop any running threads. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteProject} disabled={submitting}>
              {submitting ? 'Deleting...' : 'Delete Project'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function ProjectPage() {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [showThreadList] = useQueryState("showThreadList", { defaultValue: "false" });
  const [chatHistoryOpen, setChatHistoryOpen] = useQueryState("chatHistoryOpen", { defaultValue: "false" });
  const [threadId, setThreadId] = useQueryState("threadId");

  // Sync showThreadList with chatHistoryOpen
  useEffect(() => {
    setChatHistoryOpen(showThreadList);
  }, [showThreadList, setChatHistoryOpen]);

  // Set threadId when currentProject changes
  useEffect(() => {
    if (currentProject?.session_id) {
      setThreadId(currentProject.session_id);
    } else {
      setThreadId(null);
    }
  }, [currentProject, setThreadId]);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents');
      if (response.ok) {
        const data = await response.json();
        setAgents(data);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const getCurrentAgent = () => {
    if (!currentProject) return null;
    return agents.find(a => a.id === currentProject.agent_id);
  };

  const currentAgent = getCurrentAgent();

  return (
    <div className="flex flex-col h-screen w-full">
      <Header currentView="project" />
      <div className="flex flex-1 flex-row overflow-y-auto w-full gap-6 pt-6 pl-6 bg-[#F9FAFB]">
        <ProjectSidebar currentProject={currentProject} setCurrentProject={setCurrentProject} />
        
        {/* Main content - Thread view */}
        <div className="flex flex-col gap-6 w-full">
          <div
            className={cn(
              "bg-white rounded-tl-[58px] h-full",
              "overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
            )}
          >
            <div className="flex flex-col w-full h-full">
              {currentProject && currentProject.session_id && currentAgent ? (
                <ThreadProvider 
                  assistantId={currentAgent.graph_name}
                  apiUrl={process.env.NEXT_PUBLIC_LANGGRAPH_API_URL}
                >
                  <StreamProvider
                    apiUrl={process.env.NEXT_PUBLIC_LANGGRAPH_API_URL}
                    assistantId={currentAgent.graph_name}
                  >
                    <ArtifactProvider>
                      <Thread />
                    </ArtifactProvider>
                  </StreamProvider>
                </ThreadProvider>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <h3 className="text-lg font-semibold mb-2">
                    {currentProject ? 'Loading project...' : 'No project selected'}
                  </h3>
                  <p className="text-sm">
                    {currentProject ? 'Setting up your project workspace...' : 'Select a project from the sidebar to start chatting'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 