export interface CategoryConfig {
  id: string;
  label: string;
  color: string; // HEX color e.g. "#3b82f6"
}

export interface Schedule {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm or empty（開始時間）
  endTime: string; // HH:mm or empty（終了時間）
  category: string; // CategoryConfig.id
  title: string;
  description: string;
  url: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 時間表示のフォーマット
 * 開始時間あり＋終了時間あり → "10:00-12:00"
 * 開始時間あり＋終了時間なし → "10:00-"
 * 開始時間なし → ""
 */
export function formatTimeRange(time: string, endTime: string): string {
  if (!time) return "";
  if (endTime) return `${time}-${endTime}`;
  return `${time}-`;
}

export type ScheduleInput = Omit<Schedule, "id" | "createdAt" | "updatedAt">;

export interface SnsLinks {
  x: string;
  youtube: string;
  instagram: string;
  tiktok: string;
  twitch: string;
  facebook: string;
  website: string;
}

export const EMPTY_SNS_LINKS: SnsLinks = {
  x: "",
  youtube: "",
  instagram: "",
  tiktok: "",
  twitch: "",
  facebook: "",
  website: "",
};

export const SNS_DEFINITIONS: { key: keyof SnsLinks; label: string; placeholder: string }[] = [
  { key: "x", label: "X (Twitter)", placeholder: "https://x.com/username" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@channel" },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/username" },
  { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@username" },
  { key: "twitch", label: "Twitch", placeholder: "https://twitch.tv/username" },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/username" },
  { key: "website", label: "Webサイト", placeholder: "https://example.com" },
];

export interface SiteSettings {
  title: string;
  subtitle: string;
  profileImage: string;
  headerImage: string;
  snsLinks: SnsLinks;
  categories: CategoryConfig[];
}

export const DEFAULT_CATEGORIES: CategoryConfig[] = [
  { id: "commentary", label: "番組解説", color: "#3b82f6" },
  { id: "guest", label: "大会ゲスト", color: "#10b981" },
  { id: "event", label: "イベント", color: "#f59e0b" },
  { id: "streaming", label: "配信", color: "#8b5cf6" },
  { id: "tournament", label: "大会出場", color: "#ef4444" },
  { id: "lesson", label: "麻雀教室", color: "#ec4899" },
  { id: "media", label: "メディア出演", color: "#06b6d4" },
  { id: "talk", label: "トークショー", color: "#f97316" },
  { id: "other", label: "その他", color: "#6b7280" },
];

export const COLOR_PRESETS = [
  { name: "ブルー", color: "#3b82f6" },
  { name: "エメラルド", color: "#10b981" },
  { name: "アンバー", color: "#f59e0b" },
  { name: "パープル", color: "#8b5cf6" },
  { name: "レッド", color: "#ef4444" },
  { name: "ピンク", color: "#ec4899" },
  { name: "シアン", color: "#06b6d4" },
  { name: "オレンジ", color: "#f97316" },
  { name: "ライム", color: "#84cc16" },
  { name: "ローズ", color: "#e11d48" },
  { name: "インディゴ", color: "#6366f1" },
  { name: "ティール", color: "#14b8a6" },
  { name: "グレー", color: "#6b7280" },
  { name: "スレート", color: "#475569" },
];
