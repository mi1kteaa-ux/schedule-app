export interface CategoryConfig {
  id: string;
  label: string;
  color: string; // HEX color e.g. "#3b82f6"
}

export interface Schedule {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm or empty
  category: string; // CategoryConfig.id
  title: string;
  description: string;
  url: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ScheduleInput = Omit<Schedule, "id" | "createdAt" | "updatedAt">;

export interface SiteSettings {
  title: string;
  subtitle: string;
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
