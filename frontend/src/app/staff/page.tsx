"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Users, Pencil, X, Trash2 } from "lucide-react";
import { createClient as createSupabaseClient } from "@/utils/supabase/client";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import React, { forwardRef } from "react";

type Staff = {
  id: string;
  name: string;
  description: string;
  created_at: string;
  agent_id?: string;
  graph_name?: string;
};

type Agent = {
  id: string;
  name: string;
  description: string;
  graph_name?: string;
};

type StaffDialogProps = {
  isEdit?: boolean;
  staffName: string;
  setStaffName: (name: string) => void;
  staffDescription: string;
  setStaffDescription: (desc: string) => void;
  selectedAgent: string;
  setSelectedAgent: (id: string) => void;
  agents: Agent[];
  onSubmit: () => void;
  getAgentName: (id: string) => string;
};

// Don't use the custom component wrapping, let the existing shadcn components handle refs properly
const StaffDialog = ({
  isEdit = false,
  staffName,
  setStaffName,
  staffDescription,
  setStaffDescription,
  selectedAgent,
  setSelectedAgent,
  agents = [],
  onSubmit,
  getAgentName,
}: StaffDialogProps) => (
  <DialogContent className="sm:max-w-[600px]">
    <DialogHeader>
      <DialogTitle>{isEdit ? "Edit staff" : "Add a staff member"}</DialogTitle>
      <DialogDescription>
        {isEdit
          ? "Update your staff member details."
          : "Create a new staff member for your organization."}
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-4 mt-2">
      <div className="space-y-2">
        <Label htmlFor="staff-name">Name</Label>
        <Input
          id="staff-name"
          value={staffName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setStaffName(e.target.value)
          }
          placeholder="Enter staff name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="staff-description">Description</Label>
        <Textarea
          id="staff-description"
          value={staffDescription}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setStaffDescription(e.target.value)
          }
          placeholder="Describe this staff member's responsibilities"
          rows={3}
        />
      </div>
    </div>

    <div className="mt-4 flex flex-col" style={{ height: "300px" }}>
      <Label htmlFor="selected-agent">Assigned Agent</Label>
      <div className="flex flex-wrap gap-1 p-2 mb-2 border rounded-md min-h-10">
        {!selectedAgent ? (
          <span className="text-sm text-muted-foreground px-1 py-0.5">
            No agent selected
          </span>
        ) : (
          <Badge
            key={selectedAgent}
            variant="secondary"
            className="flex items-center gap-1 px-2 py-1"
          >
            {getAgentName(selectedAgent)}
          </Badge>
        )}
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {agents ? (
          <Command
            className="border rounded-lg flex-1 overflow-hidden"
            style={{
              height: "200px",
            }}
          >
            <CommandInput placeholder="Search agents..." />
            <CommandEmpty>No agents found.</CommandEmpty>
            <CommandGroup className="overflow-y-auto h-full custom-scrollbar">
              {agents.map((agent) => (
                <CommandItem
                  key={agent.id}
                  onSelect={() => setSelectedAgent(agent.id)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center space-x-2 mr-2">
                    <Checkbox
                      id={`checkbox-${agent.id}`}
                      checked={selectedAgent === agent.id}
                      onCheckedChange={() => setSelectedAgent(agent.id)}
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      className={cn(
                        "transition-colors",
                        selectedAgent === agent.id
                          ? "border-primary data-[state=checked]:bg-white data-[state=checked]:text-black"
                          : ""
                      )}
                      style={
                        {
                          ...(selectedAgent === agent.id
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
                          selectedAgent === agent.id ? "font-medium" : ""
                        }
                      >
                        {agent.name}
                      </span>
                      {selectedAgent === agent.id && (
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
      <Button onClick={onSubmit}>
        {isEdit ? "Save changes" : "Add staff"}
      </Button>
    </DialogFooter>
  </DialogContent>
);

export default function StaffPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [staffName, setStaffName] = useState("");
  const [staffDescription, setStaffDescription] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);

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
        // Initialize empty arrays to store data
        let staffData: Staff[] = [];
        let agentsData: Agent[] = [];

        // First try to fetch agents from the API
        try {
          const agentsResponse = await fetch("/api/agents");
          if (agentsResponse.ok) {
            agentsData = await agentsResponse.json();
          } else {
            // If API fails, fetch directly from Supabase
            console.warn(
              `API call failed with status ${agentsResponse.status}, fetching directly from Supabase`
            );
            const supabase = createSupabaseClient();
            const { data, error } = await supabase
              .from("agents")
              .select("id, name, description, graph_name");

            if (error) {
              throw new Error(`Supabase error: ${error.message}`);
            }

            if (data) {
              agentsData = data as Agent[];
            }
          }
        } catch (error) {
          console.error("Error fetching agents:", error);
          // Fetch from Supabase as a fallback
          try {
            const supabase = createSupabaseClient();
            const { data, error } = await supabase
              .from("agents")
              .select("id, name, description, graph_name");

            if (error) {
              throw new Error(`Supabase error: ${error.message}`);
            }

            if (data) {
              agentsData = data as Agent[];
            }
          } catch (supabaseError) {
            console.error("Supabase fetch error:", supabaseError);
          }
        }

        // Now try to fetch staff data
        try {
          const staffResponse = await fetch("/api/staff");

          if (!staffResponse.ok) {
            throw new Error(
              `API call failed with status ${staffResponse.status}: ${await staffResponse.text()}`
            );
          }

          staffData = await staffResponse.json();
        } catch (error) {
          console.error("Error fetching staff:", error);
          // Try fetching directly from Supabase as fallback
          try {
            const supabase = createSupabaseClient();
            const { data, error } = await supabase.from("staffs").select(`
                *,
                agents:agent_id (
                  id,
                  name,
                  description,
                  graph_name
                )
              `);

            if (error) {
              throw new Error(`Supabase error: ${error.message}`);
            }

            if (data) {
              // Transform data to match the expected format
              staffData = data.map((item) => ({
                id: item.id,
                name: item.name || item.agents?.name || "Unnamed Staff",
                description: item.description || item.agents?.description || "",
                created_at: item.created_at,
                agent_id: item.agent_id,
              })) as Staff[];

              // Add a graph_name field to the staff data
              staffData = staffData.map((staff) => ({
                ...staff,
                graph_name:
                  agents.find((a) => a.id === staff.agent_id)?.graph_name || "",
              })) as Staff[];
            } else {
              staffData = [];
            }
          } catch (supabaseError) {
            console.error("Supabase staff fetch error:", supabaseError);
            staffData = [];
          }
        }

        setStaffMembers(staffData);
        setAgents(agentsData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, router, loading]);

  const getAgentName = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    return agent ? agent.name : "";
  };

  const handleAddStaff = async () => {
    if (!selectedAgent) {
      alert("Please select an agent for this staff member");
      return;
    }

    try {
      const newStaff = {
        id: `staff-${Date.now()}`,
        name: staffName,
        description: staffDescription,
        created_at: new Date().toISOString(),
        agent_id: selectedAgent,
      };

      let createdStaff;
      try {
        // If API fails, insert directly to Supabase
        console.warn("API failed, inserting directly to Supabase");
        const supabase = createSupabaseClient();

        // Get the current user's ID
        const { data: userData } = await supabase.auth.getUser();
        if (!userData || !userData.user) {
          throw new Error("User not authenticated");
        }

        // Insert according to the staffs table schema
        const { data, error } = await supabase
          .from("staffs")
          .insert({
            user_id: userData.user.id,
            agent_id: selectedAgent,
            name: staffName,
            description: staffDescription,
            // Note: created_at and updated_at have default values in the database
          })
          .select()
          .single();

        if (error) {
          throw new Error(`Supabase error: ${error.message}`);
        }

        if (data) {
          // Add our local fields to the data object for UI rendering
          createdStaff = {
            id: data.id,
            name: staffName,
            description: staffDescription,
            created_at: data.created_at,
            agent_id: selectedAgent,
          };
        } else {
          // Use local object as last resort
          createdStaff = newStaff;
        }
      } catch (error) {
        console.error("Error creating staff:", error);
        // Use local object if all else fails
        createdStaff = newStaff;
      }

      // Add the new staff to the staff list
      setStaffMembers((prevStaff) => [createdStaff, ...prevStaff]);

      // Reset form
      setStaffName("");
      setStaffDescription("");
      setSelectedAgent("");
      setShowDialog(false);
    } catch (error) {
      console.error("Failed to add staff:", error);
    }
  };

  const handleEditStaff = async () => {
    if (!editingStaff) return;
    if (!selectedAgent) {
      alert("Please select an agent for this staff member");
      return;
    }

    try {
      const supabase = createSupabaseClient();
      // Update the staff directly in Supabase
      const { data, error } = await supabase
        .from("staffs")
        .update({
          name: staffName,
          description: staffDescription,
          agent_id: selectedAgent,
        })
        .eq("id", editingStaff.id)
        .select("*");

      if (error) {
        throw new Error(error.message || "Failed to update staff");
      }

      const updatedStaff = data && data[0] ? data[0] : editingStaff;

      // Update the staff in the staff list
      setStaffMembers((prevStaff) =>
        prevStaff.map((staff) =>
          staff.id === editingStaff.id ? { ...staff, ...updatedStaff } : staff
        )
      );

      // Reset form
      setStaffName("");
      setStaffDescription("");
      setSelectedAgent("");
      setEditingStaff(null);
      setShowDialog(false);
    } catch (error) {
      console.error("Failed to update staff:", error);
      alert("Failed to update staff: " + (error as Error).message);
    }
  };

  const handleDialogChange = (open: boolean, isEdit: boolean) => {
    if (!open) {
      setStaffName("");
      setStaffDescription("");
      setSelectedAgent("");
      if (isEdit) {
        setEditingStaff(null);
        setShowDialog(false);
      } else {
        setShowDialog(false);
      }
    }
  };

  const handleDeleteStaff = async () => {
    if (!staffToDelete) return;
    try {
      const supabase = createSupabaseClient();
      const { error } = await supabase
        .from("staffs")
        .delete()
        .eq("id", staffToDelete.id);
      if (error) throw new Error(error.message);
      setStaffMembers((prev) => prev.filter((s) => s.id !== staffToDelete.id));
      setDeleteDialogOpen(false);
      setStaffToDelete(null);
    } catch (error) {
      alert("Failed to delete staff: " + (error as Error).message);
    }
  };

  return (
    <div className="container mx-auto px-4">
      <Header currentView="staff" />

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <p>Loading...</p>
        </div>
      ) : (
        <>
          <div className="mt-4 mb-4 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Staff</h1>
              <p className="text-muted-foreground">
                Manage your organization's staff members
              </p>
            </div>
            <div className="flex gap-2">
              <Dialog
                open={showDialog}
                onOpenChange={(open) =>
                  handleDialogChange(open, Boolean(editingStaff))
                }
              >
                <DialogTrigger asChild>
                  <Button onClick={() => setShowDialog(true)}>
                    <Users className="mr-2 h-4 w-4" />
                    Add Staff
                  </Button>
                </DialogTrigger>
                <StaffDialog
                  isEdit={Boolean(editingStaff)}
                  staffName={staffName}
                  setStaffName={setStaffName}
                  staffDescription={staffDescription}
                  setStaffDescription={setStaffDescription}
                  selectedAgent={selectedAgent}
                  setSelectedAgent={setSelectedAgent}
                  agents={agents}
                  onSubmit={editingStaff ? handleEditStaff : handleAddStaff}
                  getAgentName={getAgentName}
                />
              </Dialog>
            </div>
          </div>

          {/* Staff grid */}
          <div className="mt-4">
            {staffMembers.length === 0 ? (
              <p className="text-center text-muted-foreground">
                No staff members added yet. Start by adding your first staff
                member!
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {staffMembers.map((staff) => (
                  <Card
                    key={staff.id}
                    className={`flex flex-col h-full ${staff.agent_id ? "hover:shadow-md transition-shadow" : ""}`}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div>
                        <CardTitle>{staff.name}</CardTitle>
                        <CardDescription>
                          Added on{" "}
                          {new Date(staff.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingStaff(staff);
                            setStaffName(staff.name);
                            setStaffDescription(staff.description);
                            setSelectedAgent(staff.agent_id || "");
                            setShowDialog(true);
                          }}
                          size="icon"
                          variant="outline"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setStaffToDelete(staff);
                            setDeleteDialogOpen(true);
                          }}
                          size="icon"
                          variant="ghost"
                          aria-label="Delete staff"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {staff.description}
                        </p>
                        {staff.agent_id && (
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium">
                              Assigned Agent:
                            </p>
                            {(() => {
                              const agent = agents.find(
                                (a) => a.id === staff.agent_id
                              );
                              return agent ? (
                                <Badge key={agent.id} variant="outline">
                                  {agent.name}
                                </Badge>
                              ) : null;
                            })()}
                          </div>
                        )}
                      </div>
                      {/* Run button for staff */}
                      {staff.agent_id && (
                        <Button
                          variant="outline"
                          className="w-full mt-2"
                          style={{ marginTop: "auto" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            const agent = agents.find(
                              (a) => a.id === staff.agent_id
                            );
                            if (agent && agent.graph_name) {
                              router.push(`/agents/${agent.graph_name}`);
                            } else {
                              alert(
                                "Assigned agent not found or missing name."
                              );
                            }
                          }}
                        >
                          Run
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}
      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Staff</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this staff member? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteStaff}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
