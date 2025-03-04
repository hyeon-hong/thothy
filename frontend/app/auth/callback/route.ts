import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from 'next/headers';

if (!process.env.SUPABASE_API_URL) {
    throw new Error('Missing environment variable: SUPABASE_API_URL');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing environment variable: SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(
    process.env.SUPABASE_API_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');
        const next = searchParams.get('next') ?? '/';

        if (code) {
            const cookieStore = cookies();
            const supabaseClient = createClient(
                process.env.SUPABASE_API_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                {
                    cookies: {
                        get(name: string) {
                            return cookieStore.get(name)?.value;
                        },
                        set(name: string, value: string, options: any) {
                            cookieStore.set({ name, value, ...options });
                        },
                        remove(name: string, options: any) {
                            cookieStore.set({ name, value: '', ...options });
                        },
                    },
                }
            );

            const { error } = await supabaseClient.auth.exchangeCodeForSession(code);
            if (!error) {
                return NextResponse.redirect(new URL(next, request.url));
            }
        }

        // Return the user to an error page with instructions
        return NextResponse.redirect(new URL('/auth/auth-code-error', request.url));
    } catch (error) {
        console.error("Error handling OAuth callback:", error);
        return NextResponse.redirect(new URL('/auth/auth-code-error', request.url));
    }
} 