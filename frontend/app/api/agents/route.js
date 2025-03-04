import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

if (!process.env.SUPABASE_API_URL) {
    throw new Error('Missing environment variable: SUPABASE_API_URL');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing environment variable: SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(
    process.env.SUPABASE_API_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/supabase`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'select',
                table: 'agents',
                query: {
                    select: 'id, name, description, image_url, graph_name'
                }
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch agents');
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching agents:", error);
        return NextResponse.json(
            { error: "Failed to fetch agents" },
            { status: 500 }
        );
    }
}
