import { NextResponse } from "next/server";
// The client you created from the Server-Side Auth instructions
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    console.log("code", code);
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get("next") ?? "/";

    if (code) {
        const supabase = await createClient();
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        console.log("error", error);
        
        if (!error && data?.session) {
            // Manually set cookies for sb-access-token and sb-refresh-token
            const cookieStore = await cookies();
            
            // Set access token cookie
            cookieStore.set("sb-access-token", data.session.access_token, {
                path: "/",
                secure: process.env.NODE_ENV !== "development",
                httpOnly: true,
                sameSite: "lax",
                maxAge: 60 * 60 * 24 * 7, // 1 week
            });
            
            // Set refresh token cookie
            cookieStore.set("sb-refresh-token", data.session.refresh_token, {
                path: "/",
                secure: process.env.NODE_ENV !== "development",
                httpOnly: true,
                sameSite: "lax",
                maxAge: 60 * 60 * 24 * 7, // 1 week
            });

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
        }
    }
    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
