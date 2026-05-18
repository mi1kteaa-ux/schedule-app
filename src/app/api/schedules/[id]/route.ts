import { NextRequest, NextResponse } from "next/server";
import { updateSchedule, deleteSchedule } from "@/lib/storage";
import { verifyPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

function checkAuth(request: NextRequest): boolean {
  const password = request.headers.get("x-admin-password");
  return !!password && verifyPassword(password);
}

/**
 * IDのバリデーション（UUID形式チェック）
 */
function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/**
 * 更新入力のバリデーション（部分更新対応）
 */
function validateUpdateInput(body: Record<string, unknown>): string | null {
  if (body.title !== undefined) {
    if (typeof body.title !== "string" || body.title.trim().length === 0) {
      return "タイトルは必須です";
    }
    if (body.title.length > 200) {
      return "タイトルは200文字以内で入力してください";
    }
  }
  if (body.date !== undefined) {
    if (typeof body.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
      return "日付はYYYY-MM-DD形式で入力してください";
    }
  }
  if (body.category !== undefined && typeof body.category !== "string") {
    return "カテゴリは文字列で入力してください";
  }
  if (typeof body.category === "string" && body.category.length > 50) {
    return "カテゴリは50文字以内で入力してください";
  }
  if (body.time !== undefined && body.time !== null && body.time !== "") {
    if (typeof body.time !== "string") return "開始時間は文字列で入力してください";
  }
  if (body.endTime !== undefined && body.endTime !== null && body.endTime !== "") {
    if (typeof body.endTime !== "string") return "終了時間は文字列で入力してください";
  }
  if (body.location !== undefined && typeof body.location === "string") {
    if (body.location.length > 200) return "会場は200文字以内で入力してください";
  }
  if (body.description !== undefined && typeof body.description === "string") {
    if (body.description.length > 2000) return "説明は2000文字以内で入力してください";
  }
  if (body.url !== undefined && typeof body.url === "string" && body.url.trim() !== "") {
    try { new URL(body.url); } catch { return "URLの形式が正しくありません"; }
  }
  return null;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (!isValidUUID(id)) {
    return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const validationError = validateUpdateInput(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const schedule = await updateSchedule(id, body);
  if (!schedule) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(schedule);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (!isValidUUID(id)) {
    return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
  }

  const success = await deleteSchedule(id);
  if (!success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
