"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { LoginWithEmailInput } from "./Login";

export async function login(input: LoginWithEmailInput) {
  const supabase = await createClient();

  const data = {
    email: input.email,
    password: input.password,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    console.error(error);
    redirect("/auth/login?error=true");
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();
  
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
