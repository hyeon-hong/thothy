import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from 'next/headers';

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
        
        const cookieStore = cookies();
        const supabaseClient = createClient(
            process.env.SUPABASE_API_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                    set(name: string, value: string, options: any) {
                        cookieStore.set({ name, value, ...options });
                    },
                    remove(name: string, options: any) {
                        cookieStore.set({ name, value: '', ...options });
                    },
                },
            }
        );

        const redirectUrl = redirectTo || `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`;

        const { data, error } = await supabaseClient.auth.signInWithOAuth({
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