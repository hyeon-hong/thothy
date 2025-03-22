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
        const [staffResponse, agentsResponse] = await Promise.all([
          fetch("/api/staff"),
          fetch("/api/agents"),
        ]);
        
        if (!staffResponse.ok || !agentsResponse.ok) {
          throw new Error("Failed to fetch data");
        }
        
        const [staffData, agentsData] = await Promise.all([
          staffResponse.json(),
          agentsResponse.json(),
        ]);
        
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
      const response = await fetch("/api/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: staffName,
          description: staffDescription,
          role: "default",
          agent_list: selectedAgents,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      // Add the new staff to the staff list
      setStaffMembers((prevStaff) => [data, ...prevStaff]);

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
      const response = await fetch(`/api/staff/${editingStaff.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: staffName,
          description: staffDescription,
          role: editingStaff.role,
          agent_list: selectedAgents,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      // Update the staff in the staff list
      setStaffMembers((prevStaff) =>
        prevStaff.map((staff) =>
          staff.id === editingStaff.id ? data : staff
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