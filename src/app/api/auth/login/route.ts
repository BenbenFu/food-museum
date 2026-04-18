import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, authEnv, isValidCredential } from "@/lib/auth";

export const runtime = "nodejs";

type LoginPayload = {
  username?: string;
  password?: string;
};

export async function POST(request: Request) {
  let payload: LoginPayload;
  try {
    payload = (await request.json()) as LoginPayload;
  } catch {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  const username = String(payload.username ?? "").trim();
  const password = String(payload.password ?? "").trim();

  if (!isValidCredential(username, password)) {
    return NextResponse.json({ message: "Invalid username or password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: authEnv.appSessionToken,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });

  return response;
}