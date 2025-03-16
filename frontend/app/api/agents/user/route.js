import { NextResponse } from "next/server";
import { saveUserAgent, getUserAgents, removeUserAgent } from "@/lib/db";

export async function POST(request) {
  try {
    const { userId, agentId } = await request.json();
    const userAgent = await saveUserAgent(userId, agentId);
    return NextResponse.json(userAgent);
  } catch (error) {
    console.error("Error in agent API:", error);
    return NextResponse.json(
      { error: "Failed to save user agent" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const userAgents = await getUserAgents(userId);
    return NextResponse.json(userAgents);
  } catch (error) {
    console.error("Error in agent API:", error);
    return NextResponse.json(
      { error: "Failed to get user agents" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const agentId = searchParams.get("agentId");

    await removeUserAgent(userId, agentId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in agent API:", error);
    return NextResponse.json(
      { error: "Failed to remove user agent" },
      { status: 500 }
    );
  }
}
