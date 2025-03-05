import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
    console.log("\n\n=== AUTH CALLBACK RECEIVED ===");
    console.log("Time:", new Date().toISOString());
    console.log("Full request URL:", request.url);

    const requestUrl = new URL(request.url);
    console.log("Request pathname:", requestUrl.pathname);
    console.log("Search params:", requestUrl.search);

    // Extract code and state parameters
    const code = requestUrl.searchParams.get("code");
    const state = requestUrl.searchParams.get("state");
    const error = requestUrl.searchParams.get("error");
    const errorDescription = requestUrl.searchParams.get("error_description");

    console.log("Code present:", !!code);
    console.log("State parameter:", state);

    // Handle error from OAuth provider
    if (error) {
        console.error("OAuth error:", error, errorDescription);
        return NextResponse.redirect(
            new URL(
                `/auth/auth-code-error?error=${encodeURIComponent(error)}`,
                requestUrl.origin
            )
        );
    }

    // If no code is provided, redirect to error page
    if (!code) {
        console.error("No code provided in callback");
        return NextResponse.redirect(
            new URL("/auth/auth-code-error?reason=no_code", requestUrl.origin)
        );
    }

    try {
        // Create Supabase client with service role key
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

        console.log("Exchanging code for session...");

        // Exchange the authorization code for a session
        const { data, error } = await supabase.auth.exchangeCodeForSession(
            code
        );

        if (error) {
            console.error("Error exchanging code for session:", error);
            return NextResponse.redirect(
                new URL(
                    `/auth/auth-code-error?error=${encodeURIComponent(
                        error.message
                    )}`,
                    requestUrl.origin
                )
            );
        }

        console.log("Session created successfully");
        console.log("User ID:", data.session?.user?.id);
        console.log("User email:", data.session?.user?.email);

        // Create a response with redirect to home page
        const response = NextResponse.redirect(new URL("/", requestUrl.origin));

        // Clear OAuth flow cookies
        response.cookies.set("supabase_oauth_state", "", {
            path: "/",
            expires: new Date(0),
        });

        response.cookies.set("supabase_oauth_in_progress", "", {
            path: "/",
            expires: new Date(0),
        });

        // Set auth session cookies
        response.cookies.set("sb-access-token", data.session.access_token, {
            path: "/",
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 7, // 1 week
        });

        response.cookies.set("sb-refresh-token", data.session.refresh_token, {
            path: "/",
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 7, // 1 week
        });

        console.log("Auth cookies set, redirecting to homepage");
        return response;
    } catch (err) {
        console.error("Unexpected error in callback:", err);
        return NextResponse.redirect(
            new URL(
                `/auth/auth-code-error?reason=unknown_error`,
                requestUrl.origin
            )
        );
    }
}
