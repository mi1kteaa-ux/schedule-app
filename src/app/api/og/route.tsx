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
      const day = s.date;
      if (!schedulesByDate[day]) schedulesByDate[day] = [];
      schedulesByDate[day].push(s);
    }

    // 月曜始まりの曜日ヘッダー
    const dayHeaders = ["月", "火", "水", "木", "金", "土", "日"];
    // 月の最初の日の曜日（月曜=0, 日曜=6）
    const firstDayRaw = new Date(currentYear, currentMonth, 1).getDay();
    const firstDayMon = (firstDayRaw + 6) % 7;

    const todayStr = now.toISOString().split("T")[0];

    // カレンダーグリッドの各セルを生成
    const totalCells = firstDayMon + daysInMonth;
    const rows = Math.ceil(totalCells / 7);

    const response = new ImageResponse(
      (
        <div
          style={{
            width: "1200px",
            height: "630px",
            display: "flex",
            flexDirection: "column",
            background: "#ffffff",
            fontFamily: "sans-serif",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "20px 36px",
              background: themeColor,
              color: "#ffffff",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: "32px", fontWeight: 700 }}>
                {settings.title || "スケジュール"}
              </div>
              {settings.subtitle ? (
                <div style={{ fontSize: "16px", opacity: 0.9, marginTop: "2px" }}>
                  {settings.subtitle}
                </div>
              ) : null}
            </div>
            <div
              style={{
                fontSize: "24px",
                fontWeight: 700,
                background: "rgba(255,255,255,0.2)",
                padding: "6px 18px",
                borderRadius: "10px",
              }}
            >
              {monthLabel}
            </div>
          </div>

          {/* Calendar grid */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              padding: "8px 36px 12px",
            }}
          >
            {/* Day of week headers */}
            <div style={{ display: "flex" }}>
              {dayHeaders.map((d, i) => (
                <div
                  key={d}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    fontSize: "14px",
                    fontWeight: 600,
                    padding: "6px 0",
                    color: i === 5 ? "#3b82f6" : i === 6 ? "#ef4444" : "#64748b",
                  }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar rows */}
            {Array.from({ length: rows }).map((_, rowIdx) => (
              <div key={rowIdx} style={{ display: "flex", flex: 1 }}>
                {Array.from({ length: 7 }).map((_, colIdx) => {
                  const cellIdx = rowIdx * 7 + colIdx;
                  const day = cellIdx - firstDayMon + 1;
                  const isValid = day >= 1 && day <= daysInMonth;
                  const dateStr = isValid
                    ? `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                    : "";
                  const daySchedules = isValid ? (schedulesByDate[dateStr] || []) : [];
                  const isToday = dateStr === todayStr;
                  const isSat = colIdx === 5;
                  const isSun = colIdx === 6;

                  return (
                    <div
                      key={colIdx}
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        borderTop: "1px solid #e2e8f0",
                        borderRight: colIdx < 6 ? "1px solid #f1f5f9" : "none",
                        padding: "2px 3px",
                        minHeight: "0",
                        background: isToday ? `${themeColor}10` : "transparent",
                      }}
                    >
                      {isValid ? (
                        <>
                          <div
                            style={{
                              fontSize: "13px",
                              fontWeight: isToday ? 800 : 500,
                              color: isToday
                                ? themeColor
                                : isSun
                                ? "#ef4444"
                                : isSat
                                ? "#3b82f6"
                                : "#334155",
                              textAlign: "center",
                              marginBottom: "1px",
                            }}
                          >
                            {day}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "1px",
                            }}
                          >
                            {daySchedules.slice(0, 2).map((s, sIdx) => (
                              <div
                                key={sIdx}
                                style={{
                                  fontSize: "9px",
                                  lineHeight: "12px",
                                  padding: "1px 3px",
                                  borderRadius: "2px",
                                  color: "#ffffff",
                                  background: catColors[s.category] || "#6b7280",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {s.title}
                              </div>
                            ))}
                            {daySchedules.length > 2 ? (
                              <div
                                style={{
                                  fontSize: "8px",
                                  color: "#94a3b8",
                                  textAlign: "center",
                                }}
                              >
                                +{daySchedules.length - 2}
                              </div>
                            ) : null}
                          </div>
                        </>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer — upcoming list */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "24px",
              padding: "10px 36px 14px",
              borderTop: "2px solid #e2e8f0",
              background: "#f8fafc",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: themeColor,
                whiteSpace: "nowrap",
              }}
            >
              今後の予定
            </div>
            <div
              style={{
                display: "flex",
                gap: "16px",
                flex: 1,
                overflow: "hidden",
              }}
            >
              {monthSchedules.length === 0 ? (
                <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                  今月の予定はありません
                </div>
              ) : (
                monthSchedules.slice(0, 4).map((s, i) => {
                  const d = new Date(s.date + "T00:00:00");
                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#475569",
                        }}
                      >
                        {d.getMonth() + 1}/{d.getDate()}
                      </div>
                      <div
                        style={{
                          width: "4px",
                          height: "4px",
                          borderRadius: "2px",
                          background: catColors[s.category] || "#6b7280",
                        }}
                      />
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#334155",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: "180px",
                        }}
                      >
                        {s.title}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );

    // キャッシュヘッダー
    response.headers.set(
      "Cache-Control",
      "public, max-age=600, stale-while-revalidate=3600"
    );

    return response;
  } catch (e) {
    console.error("OG image generation error:", e);
    // フォールバック: シンプルなテキスト画像
    return new ImageResponse(
      (
        <div
          style={{
            width: "1200px",
            height: "630px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#fb7185",
            color: "#ffffff",
            fontSize: "48px",
            fontWeight: 700,
            fontFamily: "sans-serif",
          }}
        >
          スケジュール
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }
}
