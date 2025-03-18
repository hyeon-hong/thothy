import { NextRequest, NextResponse } from "next/server";
import { Client } from "@langchain/langgraph-sdk";
import { verifyUserAuthenticated } from "../../../agents/plan_agent/lib/supabase/verify_user_server";

export async function POST(req: NextRequest) {
  try {
    const authRes = await verifyUserAuthenticated();
    if (!authRes?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } catch (e) {
    console.error("Failed to fetch user", e);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { namespace, key } = await req.json();

  const lgClient = new Client({
    apiKey: process.env.NEXT_PUBLIC_LANGSMITH_API_KEY,
    apiUrl: process.env.NEXT_PUBLIC_LANGGRAPH_API_URL,
  });

  try {
    const item = await lgClient.store.getItem(namespace, key);

    return new NextResponse(JSON.stringify({ item }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (_) {
    return new NextResponse(
      JSON.stringify({ error: "Failed to share run after multiple attempts." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
