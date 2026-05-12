import { NextRequest, NextResponse } from "next/server";
import {
  getAllSchedules,
  getPublishedFutureSchedules,
  createSchedule,
} from "@/lib/storage";
import { verifyPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode");

  if (mode === "admin") {
    const password = request.headers.get("x-admin-password");
    if (!password || !verifyPassword(password)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(await getAllSchedules());
  }

  return NextResponse.json(await getPublishedFutureSchedules());
}

export async function POST(request: NextRequest) {
  const password = request.headers.get("x-admin-password");
  if (!password || !verifyPassword(password)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const schedule = await createSchedule(body);
  return NextResponse.json(schedule, { status: 201 });
}
