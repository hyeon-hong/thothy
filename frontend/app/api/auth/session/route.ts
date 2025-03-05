import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/client";

export async function GET(request: Request) {
    // Get cookies from the request - cookies() must be awaited
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("sb-access-token")?.value;
    const refreshToken = cookieStore.get("sb-refresh-token")?.value;
    console.log("accessToken", accessToken);
    console.log("refreshToken", refreshToken);

    if (!accessToken || !refreshToken) {
        return NextResponse.json({ session: null });
    }

    const supabase = createClient();

    // Try to get the user with the access token
    const { data, error } = await supabase.auth.getUser(accessToken);
    console.log("data", data);

    if (error || !data?.user) {
        return NextResponse.json({ session: null });
    }

    // Create a session object
    const session = {
        access_token: accessToken,
        refresh_token: refreshToken,
        user: data.user,
    };

    return NextResponse.json({ session });
}
