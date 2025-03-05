import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import crypto from 'crypto';

export async function GET(request: Request) {
    console.log("\n\n=== SIGN-IN ROUTE CALLED ===");
    console.log("Time:", new Date().toISOString());
    console.log("Full request URL:", request.url);

    // Log all request headers for debugging
    const allHeaders: Record<string, string> = {};
    request.headers.forEach((value, key) => {
        allHeaders[key] = value;
    });
    console.log("Request headers:", allHeaders);

    const requestUrl = new URL(request.url);
    console.log("Request origin:", requestUrl.origin);
    console.log("Request pathname:", requestUrl.pathname);
    console.log("Request search params:", Object.fromEntries(requestUrl.searchParams.entries()));

    // Generate a random state parameter to verify the callback
    const stateParam = crypto.randomBytes(16).toString('hex');
    console.log("Generated state param:", stateParam);

    const supabase = createClient(
        process.env.SUPABASE_API_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );

    // Check if required environment variables are set
    if (!process.env.SUPABASE_API_URL) {
        console.error("SUPABASE_API_URL environment variable is not set");
        return NextResponse.redirect(
            new URL("/auth/auth-code-error?reason=missing_env_vars", requestUrl.origin)
        );
    }

    // Build a fully qualified callback URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin;
    const callbackUrl = `${appUrl}/api/auth/callback`;
    console.log("Callback URL:", callbackUrl);
    console.log("NEXT_PUBLIC_APP_URL:", process.env.NEXT_PUBLIC_APP_URL);
    console.log("SUPABASE_API_URL:", process.env.SUPABASE_API_URL);

    // Create the OAuth sign-in URL
    try {
        console.log("Calling Supabase auth.signInWithOAuth...");
        console.log("Provider: google");
        
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: callbackUrl,
                // Make sure the scopes include the necessary permissions
                scopes: "email profile",
                // Add the state parameter for security
                queryParams: {
                    state: stateParam,
                    // Force re-authentication even if already authenticated
                    prompt: 'select_account',
                    // Use response_type=code for authorization code flow
                    response_type: 'code',
                }
            },
        });
        
        console.log("Google sign in data:", JSON.stringify(data, null, 2));

        if (error) {
            console.error("Error signing in with Google:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!data.url) {
            console.error("No OAuth URL returned from Supabase");
            return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
        }

        // Set a cookie to track that we're in the OAuth flow and store the state
        const response = NextResponse.redirect(data.url);
        response.cookies.set("supabase_oauth_in_progress", "true", {
            path: "/",
            httpOnly: true,
            maxAge: 60 * 5, // 5 minutes
            sameSite: "lax",
        });
        
        // Store the state parameter in a cookie for verification
        response.cookies.set("supabase_oauth_state", stateParam, {
            path: "/",
            httpOnly: true,
            maxAge: 60 * 5, // 5 minutes
            sameSite: "lax",
        });

        // Parse and log the redirect URL structure
        const redirectUrl = new URL(data.url);
        console.log("Redirecting to OAuth URL:");
        console.log("- Full URL:", data.url);
        console.log("- Origin:", redirectUrl.origin);
        console.log("- Pathname:", redirectUrl.pathname);
        console.log("- Redirect params:", Object.fromEntries(redirectUrl.searchParams.entries()));
        
        return response;
    } catch (err) {
        console.error("Unexpected error during OAuth initialization:", err);
        return NextResponse.redirect(new URL("/auth/auth-code-error", requestUrl.origin));
    }
}
