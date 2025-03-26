import { NextRequest, NextResponse } from "next/server";
import { Session, User } from "@supabase/supabase-js";
import { verifyUserAuthenticated } from "../../agents/plan_agent/lib/supabase/verify_user_server";

function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "*",
  };
}

async function handleRequest(req: NextRequest, method: string) {
  const LANGGRAPH_API_URL = process.env.NEXT_PUBLIC_LANGGRAPH_API_URL;

  let session: Session | undefined;
  let user: User | undefined;
  try {
    const authRes = await verifyUserAuthenticated();
    session = authRes?.session;
    user = authRes?.user;
    if (!session || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } catch (e) {
    console.error("Failed to fetch user", e);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const path = req.nextUrl.pathname.replace(/^\/?api\//, "");
    const url = new URL(req.url);
    const searchParams = new URLSearchParams(url.search);
    searchParams.delete("_path");
    searchParams.delete("nxtP_path");
    const queryString = searchParams.toString()
      ? `?${searchParams.toString()}`
      : "";


    // Create a filtered set of headers
    const headers: Record<string, string> = {
      "x-api-key": process.env.NEXT_PUBLIC_LANGSMITH_API_KEY || "",
    };

    // Only forward essential headers
    const essentialHeaders = [
      'content-type',
      'authorization',
      'x-api-key',
      'user-agent'
    ];

    req.headers.forEach((value, key) => {
      if (essentialHeaders.includes(key.toLowerCase())) {
        headers[key] = value;
      }
    });

    const options: RequestInit = {
      method,
      headers,
    };

    if (["POST", "PUT", "PATCH"].includes(method)) {
      options.headers = {
        ...options.headers,
        "Content-Type": "application/json",
      };
      
      let bodyText = await req.text();

      if (typeof bodyText === "string" && bodyText.length > 0) {
        try {
          const parsedBody = JSON.parse(bodyText);
          parsedBody.config = parsedBody.config || {};
          parsedBody.config.configurable = {
            ...parsedBody.config.configurable,
            supabase_session: session,
            supabase_user_id: user.id,
          };
          bodyText = JSON.stringify(parsedBody);
        } catch (e) {
          console.error('Error parsing request body:', e);
        }
      }
      
      options.body = bodyText;
    }

    const res = await fetch(
      `${LANGGRAPH_API_URL}/${path}${queryString}`,
      options
    );

    if (res.status >= 400) {
      console.error(
        "ERROR IN PROXY",
        `${LANGGRAPH_API_URL}/${path}${queryString}`,
        res.status,
        res.statusText
      );
      const errorBody = await res.text();
      console.error('Error response body:', errorBody);
      return new Response(errorBody, {
        status: res.status,
        statusText: res.statusText,
        headers: getCorsHeaders()
      });
    }

    // Create a minimal set of response headers
    const responseHeaders = new Headers({
      ...getCorsHeaders(),
      'content-type': res.headers.get('content-type') || 'application/json',
    });

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (error: unknown) {
    console.error("Error in proxy", {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) }, 
      { 
        status: (error as any)?.status ?? 500,
        headers: getCorsHeaders()
      }
    );
  }
}

export const GET = (req: NextRequest) => handleRequest(req, "GET");
export const POST = (req: NextRequest) => handleRequest(req, "POST");
export const PUT = (req: NextRequest) => handleRequest(req, "PUT");
export const PATCH = (req: NextRequest) => handleRequest(req, "PATCH");
export const DELETE = (req: NextRequest) => handleRequest(req, "DELETE");

// Add a new OPTIONS handler
export const OPTIONS = () => {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...getCorsHeaders(),
    },
  });
};
