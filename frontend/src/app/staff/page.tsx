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
import { Users, Pencil } from "lucide-react";
import { createClient as createSupabaseClient } from "@/utils/supabase/client";

type Staff = {
  id: string;
  name: string;
  description: string;
  role: string;
  created_at: string;
};

type StaffDialogProps = {
  isEdit?: boolean;
  staffName: string;
  setStaffName: (name: string) => void;
  staffDescription: string;
  setStaffDescription: (desc: string) => void;
  onSubmit: () => void;
};

const StaffDialog = ({
  isEdit = false,
  staffName,
  setStaffName,
  staffDescription,
  setStaffDescription,
  onSubmit,
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
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [staffName, setStaffName] = useState("");
  const [staffDescription, setStaffDescription] = useState("");
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  useEffect(() => {
    // Don't redirect while auth is loading
    if (loading) return;

    // Only redirect if auth has finished loading and there's no user
    if (!loading && !user) {
      router.push("/auth/login");
      return;
    }

    const fetchStaff = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/staff");
        if (!response.ok) throw new Error("Failed to fetch staff data");
        
        const staffData = await response.json();
        setStaffMembers(staffData);
      } catch (error) {
        console.error("Failed to fetch staff:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStaff();
  }, [user, router, loading]);

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
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      // Add the new staff to the staff list
      setStaffMembers((prevStaff) => [data, ...prevStaff]);

      // Reset form
      setStaffName("");
      setStaffDescription("");
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
                  onSubmit={editingStaff ? handleEditStaff : handleAddStaff}
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
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={getRoleBadgeVariant(staff.role)}>
                          {staff.role.charAt(0).toUpperCase() + staff.role.slice(1)}
                        </Badge>
                      </div>
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