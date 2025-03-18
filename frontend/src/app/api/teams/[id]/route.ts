import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;  // Extract ID early to avoid repeated access
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

    // Update the team in the database
    const { data, error } = await supabase
      .from('teams')
      .update({
        name,
        description,
        agent_list: agent_ids,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)  // Use the extracted ID
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating team:', error);
      return NextResponse.json(
        { error: 'Failed to update team' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Team not found or unauthorized' },
        { status: 404 }
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