import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
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
    // Get all staff members with agent information
    const { data, error } = await supabase
      .from("staffs")
      .select(`
        *,
        agents:agent_id (
          id,
          name,
          description
        )
      `)
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Transform data to match frontend expectations
    const transformedData = data.map((staff) => ({
      id: staff.id,
      name: staff.name || staff.agents?.name || "Unnamed Staff",
      description: staff.description || staff.agents?.description || "",
      created_at: staff.created_at,
      agent_id: staff.agent_id
    }));

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error("Error fetching staff:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

    // Create a new staff member
    const { data, error } = await supabase
      .from("staffs")
      .insert({
        name,
        description,
        agent_id,
        user_id: session.user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating staff:", error);
    return NextResponse.json(
      { error: "Failed to create staff" },
      { status: 500 }
    );
  }
} 