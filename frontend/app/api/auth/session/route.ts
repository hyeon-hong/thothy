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

export async function GET(request: Request) {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        return NextResponse.json({ session });
    } catch (error) {
        console.error("Error getting session:", error);
        return NextResponse.json(
            { error: "Failed to get session" },
            { status: 500 }
        );
    }
} 