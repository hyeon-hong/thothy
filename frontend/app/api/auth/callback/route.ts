import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function GET(request: Request) {
    console.log("Auth callback received");
    
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const error = requestUrl.searchParams.get("error");
    const errorDescription = requestUrl.searchParams.get("error_description");
    
    console.log("Code present:", !!code);
    console.log("Error present:", !!error);
    
    // Check if our OAuth flow cookie exists - just check headers directly instead
    let oauthInProgress = false;
    try {
        // Check the Cookie header directly from the request
        const cookieHeader = request.headers.get('cookie') || '';
        oauthInProgress = cookieHeader.includes('supabase_oauth_in_progress');
        console.log("OAuth flow cookie present:", oauthInProgress);
    } catch (e) {
        console.error("Error checking for OAuth flow cookie:", e);
    }
    
    // Log all the request headers and query params for debugging
    console.log("Request URL:", request.url);
    console.log("Query params:", Object.fromEntries(requestUrl.searchParams.entries()));
    
    // Get all headers
    const headerObj: Record<string, string> = {};
    request.headers.forEach((value, key) => {
        headerObj[key] = value;
    });
    console.log("Headers:", headerObj);
    
    if (error || errorDescription) {
        console.error("OAuth error:", error, errorDescription);
        return NextResponse.redirect(
            new URL(`/auth/auth-code-error?error=${encodeURIComponent(error || '')}`, requestUrl.origin)
        );
    }

    // Redirect to homepage after successful authentication
    const redirectTo = "/";

    if (code) {
        // Create a Supabase client without session handling
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

        try {
            // Exchange the code for a session
            const { data, error } = await supabase.auth.exchangeCodeForSession(
                code
            );

            if (error) {
                console.error("Error exchanging code for session:", error);
                return NextResponse.redirect(
                    new URL(`/auth/auth-code-error?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
                );
            }

            console.log("Session created, redirecting to homepage");
            // Create a response with the redirected URL
            const response = NextResponse.redirect(
                new URL(redirectTo, requestUrl.origin)
            );

            // Clear the OAuth flow cookie
            response.cookies.set("supabase_oauth_in_progress", "", {
                path: "/",
                expires: new Date(0),
            });

            // Set auth cookies
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

            return response;
        } catch (err) {
            console.error("Unexpected error in auth callback:", err);
            return NextResponse.redirect(
                new URL("/auth/auth-code-error?reason=exchange_error", requestUrl.origin)
            );
        }
    }

    // If we reached here, there's no code and no explicit error
    console.error("No code found in callback and no error specified - possible OAuth misconfiguration");
    
    // Create a more detailed error message
    let errorReason = "no_code";
    if (!oauthInProgress) {
        errorReason = "no_oauth_flow";
    }
    
    return NextResponse.redirect(
        new URL(`/auth/auth-code-error?reason=${errorReason}`, requestUrl.origin)
    );
}
