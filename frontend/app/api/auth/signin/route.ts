import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    
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

    // Build a fully qualified callback URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin;
    const callbackUrl = `${appUrl}/api/auth/callback`;
    console.log("Callback URL:", callbackUrl);

    // Create the OAuth sign-in URL
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: callbackUrl,
                // Make sure the scopes include the necessary permissions
                scopes: "email profile",
            },
        });
        
        console.log("Google sign in data:", data);

        if (error) {
            console.error("Error signing in with Google:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!data.url) {
            console.error("No OAuth URL returned from Supabase");
            return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
        }

        // Set a cookie to track that we're in the OAuth flow
        const response = NextResponse.redirect(data.url);
        response.cookies.set("supabase_oauth_in_progress", "true", {
            path: "/",
            httpOnly: true,
            maxAge: 60 * 5, // 5 minutes
            sameSite: "lax",
        });

        console.log("Redirecting to Google OAuth URL:", data.url);
        return response;
    } catch (err) {
        console.error("Unexpected error during OAuth initialization:", err);
        return NextResponse.redirect(new URL("/auth/auth-code-error", requestUrl.origin));
    }
}
