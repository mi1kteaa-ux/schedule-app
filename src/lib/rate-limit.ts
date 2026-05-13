/**
 * メモリベースのレート制限
 * Vercel Serverless では関数インスタンスごとにメモリが独立するため
 * 完全な防御ではないが、単純な総当たり攻撃は十分に防げる
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// 古いエントリを定期的にクリーンアップ
const CLEANUP_INTERVAL = 60_000; // 1分
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * レート制限チェック
 * @param key 識別キー（IPアドレス等）
 * @param maxRequests ウィンドウ内の最大リクエスト数
 * @param windowMs ウィンドウの長さ（ミリ秒）
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  cleanup();

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, retryAfterSeconds: 0 };
  }

  entry.count++;

  if (entry.count > maxRequests) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  return { allowed: true, remaining: maxRequests - entry.count, retryAfterSeconds: 0 };
}
