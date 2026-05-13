import { NextRequest, NextResponse } from "next/server";
import {
  getAllSchedules,
  getPublishedFutureSchedules,
  createSchedule,
} from "@/lib/storage";
import { verifyPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * スケジュール入力のバリデーション
 */
function validateScheduleInput(body: Record<string, unknown>): string | null {
  const { title, date, category } = body;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return "タイトルは必須です";
  }
  if (title.length > 200) {
    return "タイトルは200文字以内で入力してください";
  }

  if (!date || typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return "日付はYYYY-MM-DD形式で入力してください";
  }

  if (category !== undefined && typeof category !== "string") {
    return "カテゴリは文字列で入力してください";
  }
  if (typeof category === "string" && category.length > 50) {
    return "カテゴリは50文字以内で入力してください";
  }

  // time
  if (body.time !== undefined && body.time !== null && body.time !== "") {
    if (typeof body.time !== "string") {
      return "時間は文字列で入力してください";
    }
  }

  // description
  if (body.description !== undefined && typeof body.description === "string") {
    if (body.description.length > 2000) {
      return "説明は2000文字以内で入力してください";
    }
  }

  // url
  if (body.url !== undefined && typeof body.url === "string" && body.url.trim() !== "") {
    try {
      new URL(body.url);
    } catch {
      return "URLの形式が正しくありません";
    }
  }

  return null; // バリデーションOK
}

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

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const validationError = validateScheduleInput(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const schedule = await createSchedule(body as Parameters<typeof createSchedule>[0]);
  return NextResponse.json(schedule, { status: 201 });
}
