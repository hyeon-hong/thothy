import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        const supabase = await createClient();
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error signing up:", error);
        return NextResponse.json(
            { error: "Failed to sign up" },
            { status: 500 }
        );
    }
} 