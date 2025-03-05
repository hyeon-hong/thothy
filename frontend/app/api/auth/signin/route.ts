import { createServerClient } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    console.log("\n\n=== SIGN-IN ROUTE CALLED ===");
    console.log("Time:", new Date().toISOString());
    console.log("Full request URL:", request.url);

    // Log request details for debugging
    const requestUrl = new URL(request.url);
    console.log("Request origin:", requestUrl.origin);
    console.log("Request pathname:", requestUrl.pathname);
    console.log(
        "Request search params:",
        Object.fromEntries(requestUrl.searchParams.entries())
    );

    try {
        // Determine the callback URL based on environment
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin;
        const callbackUrl = `${baseUrl}/auth/callback`;
        console.log("Callback URL:", callbackUrl);

        // Create a Supabase client with the service role key
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
            // {
            //     auth: {
            //         autoRefreshToken: false,
            //         persistSession: false,
            //     },
            // }
        );

        console.log("Calling Supabase auth.signInWithOAuth...");

        // Initialize OAuth sign-in with Google
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: callbackUrl,
                scopes: "email profile",
            },
        });

        if (error) {
            console.error("Error generating OAuth URL:", error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        if (!data.url) {
            console.error("No OAuth URL returned");
            return NextResponse.json(
                { error: "Failed to generate authentication URL" },
                { status: 500 }
            );
        }

        console.log("OAuth URL generated:", data.url);

        // Create a response with the redirected URL - using 302 status code
        const response = NextResponse.redirect(data.url, { status: 302 });
        return response;
    } catch (err) {
        console.error("Unexpected error in sign-in:", err);
        return NextResponse.json(
            { error: "Authentication initialization failed" },
            { status: 500 }
        );
    }
}
