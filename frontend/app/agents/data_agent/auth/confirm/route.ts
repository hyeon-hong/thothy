import { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { createClient } from "../../lib/supabase/server";
import { redirect } from "next/navigation";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType;
  const next = requestUrl.searchParams.get("next") ?? "/";
  const code = requestUrl.searchParams.get("code");

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      revalidatePath(next);
      return NextResponse.redirect(new URL(next, request.url));
    }
  } else if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // redirect user to specified redirect URL or root of app
      revalidatePath(next);
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // redirect the user to an error page with some instructions
  redirect("/error");
}
