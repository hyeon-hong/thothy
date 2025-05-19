import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;  // Extract ID early to avoid repeated access
    const updateData = await request.json();

    // Get the authenticated user's ID
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Add updated_at timestamp to the update data
    const dataToUpdate = {
      ...updateData,
      updated_at: new Date().toISOString()
    };

    // Update the team in the database
    const { data, error } = await supabase
      .from('teams')
      .update(dataToUpdate)
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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Get the authenticated user's ID
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Delete the team from the database
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting team:', error);
      return NextResponse.json(
        { error: 'Failed to delete team' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in teams API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 