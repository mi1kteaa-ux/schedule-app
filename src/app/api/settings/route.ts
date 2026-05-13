import { NextRequest, NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/storage";
import { verifyPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * 設定の入力バリデーション
 */
function validateSettingsInput(body: Record<string, unknown>): string | null {
  if (body.title !== undefined) {
    if (typeof body.title !== "string" || body.title.length > 100) {
      return "タイトルは100文字以内の文字列で入力してください";
    }
  }

  if (body.subtitle !== undefined) {
    if (typeof body.subtitle !== "string" || body.subtitle.length > 200) {
      return "サブタイトルは200文字以内の文字列で入力してください";
    }
  }

  // URL系のバリデーション
  for (const field of ["profileImage", "headerImage"] as const) {
    if (body[field] !== undefined && body[field] !== null && body[field] !== "") {
      if (typeof body[field] !== "string") {
        return `${field}は文字列で入力してください`;
      }
      const url = body[field] as string;
      if (url.trim() !== "") {
        try {
          new URL(url);
        } catch {
          return `${field}のURLの形式が正しくありません`;
        }
      }
    }
  }

  // SNSリンクのバリデーション
  if (body.snsLinks !== undefined) {
    if (typeof body.snsLinks !== "object" || body.snsLinks === null || Array.isArray(body.snsLinks)) {
      return "SNSリンクはオブジェクト形式で入力してください";
    }
    const validKeys = ["x", "youtube", "instagram", "tiktok", "twitch", "facebook", "website"];
    const links = body.snsLinks as Record<string, unknown>;
    for (const [key, value] of Object.entries(links)) {
      if (!validKeys.includes(key)) {
        return `不明なSNSキー: ${key}`;
      }
      if (typeof value !== "string") {
        return `SNSリンク「${key}」は文字列で入力してください`;
      }
      if (value.trim() !== "") {
        try {
          new URL(value);
        } catch {
          return `SNSリンク「${key}」のURLの形式が正しくありません`;
        }
      }
    }
  }

  // categoriesのバリデーション
  if (body.categories !== undefined) {
    if (!Array.isArray(body.categories)) {
      return "カテゴリは配列で入力してください";
    }
    if (body.categories.length > 20) {
      return "カテゴリは20個以内にしてください";
    }
    for (const cat of body.categories) {
      if (typeof cat !== "object" || cat === null) {
        return "カテゴリの各要素はオブジェクトで入力してください";
      }
      if (typeof cat.name !== "string" || cat.name.length > 50) {
        return "カテゴリ名は50文字以内の文字列で入力してください";
      }
      if (typeof cat.color !== "string" || !/^#[0-9a-fA-F]{6}$/.test(cat.color)) {
        return "カテゴリの色は#RRGGBB形式で入力してください";
      }
    }
  }

  return null;
}

export async function GET() {
  return NextResponse.json(await getSettings());
}

export async function PUT(request: NextRequest) {
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

  const validationError = validateSettingsInput(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const settings = await updateSettings(body);
  return NextResponse.json(settings);
}
