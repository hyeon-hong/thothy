"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import MyAgents from "@/components/MyAgents";
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
import { Users, Pencil, X } from "lucide-react";
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

type Staff = {
  id: string;
  name: string;
  description: string;
  role: string;
  created_at: string;
  agent_list?: string[];
};

type Agent = {
  id: string;
  name: string;
  description: string;
  image_url: string;
};

type StaffDialogProps = {
  isEdit?: boolean;
  staffName: string;
  setStaffName: (name: string) => void;
  staffDescription: string;
  setStaffDescription: (desc: string) => void;
  selectedAgents: string[];
  setSelectedAgents: React.Dispatch<React.SetStateAction<string[]>>;
  agents: Agent[];
  onSubmit: () => void;
  getAgentName: (id: string) => string;
  toggleAgent: (id: string) => void;
};

const StaffDialog = ({
  isEdit = false,
  staffName,
  setStaffName,
  staffDescription,
  setStaffDescription,
  selectedAgents,
  setSelectedAgents,
  agents = [],
  onSubmit,
  getAgentName,
  toggleAgent,
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
      <Label htmlFor="selected-agents">Assigned Agents</Label>
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
              height: "200px",
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
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

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
            console.warn("API call failed, fetching directly from Supabase");
            const supabase = createSupabaseClient();
            const { data, error } = await supabase
              .from("agents")
              .select("*");
              
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
              .select("*");
              
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
          if (staffResponse.ok) {
            staffData = await staffResponse.json();
          } else {
            // If API fails, we could try to fetch from Supabase if you have a staff table
            console.warn("Failed to fetch staff from API");
            const supabase = createSupabaseClient();
            const { data, error } = await supabase
              .from("staffs")
              .select("*");
              
            if (!error && data) {
              staffData = data as Staff[];
            } else {
              // Initialize with empty array if no staff data
              staffData = [];
            }
          }
        } catch (error) {
          console.error("Error fetching staff:", error);
          // Initialize with empty array if fetching fails
          staffData = [];
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

  const handleAddStaff = async () => {
    try {
      const newStaff = {
        id: `staff-${Date.now()}`,
        name: staffName,
        description: staffDescription,
        role: "default",
        created_at: new Date().toISOString()
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
        
        // Determine which agent to use (using the first one if multiple are selected)
        const agentId = selectedAgents.length > 0 ? selectedAgents[0] : null;
        if (!agentId) {
          throw new Error("At least one agent must be selected");
        }
        
        // Insert according to the staffs table schema
        const { data, error } = await supabase
          .from("staffs")
          .insert({
            user_id: userData.user.id,
            agent_id: agentId,
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
            role: "default",
            created_at: data.created_at,
            agent_list: selectedAgents
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
      setSelectedAgents([]);
      setShowDialog(false);
    } catch (error) {
      console.error("Failed to add staff:", error);
    }
  };

  const handleEditStaff = async () => {
    if (!editingStaff) return;

    try {
      const updatedStaff = {
        ...editingStaff,
        name: staffName,
        description: staffDescription,
      };

      let savedStaff;
      try {
        // If API fails, update directly in Supabase
        console.warn("API failed, updating directly in Supabase");
        const supabase = createSupabaseClient();
        
        // Determine which agent to use (first in the list)
        const agentId = selectedAgents.length > 0 ? selectedAgents[0] : null;
        if (!agentId) {
          throw new Error("At least one agent must be selected");
        }
        
        // Update according to the staffs table schema
        const { data, error } = await supabase
          .from("staffs")
          .update({
            agent_id: agentId,
            // We can't update user_id as it's likely a foreign key
            // updated_at will be set automatically
          })
          .eq('id', editingStaff.id)
          .select()
          .single();
          
        if (error) {
          throw new Error(`Supabase error: ${error.message}`);
        }
        
        if (data) {
          // Add our local fields to the returned data for our local state
          savedStaff = {
            ...editingStaff,
            id: data.id,
            name: staffName,
            description: staffDescription,
            agent_list: selectedAgents,
            updated_at: data.updated_at
          };
        } else {
          // Use local object as last resort
          savedStaff = updatedStaff;
        }
      } catch (error) {
        console.error("Error updating staff:", error);
        // Use local object if all else fails
        savedStaff = updatedStaff;
      }

      // Update the staff in the staff list
      setStaffMembers((prevStaff) =>
        prevStaff.map((staff) =>
          staff.id === editingStaff.id ? savedStaff : staff
        )
      );

      // Reset form
      setStaffName("");
      setStaffDescription("");
      setSelectedAgents([]);
      setEditingStaff(null);
      setShowDialog(false);
    } catch (error) {
      console.error("Failed to update staff:", error);
    }
  };

  const handleDialogChange = (open: boolean, isEdit: boolean) => {
    if (!open) {
      setStaffName("");
      setStaffDescription("");
      setSelectedAgents([]);
      if (isEdit) {
        setEditingStaff(null);
        setShowDialog(false);
      } else {
        setShowDialog(false);
      }
    }
  };

  // Function to get role badge color
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "manager": return "default";
      case "developer": return "secondary";
      case "designer": return "destructive";
      case "content": return "outline";
      case "admin": return "secondary";
      default: return "secondary";
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
                  selectedAgents={selectedAgents}
                  setSelectedAgents={setSelectedAgents}
                  agents={agents}
                  onSubmit={editingStaff ? handleEditStaff : handleAddStaff}
                  getAgentName={getAgentName}
                  toggleAgent={toggleAgent}
                />
              </Dialog>
            </div>
          </div>

          {/* Staff grid */}
          <div className="mt-4">
            {staffMembers.length === 0 ? (
              <p className="text-center text-muted-foreground">
                No staff members added yet. Start by adding your first staff member!
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {staffMembers.map((staff) => (
                  <Card key={staff.id} className="flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div>
                        <CardTitle>{staff.name}</CardTitle>
                        <CardDescription>
                          Added on {new Date(staff.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => {
                          setEditingStaff(staff);
                          setStaffName(staff.name);
                          setStaffDescription(staff.description);
                          setSelectedAgents(staff.agent_list || []);
                          setShowDialog(true);
                        }}
                        size="icon"
                        variant="outline"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2">
                        {staff.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge variant={getRoleBadgeVariant(staff.role)}>
                          {staff.role.charAt(0).toUpperCase() + staff.role.slice(1)}
                        </Badge>
                      </div>
                      {staff.agent_list && staff.agent_list.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-1">Assigned Agents:</p>
                          <div className="flex flex-wrap gap-2">
                            {staff.agent_list.map((agentId) => {
                              const agent = agents.find((a) => a.id === agentId);
                              return agent ? (
                                <Badge key={agentId} variant="outline">
                                  {agent.name}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}
      
      <div className="mt-6">
        <MyAgents />
      </div>
    </div>
  );
} 