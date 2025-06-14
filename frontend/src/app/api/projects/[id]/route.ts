import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { Client } from "@langchain/langgraph-sdk";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
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

    // Update the project in the database
    const { data, error } = await supabase
      .from('projects')
      .update(dataToUpdate)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating project:', error);
      return NextResponse.json(
        { error: 'Failed to update project' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Project not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in projects API:', error);
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

    // First, get the project to check if it exists and get session_id
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('session_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !project) {
      return NextResponse.json(
        { error: 'Project not found or unauthorized' },
        { status: 404 }
      );
    }

    // If there's a session_id (thread_id), delete the thread from LangGraph
    if (project.session_id) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;
        
        if (accessToken) {
          const apiUrl = process.env.NEXT_PUBLIC_LANGGRAPH_API_URL;
          const client = new Client({
            apiUrl,
            defaultHeaders: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          // Delete the thread
          await client.threads.delete(project.session_id);
        }
      } catch (langGraphError) {
        console.error('Error deleting LangGraph thread:', langGraphError);
        // Continue with database deletion even if LangGraph deletion fails
      }
    }

    // Delete the project from the database
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting project:', error);
      return NextResponse.json(
        { error: 'Failed to delete project' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in projects API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 