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

export async function POST(request: Request) {
    console.log('Google sign in request received');
    try {
        const { redirectTo } = await request.json();
        console.log('Redirect to:', redirectTo);
        const redirectUrl = redirectTo || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`;

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectUrl,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        });
        console.log('Google sign in data:', data);
        console.log('Google sign in error:', error);

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error initiating Google sign in:", error);
        return NextResponse.json(
            { error: "Failed to initiate Google sign in" },
            { status: 500 }
        );
    }
} 