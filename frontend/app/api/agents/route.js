import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET() {
    try {
        // Get host from request headers
        const headersList = await headers();
        const host = headersList.get("host") || "localhost:3000";
        const protocol = headersList.get("x-forwarded-proto") || "http";
        const baseUrl = `${protocol}://${host}`;

        const response = await fetch(`${baseUrl}/api/supabase`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                action: "select",
                table: "agents",
                query: {
                    select: "id, name, description, image_url, graph_name",
                },
            }),
        });

        if (!response.ok) {
            throw new Error("Failed to fetch agents");
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching agents:", error);
        return NextResponse.json(
            { error: "Failed to fetch agents" },
            { status: 500 }
        );
    }
}
