import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  try {
    const { name, description, agent_ids } = await request.json();

    if (!name || !description || !agent_ids) {
      return NextResponse.json(
        { error: "Name, description, and agent_ids are required" },
        { status: 400 }
      );
    }

    // Get the authenticated user's ID
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Insert the team into the database
    const { data, error } = await supabase
      .from('teams')
      .insert([
        {
          name,
          description,
          agent_list: agent_ids,
          user_id: user.id,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating team:', error);
      return NextResponse.json(
        { error: 'Failed to create team' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in teams API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 