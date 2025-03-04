import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

if (!process.env.NEXT_PUBLIC_SUPABASE_API_URL) {
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_API_URL');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_API_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET() {
    try {
        const { data: agents, error } = await supabase
            .from("agents")
            .select("id, name, description, image_url, graph_name");

        if (error) throw error;

        return NextResponse.json(agents);
    } catch (error) {
        console.error("Error fetching agents:", error);
        return NextResponse.json(
            { error: "Failed to fetch agents" },
            { status: 500 }
        );
    }
}
