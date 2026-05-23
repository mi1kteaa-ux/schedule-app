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

    // カテゴリ色のマップ
    const catColors: Record<string, string> = {};
    for (const cat of settings.categories ?? []) {
      catColors[cat.id] = cat.color;
    }

    // 今月のスケジュールを日付ごとにグループ化
    const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
    const monthSchedules = schedules.filter((s) => s.date.startsWith(monthPrefix));
    const schedulesByDate: Record<string, typeof schedules> = {};
    for (const s of monthSchedules) {
      if (!schedulesByDate[s.date]) schedulesByDate[s.date] = [];
      schedulesByDate[s.date].push(s);
    }

    // 月曜始まり曜日（月曜=0, 日曜=6）
    const firstDayRaw = new Date(currentYear, currentMonth, 1).getDay();
    const firstDayMon = (firstDayRaw + 6) % 7;

    const todayStr = now.toISOString().split("T")[0];
    const totalCells = firstDayMon + daysInMonth;
    const rows = Math.ceil(totalCells / 7);

    // カレンダーの各行を事前に構築
    const calendarRows: {
      day: number;
      dateStr: string;
      isValid: boolean;
      isToday: boolean;
      isSat: boolean;
      isSun: boolean;
      titles: { title: string; color: string }[];
      extra: number;
    }[][] = [];

    for (let r = 0; r < rows; r++) {
      const row: typeof calendarRows[0] = [];
      for (let c = 0; c < 7; c++) {
        const cellIdx = r * 7 + c;
        const day = cellIdx - firstDayMon + 1;
        const isValid = day >= 1 && day <= daysInMonth;
        const dateStr = isValid
          ? `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
          : "";
        const dayItems = isValid ? schedulesByDate[dateStr] || [] : [];
        row.push({
          day,
          dateStr,
          isValid,
          isToday: dateStr === todayStr,
          isSat: c === 5,
          isSun: c === 6,
          titles: dayItems.slice(0, 2).map((s) => ({
            title: s.title.length > 8 ? s.title.slice(0, 7) + "…" : s.title,
            color: catColors[s.category] || "#6b7280",
          })),
          extra: Math.max(0, dayItems.length - 2),
        });
      }
      calendarRows.push(row);
    }

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
              padding: "20px 40px",
              backgroundColor: themeColor,
              color: "#ffffff",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 34, fontWeight: 700 }}>
                {settings.title || "スケジュール"}
              </span>
              {settings.subtitle ? (
                <span style={{ fontSize: 17, opacity: 0.9, marginTop: 2 }}>
                  {settings.subtitle}
                </span>
              ) : null}
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                backgroundColor: "rgba(255,255,255,0.2)",
                padding: "6px 18px",
                borderRadius: 10,
              }}
            >
              {monthLabel}
            </div>
          </div>

          {/* Day of week headers */}
          <div style={{ display: "flex", padding: "0 40px" }}>
            {["月", "火", "水", "木", "金", "土", "日"].map((d, i) => (
              <div
                key={d}
                style={{
                  width: 160,
                  textAlign: "center",
                  fontSize: 14,
                  fontWeight: 600,
                  padding: "8px 0 4px",
                  color: i === 5 ? "#3b82f6" : i === 6 ? "#ef4444" : "#64748b",
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              padding: "0 40px",
            }}
          >
            {calendarRows.map((row, rIdx) => (
              <div key={rIdx} style={{ display: "flex", flex: 1 }}>
                {row.map((cell, cIdx) => (
                  <div
                    key={cIdx}
                    style={{
                      width: 160,
                      display: "flex",
                      flexDirection: "column",
                      borderTop: "1px solid #e2e8f0",
                      padding: "3px 4px",
                    }}
                  >
                    {cell.isValid ? (
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: cell.isToday ? 800 : 500,
                            color: cell.isToday
                              ? themeColor
                              : cell.isSun
                              ? "#ef4444"
                              : cell.isSat
                              ? "#3b82f6"
                              : "#334155",
                            textAlign: "center",
                          }}
                        >
                          {cell.day}
                        </span>
                        {cell.titles.map((t, tIdx) => (
                          <span
                            key={tIdx}
                            style={{
                              fontSize: 10,
                              padding: "1px 4px",
                              borderRadius: 3,
                              color: "#ffffff",
                              backgroundColor: t.color,
                              marginTop: 1,
                            }}
                          >
                            {t.title}
                          </span>
                        ))}
                        {cell.extra > 0 ? (
                          <span
                            style={{
                              fontSize: 9,
                              color: "#94a3b8",
                              textAlign: "center",
                              marginTop: 1,
                            }}
                          >
                            +{cell.extra}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 40px 14px",
              borderTop: "2px solid #e2e8f0",
              backgroundColor: "#f8fafc",
              gap: 20,
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: themeColor,
              }}
            >
              今後の予定
            </span>
            {monthSchedules.length === 0 ? (
              <span style={{ fontSize: 12, color: "#94a3b8" }}>
                今月の予定はありません
              </span>
            ) : (
              <div style={{ display: "flex", gap: 16 }}>
                {monthSchedules.slice(0, 4).map((s, i) => {
                  const d = new Date(s.date + "T00:00:00");
                  const shortTitle =
                    s.title.length > 16 ? s.title.slice(0, 15) + "…" : s.title;
                  return (
                    <div
                      key={i}
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <span
                        style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}
                      >
                        {d.getMonth() + 1}/{d.getDate()}
                      </span>
                      <span style={{ fontSize: 12, color: "#334155" }}>
                        {shortTitle}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
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
