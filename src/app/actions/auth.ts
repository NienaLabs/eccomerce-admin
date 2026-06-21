"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api";

type LoginState = {
  error?: string;
} | null;

type LoginResponse = {
  token?: string;
  access_token?: string;
  detail?: string;
};

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  try {
    const params = new URLSearchParams();
    params.append("username", email);
    params.append("password", password);

    const res = await apiFetch("/auth/login", undefined, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as LoginResponse | null;
      return { error: data?.detail || "Invalid credentials. Please try again." };
    }

    const session = (await res.json()) as LoginResponse;
    const token = session.token ?? session.access_token;
    
    if (!token) {
      return { error: "Login failed: No token received from server." };
    }

    // Set the cookie securely
    const cookieStore = await cookies();
    cookieStore.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

  } catch {
    return { error: "Network error: Could not reach the authentication server." };
  }

  // Redirect on success
  redirect("/");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_token");
  redirect("/login");
}
