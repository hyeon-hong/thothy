import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    
    // Check if this is a localhost development environment
    const isLocalEnv = process.env.NODE_ENV === "development";
    const forwardedHost = request.headers.get("x-forwarded-host"); // original host before load balancer
    console.log("forwardedHost", forwardedHost);
    console.log("process.env.NODE_ENV", process.env.NODE_ENV);
    console.log("isLocalEnv", isLocalEnv);
    
    // Determine the callback URL
    let callbackUrl;
    if (isLocalEnv) {
        callbackUrl = `${requestUrl.origin}/auth/callback`;
    } else if (forwardedHost) {
        callbackUrl = `https://${forwardedHost}/auth/callback`;
    } else {
        callbackUrl = `${requestUrl.origin}/auth/callback`;
    }
    console.log("callbackUrl", callbackUrl);

    // Get provider from query string and ensure it's a valid provider
    const providerParam = requestUrl.searchParams.get("provider") || "google";
    
    // Get the redirect URL from query string or default to "/"
    const redirectTo = requestUrl.searchParams.get("redirectTo") || "/";
    
    const supabase = await createClient();
    
    // Start the sign in process
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: providerParam as any, // Type assertion to avoid Provider type issues
        options: {
            redirectTo: callbackUrl,
            queryParams: {
                access_type: "offline",
                prompt: "consent",
                next: redirectTo,
            },
        },
    });
    
    if (error) {
        return NextResponse.redirect(
            `${requestUrl.origin}/auth/auth-code-error?error=${encodeURIComponent(
                error.message
            )}`
        );
    }
    
    // Redirect to the OAuth URL
    return NextResponse.redirect(data.url);
}
