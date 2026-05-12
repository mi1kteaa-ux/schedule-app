const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "mahjong2024";

export function verifyPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}
