import { NextRequest, NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/storage";
import { verifyPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getSettings());
}

export async function PUT(request: NextRequest) {
  const password = request.headers.get("x-admin-password");
  if (!password || !verifyPassword(password)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const settings = await updateSettings(body);
  return NextResponse.json(settings);
}
