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
    console.log('GET request received');
    try {
        console.log('request.url:', request.url);
        const { searchParams } = new URL(request.url);
        console.log('searchParams:', searchParams);
        const code = searchParams.get('code');
        const next = searchParams.get('next') ?? '/';
        console.log('code:', code);
        console.log('next:', next);

        if (code) {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            console.log('Exchange code for session data:', data);
            console.log('Exchange code for session error:', error);
            console.log('request.url:', request.url);
            if (!error) {
                return NextResponse.redirect(new URL(next, request.url));
            }
            console.error('Error exchanging code for session:', error);
        }

        return NextResponse.redirect(new URL('/auth/auth-code-error', request.url));
    } catch (error) {
        console.error("Error handling OAuth callback:", error);
        return NextResponse.redirect(new URL('/auth/auth-code-error', request.url));
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { access_token, refresh_token } = body;

        if (!access_token || !refresh_token) {
            console.error('Missing required tokens:', { 
                hasAccessToken: !!access_token,
                hasRefreshToken: !!refresh_token 
            });
            return NextResponse.json(
                { error: "Missing required tokens" },
                { status: 400 }
            );
        }

        // Set the session using the tokens
        const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
        });

        if (error) {
            console.error('Error setting session:', error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        // Get the user data
        const { data: { user }, error: userError } = await supabase.auth.getUser(access_token);
        
        if (userError) {
            console.error('Error getting user:', userError);
            return NextResponse.json(
                { error: userError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ 
            session: data.session,
            user 
        });
    } catch (error) {
        console.error("Error in POST /api/auth/callback:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to set session" },
            { status: 500 }
        );
    }
} 