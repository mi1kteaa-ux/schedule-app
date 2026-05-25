import { ImageResponse } from "next/og";
import { getSettings, getPublishedFutureSchedules } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getSettings();
    const schedules = await getPublishedFutureSchedules();

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const monthLabel = `${currentYear}年${currentMonth + 1}月`;

    const themeColor = settings.themeColor || "#fb7185";

    // カテゴリマップ
    const catColors: Record<string, string> = {};
    const catLabels: Record<string, string> = {};
    for (const cat of settings.categories ?? []) {
      catColors[cat.id] = cat.color;
      catLabels[cat.id] = cat.label;
    }

    // 今月のスケジュールを日付ごとにグループ化
    const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
    const monthSchedules = schedules.filter((s) => s.date.startsWith(monthPrefix));
    const schedulesByDate: Record<string, typeof schedules> = {};
    for (const s of monthSchedules) {
      if (!schedulesByDate[s.date]) schedulesByDate[s.date] = [];
      schedulesByDate[s.date].push(s);
    }

    const dowNames = ["日", "月", "火", "水", "木", "金", "土"];

    // 縦型リストの行データを構築（1日1行、予定なしの日も含む）
    const listRows: {
      day: number;
      dow: string;
      dowIdx: number;
      schedules: { title: string; color: string; label: string; time: string }[];
    }[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dateObj = new Date(dateStr + "T00:00:00");
      const dowIdx = dateObj.getDay();
      const items = schedulesByDate[dateStr] || [];
      listRows.push({
        day: d,
        dow: dowNames[dowIdx],
        dowIdx,
        schedules: items.map((s) => ({
          title: s.title.length > 20 ? s.title.slice(0, 19) + "…" : s.title,
          color: catColors[s.category] || "#6b7280",
          label: catLabels[s.category] || s.category,
          time: s.time ? (s.endTime ? `${s.time}-${s.endTime}` : `${s.time}-`) : "",
        })),
      });
    }

    // 表示可能な行数（ヘッダー・フッターを除いた領域に収める）
    const maxRows = 18;
    const displayRows = listRows.slice(0, maxRows);

    const response = new ImageResponse(
      (
        <div
          style={{
            width: 1200,
            height: 630,
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#ffffff",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 48px",
              backgroundColor: themeColor,
              color: "#ffffff",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 30, fontWeight: 700 }}>
                {settings.title || "スケジュール"}
              </span>
              {settings.subtitle ? (
                <span style={{ fontSize: 15, opacity: 0.9, marginTop: 1 }}>
                  {settings.subtitle}
                </span>
              ) : null}
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                backgroundColor: "rgba(255,255,255,0.2)",
                padding: "5px 16px",
                borderRadius: 8,
              }}
            >
              {monthLabel}
            </div>
          </div>

          {/* 縦型カレンダーリスト */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              padding: "0 48px",
            }}
          >
            {displayRows.map((row) => {
              const isSun = row.dowIdx === 0;
              const isSat = row.dowIdx === 6;
              const dateColor = isSun ? "#ef4444" : isSat ? "#3b82f6" : "#334155";
              const hasSchedule = row.schedules.length > 0;

              return (
                <div
                  key={row.day}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    borderBottom: "1px solid #f1f5f9",
                    padding: "3px 0",
                    minHeight: 0,
                  }}
                >
                  {/* 日付 */}
                  <div
                    style={{
                      display: "flex",
                      width: 90,
                      fontSize: 15,
                      fontWeight: 700,
                      color: dateColor,
                    }}
                  >
                    <span>{row.day}</span>
                    <span style={{ marginLeft: 2, fontWeight: 500 }}>({row.dow})</span>
                  </div>

                  {hasSchedule ? (
                    <div style={{ display: "flex", flex: 1, gap: 12 }}>
                      {row.schedules.slice(0, 2).map((s, sIdx) => (
                        <div
                          key={sIdx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          {/* カテゴリバッジ */}
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              padding: "1px 8px",
                              borderRadius: 4,
                              color: "#ffffff",
                              backgroundColor: s.color,
                            }}
                          >
                            {s.label}
                          </span>
                          {/* タイトル */}
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "#1e293b",
                            }}
                          >
                            {s.title}
                          </span>
                          {/* 時間 */}
                          {s.time ? (
                            <span style={{ fontSize: 11, color: "#94a3b8" }}>
                              {s.time}
                            </span>
                          ) : null}
                        </div>
                      ))}
                      {row.schedules.length > 2 ? (
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>
                          +{row.schedules.length - 2}
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <div style={{ display: "flex", flex: 1 }}>
                      <span style={{ fontSize: 12, color: "#d1d5db" }}>-</span>
                    </div>
                  )}
                </div>
              );
            })}
            {daysInMonth > maxRows ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: "4px 0",
                  fontSize: 12,
                  color: "#94a3b8",
                }}
              >
                ... {daysInMonth - maxRows}日分続く
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "8px 48px",
              borderTop: "1px solid #e2e8f0",
              backgroundColor: "#f8fafc",
            }}
          >
            <span style={{ fontSize: 13, color: "#94a3b8" }}>
              最新のスケジュールはWebサイトをチェック
            </span>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );

    response.headers.set(
      "Cache-Control",
      "public, max-age=600, stale-while-revalidate=3600"
    );

    return response;
  } catch (e) {
    console.error("OG image generation error:", e);
    return new ImageResponse(
      (
        <div
          style={{
            width: 1200,
            height: 630,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#fb7185",
            color: "#ffffff",
            fontSize: 48,
            fontWeight: 700,
          }}
        >
          スケジュール
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }
}
