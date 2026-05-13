import { timingSafeEqual } from "crypto";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  console.warn(
    "⚠ ADMIN_PASSWORD が設定されていません。管理画面にログインできません。"
  );
}

/**
 * タイミング攻撃に耐性のあるパスワード比較
 */
export function verifyPassword(password: string): boolean {
  if (!ADMIN_PASSWORD) return false;
  if (!password) return false;

  try {
    const a = Buffer.from(password, "utf-8");
    const b = Buffer.from(ADMIN_PASSWORD, "utf-8");

    if (a.length !== b.length) {
      // 長さが異なる場合もタイミングを一定にするためダミー比較
      timingSafeEqual(b, b);
      return false;
    }

    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
