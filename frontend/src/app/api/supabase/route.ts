import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Initialize Supabase client on the server side
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Define interface for the request body
interface SupabaseRequest {
    action: 'select' | 'insert' | 'update' | 'delete';
    table: string;
    query?: {
        select?: string;
        data?: Record<string, any>;
        column?: string;
        value?: any;
    };
}

export async function POST(request: Request) {
    try {
        const { action, table, query } = await request.json() as SupabaseRequest;

        if (!action || !table) {
            return NextResponse.json(
                { error: "Missing required parameters" },
                { status: 400 }
            );
        }

        let result: any;
        switch (action) {
            case "select":
                result = await supabase
                    .from(table)
                    .select(query?.select || "*");
                break;
            case "insert":
                result = await supabase
                    .from(table)
                    .insert(query?.data || {});
                break;
            case "update":
                result = await supabase
                    .from(table)
                    .update(query?.data || {})
                    .eq(query?.column || '', query?.value);
                break;
            case "delete":
                result = await supabase
                    .from(table)
                    .delete()
                    .eq(query?.column || '', query?.value);
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