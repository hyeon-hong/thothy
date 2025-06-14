"use client";

import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Container, 
  Box, 
  Button, 
} from '@mui/material';
import Header from '@/components/Header';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, PlayArrow as PlayIcon } from '@mui/icons-material';
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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Client } from "@langchain/langgraph-sdk";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

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

export default function ProjectPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', agent_id: '', prompt: '' });
  const [submitting, setSubmitting] = useState(false);
  
  const { session } = useAuth();
  const router = useRouter();

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
        await fetchProjects();
        setCreateDialogOpen(false);
        setEditDialogOpen(false);
        setFormData({ name: '', description: '', agent_id: '', prompt: '' });
        setSelectedProject(null);
        
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
      });
    } catch (error) {
      console.error('Error starting run:', error);
    }
  };

  const handleRunProject = async (project: Project) => {
    try {
      if (!project.session_id) {
        alert('No thread associated with this project');
        return;
      }

      const agent = agents.find(a => a.id === project.agent_id);
      if (!agent) {
        alert('Agent not found');
        return;
      }

      // Navigate to the agent page with the thread
      router.push(`/agents/${agent.graph_name}?threadId=${project.session_id}`);
    } catch (error) {
      console.error('Error running project:', error);
      alert('Failed to run project');
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

  return (
    <>
      <Header currentView="project" />
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Projects
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
              onClick={handleCreateProject}
            >
              New Project
            </Button>
          </Box>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Create and manage your projects. Track progress, collaborate with your team, and organize your work.
          </Typography>

          {loading ? (
            <Typography>Loading projects...</Typography>
          ) : projects.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  No projects yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Get started by creating your first project
                </Typography>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  startIcon={<AddIcon />}
                  onClick={handleCreateProject}
                >
                  Create Project
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card key={project.id} className="h-full">
                  <CardHeader>
                    <CardTitle>{project.name}</CardTitle>
                    <CardDescription>
                      {getAgentName(project.agent_id)} • Created {formatDate(project.created_at)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    {project.description && (
                      <p className="text-sm text-muted-foreground mb-2">{project.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                      <strong>Prompt:</strong> {project.prompt.substring(0, 100)}{project.prompt.length > 100 ? '...' : ''}
                    </p>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <ShadcnButton 
                      variant="default" 
                      size="sm" 
                      onClick={() => handleRunProject(project)}
                      className="flex-1"
                    >
                      <PlayIcon className="w-4 h-4 mr-1" />
                      Run
                    </ShadcnButton>
                    <ShadcnButton 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEditProject(project)}
                    >
                      <EditIcon className="w-4 h-4" />
                    </ShadcnButton>
                    <ShadcnButton 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDeleteProject(project)}
                    >
                      <DeleteIcon className="w-4 h-4" />
                    </ShadcnButton>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </Box>
      </Container>

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