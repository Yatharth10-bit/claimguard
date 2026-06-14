import { NextResponse } from "next/server";
import { requireUser } from "@/lib/apiAuth";

export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || process.env.CLAIMGUARD_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function requireAdmin() {
  const auth = await requireUser();
  if ("error" in auth) return auth;
  const admins = getAdminEmails();
  const email = (auth.user.email || "").toLowerCase();
  if (!admins.length || !admins.includes(email)) {
    return { error: NextResponse.json({ error: "Admin access required." }, { status: 403 }) };
  }
  return auth;
}