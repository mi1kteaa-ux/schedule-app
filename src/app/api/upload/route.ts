import { NextRequest, NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const BUCKET = "images";
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** 許可されたフォルダ名のみ通す */
const ALLOWED_FOLDERS = ["profile", "header", "misc"];

/**
 * フォルダ名をサニタイズ
 * パストラバーサル攻撃を防止
 */
function sanitizeFolder(input: string): string {
  // 許可リストに含まれない場合は "misc" にフォールバック
  const cleaned = input.replace(/[^a-zA-Z0-9_-]/g, "");
  return ALLOWED_FOLDERS.includes(cleaned) ? cleaned : "misc";
}

/**
 * ファイル拡張子をサニタイズ
 */
function sanitizeExtension(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const allowedExts = ["jpg", "jpeg", "png", "webp", "gif"];
  return allowedExts.includes(ext) ? ext : "jpg";
}

export async function POST(request: NextRequest) {
  const password = request.headers.get("x-admin-password");
  if (!password || !verifyPassword(password)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const folderRaw = (formData.get("folder") as string) || "misc";
  const folder = sanitizeFolder(folderRaw);

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "JPEG, PNG, WebP, GIF のみ対応しています" },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "ファイルサイズは5MB以下にしてください" },
      { status: 400 }
    );
  }

  const ext = sanitizeExtension(file.name);
  const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const admin = getAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: `アップロード失敗: ${uploadError.message}` },
      { status: 500 }
    );
  }

  const { data: urlData } = admin.storage
    .from(BUCKET)
    .getPublicUrl(fileName);

  return NextResponse.json({ url: urlData.publicUrl });
}
