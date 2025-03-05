import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    // Get the referer header to determine where the user came from
    const referer = request.headers.get("referer");

    // Extract the pathname from the referer URL if it exists and is from the same origin
    let redirectPath = "/";
    if (referer) {
        try {
            const refererUrl = new URL(referer);
            // Only use the referer if it's from our app
            if (refererUrl.origin === requestUrl.origin) {
                redirectPath = refererUrl.pathname;
            }
        } catch (e) {
            console.error("Error parsing referer URL:", e);
        }
    }

    // Get the redirect destination, defaulting to the referer path or homepage
    const redirectTo = redirectPath;

    console.log("Sign-in request with redirect to:", redirectTo);

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

    // Construct the callback URL without the redirect destination
    const callbackUrl = new URL(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`
    );
    console.log("Callback URL:", callbackUrl.toString());

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: callbackUrl.toString(),
        },
    });

    console.log("Google sign in data:", data);

    if (error) {
        console.error("Error signing in with Google:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("Redirecting to Google OAuth URL:", data.url);
    return NextResponse.redirect(data.url);
}
