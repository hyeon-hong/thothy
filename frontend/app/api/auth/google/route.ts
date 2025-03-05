import { NextResponse } from "next/server";

export async function POST(request: Request) {
    console.log('Google sign in request received');
    try {
        // Redirect to the new Google sign-in implementation
        return NextResponse.json({ url: '/api/auth/signin' });
    } catch (error) {
        console.error("Error initiating Google sign in:", error);
        return NextResponse.json(
            { error: "Failed to initiate Google sign in" },
            { status: 500 }
        );
    }
} 