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
  location: string; // 会場・場所
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

/**
 * Googleカレンダー追加用URL生成
 */
export function buildGoogleCalendarUrl(schedule: Schedule, siteTitle: string): string {
  const dateClean = schedule.date.replace(/-/g, "");
  let dates: string;
  if (schedule.time) {
    const startTime = schedule.time.replace(":", "") + "00";
    if (schedule.endTime) {
      const endTimeClean = schedule.endTime.replace(":", "") + "00";
      dates = `${dateClean}T${startTime}/${dateClean}T${endTimeClean}`;
    } else {
      // 終了時間がない場合、開始から2時間後を仮設定
      const h = parseInt(schedule.time.split(":")[0], 10);
      const m = parseInt(schedule.time.split(":")[1], 10);
      let endH = h + 2;
      let endM = m;
      let endDateClean = dateClean;
      if (endH >= 24) {
        endH = endH - 24;
        const nextDate = new Date(schedule.date + "T00:00:00");
        nextDate.setDate(nextDate.getDate() + 1);
        endDateClean = nextDate.toISOString().split("T")[0].replace(/-/g, "");
      }
      const endTimeStr = `${String(endH).padStart(2, "0")}${String(endM).padStart(2, "0")}00`;
      dates = `${dateClean}T${startTime}/${endDateClean}T${endTimeStr}`;
    }
  } else {
    // 終日イベント
    const nextDate = new Date(schedule.date + "T00:00:00");
    nextDate.setDate(nextDate.getDate() + 1);
    const nd = nextDate.toISOString().split("T")[0].replace(/-/g, "");
    dates = `${dateClean}/${nd}`;
  }

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: schedule.title,
    dates,
    details: [schedule.description, schedule.url].filter(Boolean).join("\n"),
    location: schedule.location || "",
    sprop: `name:${siteTitle}`,
  });

  return `https://www.google.com/calendar/render?${params.toString()}`;
}

/**
 * iCal (.ics) ファイルの内容を生成
 */
export function buildIcsContent(schedule: Schedule, siteTitle: string): string {
  const dateClean = schedule.date.replace(/-/g, "");
  let dtStart: string;
  let dtEnd: string;

  if (schedule.time) {
    const startTime = schedule.time.replace(":", "") + "00";
    dtStart = `${dateClean}T${startTime}`;
    if (schedule.endTime) {
      const endTimeClean = schedule.endTime.replace(":", "") + "00";
      dtEnd = `${dateClean}T${endTimeClean}`;
    } else {
      const h = parseInt(schedule.time.split(":")[0], 10);
      const m = parseInt(schedule.time.split(":")[1], 10);
      let endH = h + 2;
      let endM = m;
      let endDateClean = dateClean;
      if (endH >= 24) {
        endH = endH - 24;
        const nextDate = new Date(schedule.date + "T00:00:00");
        nextDate.setDate(nextDate.getDate() + 1);
        endDateClean = nextDate.toISOString().split("T")[0].replace(/-/g, "");
      }
      dtEnd = `${endDateClean}T${String(endH).padStart(2, "0")}${String(endM).padStart(2, "0")}00`;
    }
  } else {
    dtStart = dateClean;
    const nextDate = new Date(schedule.date + "T00:00:00");
    nextDate.setDate(nextDate.getDate() + 1);
    dtEnd = nextDate.toISOString().split("T")[0].replace(/-/g, "");
  }

  const uid = `${schedule.id}@schedule-app`;
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const desc = [schedule.description, schedule.url].filter(Boolean).join("\\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${siteTitle}//Schedule//JP`,
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    schedule.time ? `DTSTART:${dtStart}` : `DTSTART;VALUE=DATE:${dtStart}`,
    schedule.time ? `DTEND:${dtEnd}` : `DTEND;VALUE=DATE:${dtEnd}`,
    `SUMMARY:${schedule.title}`,
    desc ? `DESCRIPTION:${desc}` : "",
    schedule.location ? `LOCATION:${schedule.location}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return lines.join("\r\n");
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
  themeColor: string; // アクセントカラー HEX
  backgroundColor: string; // ページ背景色
  cardColor: string; // カード背景色
  snsLinks: SnsLinks;
  categories: CategoryConfig[];
}

/**
 * カラースキームプリセット
 * themeColor: アクセントカラー
 * backgroundColor: ページ全体の背景色
 * cardColor: カードやカレンダーの背景色
 */
export interface ColorSchemePreset {
  name: string;
  themeColor: string;
  backgroundColor: string;
  cardColor: string;
}

export const COLOR_SCHEME_PRESETS: ColorSchemePreset[] = [
  { name: "ライト（デフォルト）", themeColor: "#fb7185", backgroundColor: "#f8fafc", cardColor: "#ffffff" },
  { name: "ピュアホワイト", themeColor: "#3b82f6", backgroundColor: "#ffffff", cardColor: "#ffffff" },
  { name: "クールブルー", themeColor: "#3b82f6", backgroundColor: "#eff6ff", cardColor: "#ffffff" },
  { name: "ミント", themeColor: "#10b981", backgroundColor: "#ecfdf5", cardColor: "#ffffff" },
  { name: "ウォームサンド", themeColor: "#f59e0b", backgroundColor: "#fffbeb", cardColor: "#ffffff" },
  { name: "サクラ", themeColor: "#ec4899", backgroundColor: "#fdf2f8", cardColor: "#ffffff" },
  { name: "ラベンダー", themeColor: "#8b5cf6", backgroundColor: "#f5f3ff", cardColor: "#ffffff" },
  { name: "ダーク", themeColor: "#fb7185", backgroundColor: "#0f172a", cardColor: "#1e293b" },
  { name: "ダークブルー", themeColor: "#60a5fa", backgroundColor: "#0c1929", cardColor: "#162236" },
  { name: "ダークグリーン", themeColor: "#34d399", backgroundColor: "#0a1a14", cardColor: "#132a21" },
  { name: "ダークパープル", themeColor: "#a78bfa", backgroundColor: "#13091f", cardColor: "#1e1233" },
  { name: "チャコール", themeColor: "#f97316", backgroundColor: "#18181b", cardColor: "#27272a" },
];

export const THEME_COLOR_PRESETS = [
  { name: "ローズ", color: "#fb7185" },
  { name: "ブルー", color: "#3b82f6" },
  { name: "エメラルド", color: "#10b981" },
  { name: "パープル", color: "#8b5cf6" },
  { name: "オレンジ", color: "#f97316" },
  { name: "ピンク", color: "#ec4899" },
  { name: "シアン", color: "#06b6d4" },
  { name: "レッド", color: "#ef4444" },
  { name: "アンバー", color: "#f59e0b" },
  { name: "インディゴ", color: "#6366f1" },
  { name: "スレート", color: "#64748b" },
  { name: "ブラック", color: "#1e293b" },
];

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
