import { ImageResponse } from "next/og";
import { getSettings, getPublishedFutureSchedules } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getSettings();
  const schedules = await getPublishedFutureSchedules();

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthLabel = `${currentYear}年${currentMonth + 1}月`;

  // 今月以降のスケジュールを最大6件取得
  const todayStr = now.toISOString().split("T")[0];
  const upcoming = schedules
    .filter((s) => s.date >= todayStr)
    .slice(0, 6);

  const themeColor = settings.themeColor || "#fb7185";

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
        {/* Header bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "30px 48px",
            background: themeColor,
            color: "#ffffff",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ fontSize: "42px", fontWeight: 700, lineHeight: 1.2 }}>
              {settings.title || "スケジュール"}
            </div>
            {settings.subtitle && (
              <div style={{ fontSize: "22px", opacity: 0.9, marginTop: "4px" }}>
                {settings.subtitle}
              </div>
            )}
          </div>
          <div
            style={{
              fontSize: "26px",
              fontWeight: 600,
              background: "rgba(255,255,255,0.25)",
              padding: "8px 20px",
              borderRadius: "12px",
            }}
          >
            {monthLabel}
          </div>
        </div>

        {/* Schedule list */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "24px 48px",
            flex: 1,
            gap: "12px",
          }}
        >
          {upcoming.length === 0 ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
                fontSize: "28px",
                color: "#94a3b8",
              }}
            >
              現在予定はありません
            </div>
          ) : (
            upcoming.map((s) => {
              const d = new Date(s.date + "T00:00:00");
              const dayLabel = `${d.getMonth() + 1}/${d.getDate()}`;
              const dow = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
              return (
                <div
                  key={s.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    borderBottom: "1px solid #e2e8f0",
                    paddingBottom: "10px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: 700,
                      minWidth: "100px",
                      color: "#334155",
                    }}
                  >
                    {dayLabel}({dow})
                  </div>
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: 600,
                      color: "#1e293b",
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap" as const,
                    }}
                  >
                    {s.title}
                  </div>
                  {s.time && (
                    <div style={{ fontSize: "18px", color: "#64748b" }}>
                      {s.time}{s.endTime ? `-${s.endTime}` : ""}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "16px",
            fontSize: "18px",
            color: "#94a3b8",
            borderTop: "1px solid #e2e8f0",
          }}
        >
          最新のスケジュールはWebサイトをチェック
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );

  // キャッシュヘッダー: 10分キャッシュ、1時間stale-while-revalidate
  response.headers.set(
    "Cache-Control",
    "public, max-age=600, stale-while-revalidate=3600"
  );

  return response;
}
