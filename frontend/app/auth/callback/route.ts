import { NextResponse } from "next/server";
// The client you created from the Server-Side Auth instructions
import { createServerClient } from "../../../lib/supabase";

export async function GET(request: Request) {
    console.log("\n\n=== AUTH CALLBACK RECEIVED ===");
    console.log("Request URL:", request.url);
    const { searchParams, origin } = new URL(request.url);
    console.log("searchParams:", searchParams);
    const code = searchParams.get("code");
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get("next") ?? "/";

    if (code) {
        const supabase = await createServerClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer
            const isLocalEnv = process.env.NODE_ENV === "development";
            if (isLocalEnv) {
                // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
                return NextResponse.redirect(`${origin}${next}`);
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${next}`);
            } else {
                return NextResponse.redirect(`${origin}${next}`);
            }
        } else {
            console.error("Error exchanging code for session:", error);
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
