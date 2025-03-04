import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Initialize Supabase client on the server side
const supabase = createClient(
    process.env.SUPABASE_API_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const { action, table, query } = await request.json();

        if (!action || !table) {
            return NextResponse.json(
                { error: "Missing required parameters" },
                { status: 400 }
            );
        }

        let result;
        switch (action) {
            case "select":
                result = await supabase
                    .from(table)
                    .select(query?.select || "*");
                break;
            case "insert":
                result = await supabase
                    .from(table)
                    .insert(query?.data);
                break;
            case "update":
                result = await supabase
                    .from(table)
                    .update(query?.data)
                    .eq(query?.column, query?.value);
                break;
            case "delete":
                result = await supabase
                    .from(table)
                    .delete()
                    .eq(query?.column, query?.value);
                break;
            default:
                return NextResponse.json(
                    { error: "Invalid action" },
                    { status: 400 }
                );
        }

        if (result.error) throw result.error;

        return NextResponse.json(result.data);
    } catch (error) {
        console.error("Supabase operation error:", error);
        return NextResponse.json(
            { error: "Failed to perform Supabase operation" },
            { status: 500 }
        );
    }
} 