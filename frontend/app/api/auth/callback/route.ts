import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function GET(request: Request) {
    console.log("\n\n=== AUTH CALLBACK RECEIVED ===");
    console.log("Time:", new Date().toISOString());
    console.log("Full request URL:", request.url);
    
    // Log complete request details
    const requestUrl = new URL(request.url);
    console.log("Request origin:", requestUrl.origin);
    console.log("Request pathname:", requestUrl.pathname); 
    console.log("Request protocol:", requestUrl.protocol);
    console.log("Request host:", requestUrl.host);
    
    // Detailed analysis of search parameters
    console.log("Search params raw:", requestUrl.search);
    const paramsObj = Object.fromEntries(requestUrl.searchParams.entries());
    console.log("Search params parsed:", paramsObj);
    
    // Check specific parameters
    const code = requestUrl.searchParams.get("code");
    const error = requestUrl.searchParams.get("error");
    const errorDescription = requestUrl.searchParams.get("error_description");
    const state = requestUrl.searchParams.get("state");
    
    console.log("Code parameter:", code);
    console.log("Code present:", !!code);
    console.log("Error parameter:", error);
    console.log("Error present:", !!error);
    console.log("Error description:", errorDescription);
    console.log("State parameter:", state);
    
    // Log all request headers for debugging
    const headerObj: Record<string, string> = {};
    request.headers.forEach((value, key) => {
        headerObj[key] = value;
    });
    console.log("Request headers:", headerObj);
    
    // Check for referrer information
    const referrer = request.headers.get("referer");
    console.log("Referrer:", referrer);
    
    // Check cookies for OAuth flow tracking
    let oauthInProgress = false;
    let expectedState = '';
    try {
        // Check the Cookie header directly from the request
        const cookieHeader = request.headers.get("cookie") || "";
        console.log("Raw cookie header:", cookieHeader);
        oauthInProgress = cookieHeader.includes("supabase_oauth_in_progress");
        console.log("OAuth flow cookie present:", oauthInProgress);
        
        // Parse cookies for more details
        const cookiePairs = cookieHeader.split(';').map(c => c.trim());
        const cookieObj: Record<string, string> = {};
        cookiePairs.forEach(pair => {
            const [key, value] = pair.split('=');
            if (key) cookieObj[key] = value || '';
        });
        console.log("Parsed cookies:", cookieObj);
        
        // Get the expected state from cookies
        expectedState = cookieObj['supabase_oauth_state'] || '';
        console.log("Expected state from cookie:", expectedState);
        
        // Verify state parameter if present
        if (state && expectedState && state !== expectedState) {
            console.error("⚠️ State parameter mismatch! Possible CSRF attack");
            return NextResponse.redirect(
                new URL(`/auth/auth-code-error?reason=state_mismatch`, requestUrl.origin)
            );
        }
    } catch (e) {
        console.error("Error checking for OAuth flow cookie:", e);
    }
    
    // Check if callback was directly accessed
    if (!code && !error && !state && oauthInProgress) {
        console.error("⚠️ Callback accessed directly without OAuth parameters");
        console.error("This indicates a potential Supabase configuration issue");
        console.error("Please check that your Google OAuth provider is properly configured in Supabase");
        
        return NextResponse.redirect(
            new URL(`/auth/auth-code-error?reason=direct_callback_access`, requestUrl.origin)
        );
    }
    
    if (error || errorDescription) {
        console.error("OAuth error detected:", error, errorDescription);
        return NextResponse.redirect(
            new URL(`/auth/auth-code-error?error=${encodeURIComponent(error || '')}&errorDescription=${encodeURIComponent(errorDescription || '')}`, requestUrl.origin)
        );
    }

    // Redirect to homepage after successful authentication
    const redirectTo = "/";

    if (code) {
        console.log("Code found, attempting to exchange for session...");
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
            console.log("Calling Supabase auth.exchangeCodeForSession with code:", code.substring(0, 10) + "...");
            // Exchange the code for a session
            const { data, error } = await supabase.auth.exchangeCodeForSession(
                code
            );

            if (error) {
                console.error("Error exchanging code for session:", error);
                console.error("Error details:", JSON.stringify(error, null, 2));
                return NextResponse.redirect(
                    new URL(`/auth/auth-code-error?error=${encodeURIComponent(error.message)}&code=exchange_failed`, requestUrl.origin)
                );
            }

            console.log("Session successfully created!");
            console.log("Session data:", JSON.stringify({
                user_id: data.session?.user?.id,
                user_email: data.session?.user?.email,
                session_expires_at: data.session?.expires_at,
            }, null, 2));
            
            // Create a response with the redirected URL
            const response = NextResponse.redirect(
                new URL(redirectTo, requestUrl.origin)
            );

            // Clear the OAuth flow cookies
            response.cookies.set("supabase_oauth_in_progress", "", {
                path: "/",
                expires: new Date(0),
            });
            
            response.cookies.set("supabase_oauth_state", "", {
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

            console.log("Auth cookies set, redirecting to homepage");
            return response;
        } catch (err) {
            console.error("Unexpected error in auth callback:", err);
            console.error("Error details:", err instanceof Error ? err.stack : String(err));
            return NextResponse.redirect(
                new URL("/auth/auth-code-error?reason=exchange_error&details=" + encodeURIComponent(String(err)), requestUrl.origin)
            );
        }
    }

    // If we reached here, there's no code and no explicit error
    console.error("⚠️ No code found in callback and no error specified");
    console.error("This could be due to:");
    console.error("1. OAuth flow was interrupted");
    console.error("2. User canceled authentication");
    console.error("3. Supabase configuration issue");
    console.error("4. Network or cookie issues preventing proper redirect");
    
    // Create a more detailed error message based on the situation
    let errorReason = "no_code";
    if (!oauthInProgress) {
        errorReason = "no_oauth_flow";
    } else if (!state) {
        errorReason = "no_state_parameter";
    } else if (state !== expectedState) {
        errorReason = "state_mismatch";
    }
    
    return NextResponse.redirect(
        new URL(`/auth/auth-code-error?reason=${errorReason}&url=${encodeURIComponent(request.url)}`, requestUrl.origin)
    );
}
