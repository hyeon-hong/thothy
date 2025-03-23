import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const supabasePromise = createClient();
  const supabase = await supabasePromise;

  // Check authentication
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get a specific staff member with agent information
    const { data, error } = await supabase
      .from("staffs")
      .select(`
        *,
        agents:agent_id (
          id,
          name,
          description,
          image_url
        )
      `)
      .eq("id", id)
      .single();

    if (error) throw error;

    // Transform data to match frontend expectations
    const transformedData = {
      id: data.id,
      name: data.name || data.agents?.name || "Unnamed Staff",
      description: data.description || data.agents?.description || "",
      created_at: data.created_at,
      agent_id: data.agent_id
    };

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error("Error fetching staff:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const supabasePromise = createClient();
  const supabase = await supabasePromise;

  // Check authentication
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, description, agent_id } = await request.json();

    if (!agent_id) {
      return NextResponse.json(
        { error: "Agent ID is required" },
        { status: 400 }
      );
    }

    // Update a staff member
    const { data, error } = await supabase
      .from("staffs")
      .update({
        name,
        description,
        agent_id,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating staff:", error);
    return NextResponse.json(
      { error: "Failed to update staff" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const supabasePromise = createClient();
  const supabase = await supabasePromise;

  // Check authentication
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Delete a staff member
    const { error } = await supabase.from("staffs").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting staff:", error);
    return NextResponse.json(
      { error: "Failed to delete staff" },
      { status: 500 }
    );
  }
} 