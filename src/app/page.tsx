"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Schedule, SiteSettings, CategoryConfig } from "@/lib/types";
import SnsIconsBar from "@/components/SnsIcons";
import html2canvas from "html2canvas-pro";
import {
  getDaysInMonth,
  getFirstDayOfMonth,
  getMonthName,
  toDateString,
  getDayLabel,
} from "@/lib/calendar";

export default function PublicPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [saving, setSaving] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const saveAsImage = useCallback(async () => {
    if (!listRef.current) return;
    setSaving(true);
    try {
      const canvas = await html2canvas(listRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `schedule_${year}${String(month + 1).padStart(2, "0")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      alert("画像の保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }, [year, month]);
  const categories = settings?.categories ?? [];

  function getCategoryConfig(id: string): CategoryConfig | undefined {
    return categories.find((c) => c.id === id);
  }

  function getCategoryColor(id: string): string {
    return getCategoryConfig(id)?.color ?? "#6b7280";
  }

  function getCategoryLabel(id: string): string {
    return getCategoryConfig(id)?.label ?? id;
  }

  useEffect(() => {
    fetch("/api/schedules")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch schedules");
        return res.json();
      })
      .then(setSchedules)
      .catch((err) => console.error("スケジュール取得エラー:", err));
    fetch("/api/settings")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch settings");
        return res.json();
      })
      .then(setSettings)
      .catch((err) => console.error("設定取得エラー:", err));
  }, []);

  const prevMonth = useCallback(() => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    setSelectedDate(null);
  }, []);

  const nextMonth = useCallback(() => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    setSelectedDate(null);
  }, []);

  const goToday = useCallback(() => {
    setCurrentDate(new Date());
    setSelectedDate(null);
  }, []);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date().toISOString().split("T")[0];

  const filteredSchedules = schedules.filter(
    (s) => filterCategory === "all" || s.category === filterCategory
  );

  function getSchedulesForDate(dateStr: string) {
    return filteredSchedules.filter((s) => s.date === dateStr);
  }

  const selectedSchedules = selectedDate
    ? getSchedulesForDate(selectedDate)
    : [];

  const getDayOfWeekLabel = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  };

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full">
      {/* Header with optional hero image */}
      {settings?.headerImage ? (
        <div>
          <div className="w-full h-28 sm:h-48 overflow-hidden">
            <img
              src={settings.headerImage}
              alt="ヘッダー画像"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex items-center gap-3 sm:gap-4">
              {settings?.profileImage ? (
                <img
                  src={settings.profileImage}
                  alt="プロフィール"
                  className="w-14 h-14 sm:w-20 sm:h-20 rounded-full border-2 border-white shadow-md object-cover bg-white shrink-0"
                />
              ) : (
                <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full border-2 border-white shadow-md bg-slate-200 shrink-0 flex items-center justify-center text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-base sm:text-2xl font-bold text-slate-800 truncate">
                  {settings?.title ?? ""}
                </h1>
                {settings?.subtitle && (
                  <p className="text-slate-500 text-[11px] sm:text-sm truncate">
                    {settings.subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-3 sm:px-4 pt-6 sm:pt-8 pb-4 sm:pb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            {settings?.profileImage ? (
              <img
                src={settings.profileImage}
                alt="プロフィール"
                className="w-14 h-14 sm:w-20 sm:h-20 rounded-full shadow-sm object-cover shrink-0"
              />
            ) : null}
            <div className={`min-w-0 ${settings?.profileImage ? "" : "text-center w-full"}`}>
              <h1 className="text-xl sm:text-3xl font-bold text-slate-800 truncate">
                {settings?.title ?? ""}
              </h1>
              {settings?.subtitle && (
                <p className="text-slate-500 mt-0.5 text-xs sm:text-base truncate">
                  {settings.subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="px-3 sm:px-4 pb-6 sm:pb-8">

      {/* SNS links */}
      {settings?.snsLinks && <SnsIconsBar links={settings.snsLinks} />}

      {/* Category filter - horizontal scroll on mobile */}
      <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 mb-5">
        <div className="flex gap-2 sm:flex-wrap sm:justify-center min-w-max sm:min-w-0 pb-1">
          <button
            onClick={() => setFilterCategory("all")}
            className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              filterCategory === "all"
                ? "bg-slate-800 text-white"
                : "bg-slate-200 text-slate-600 active:bg-slate-300"
            }`}
          >
            すべて
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
              style={
                filterCategory === cat.id
                  ? { backgroundColor: cat.color, color: "#fff" }
                  : { backgroundColor: "#e2e8f0", color: "#475569" }
              }
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="p-2 rounded-lg active:bg-slate-200 transition-colors text-slate-600 text-sm sm:text-base"
        >
          ← 前月
        </button>
        <div className="flex items-center gap-2 sm:gap-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-700">
            {getMonthName(year, month)}
          </h2>
          <button
            onClick={goToday}
            className="px-2.5 py-1 text-xs sm:text-sm bg-slate-100 rounded-lg active:bg-slate-200 transition-colors text-slate-600"
          >
            今日
          </button>
        </div>
        <div className="flex items-center gap-1">
          {/* View mode toggle */}
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
              viewMode === "grid" ? "bg-slate-800 text-white" : "text-slate-400 active:bg-slate-200"
            }`}
            aria-label="カレンダー表示"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
              viewMode === "list" ? "bg-slate-800 text-white" : "text-slate-400 active:bg-slate-200"
            }`}
            aria-label="リスト表示"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          {/* Month nav */}
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg active:bg-slate-200 transition-colors text-slate-600 text-sm sm:text-base"
          >
            翌月 →
          </button>
        </div>
      </div>

      {/* Calendar grid view */}
      {viewMode === "grid" && (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-7">
              {Array.from({ length: 7 }, (_, i) => (
                <div
                  key={i}
                  className={`py-1.5 sm:py-2 text-center text-xs sm:text-sm font-medium border-b border-slate-200 ${
                    i === 6
                      ? "text-red-500 bg-red-50"
                      : i === 5
                      ? "text-blue-500 bg-blue-50"
                      : "text-slate-500 bg-slate-50"
                  }`}
                >
                  {getDayLabel(i)}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {Array.from({ length: firstDay }, (_, i) => (
                <div
                  key={`empty-${i}`}
                  className="min-h-[68px] sm:min-h-[80px] border-b border-r border-slate-100"
                />
              ))}

              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const dateStr = toDateString(year, month, day);
                const daySchedules = getSchedulesForDate(dateStr);
                const isPast = dateStr < today;
                const isToday = dateStr === today;
                const dayOfWeek = (firstDay + i) % 7;
                const isSelected = selectedDate === dateStr;

                return (
                  <div
                    key={day}
                    onClick={() =>
                      daySchedules.length > 0
                        ? setSelectedDate(isSelected ? null : dateStr)
                        : null
                    }
                    className={`min-h-[68px] sm:min-h-[80px] p-0.5 sm:p-1 border-b border-r border-slate-100 transition-colors ${
                      isPast
                        ? "bg-slate-50 opacity-40"
                        : daySchedules.length > 0
                        ? "cursor-pointer active:bg-blue-50"
                        : ""
                    } ${isSelected ? "bg-blue-50 ring-2 ring-blue-300 ring-inset" : ""}`}
                  >
                    <div
                      className={`text-[10px] sm:text-sm font-medium mb-0.5 sm:mb-1 ${
                        isToday
                          ? "bg-slate-800 text-white w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center mx-auto text-[10px] sm:text-sm"
                          : dayOfWeek === 6
                          ? "text-red-500 text-center"
                          : dayOfWeek === 5
                          ? "text-blue-500 text-center"
                          : "text-slate-700 text-center"
                      }`}
                    >
                      {day}
                    </div>
                    <div className="space-y-px sm:space-y-0.5">
                      {daySchedules.slice(0, 3).map((s) => (
                        <div
                          key={s.id}
                          className="text-[7px] sm:text-[10px] leading-tight px-0.5 sm:px-1 py-px sm:py-0.5 rounded text-white truncate"
                          style={{ backgroundColor: getCategoryColor(s.category) }}
                        >
                          {s.title}
                        </div>
                      ))}
                      {daySchedules.length > 3 && (
                        <div className="text-[7px] sm:text-[10px] text-slate-400 text-center">
                          +{daySchedules.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected date detail */}
          {selectedDate && selectedSchedules.length > 0 && (
            <div className="mt-4 sm:mt-6 bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-slate-700 mb-3 sm:mb-4">
                {selectedDate.replace(/-/g, "/")}（{getDayOfWeekLabel(selectedDate)}）の予定
              </h3>
              <div className="space-y-4">
                {selectedSchedules.map((s) => (
                  <div
                    key={s.id}
                    className="border-l-4 pl-3 sm:pl-4 py-2"
                    style={{ borderColor: getCategoryColor(s.category) }}
                  >
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                      <span
                        className="text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: getCategoryColor(s.category) }}
                      >
                        {getCategoryLabel(s.category)}
                      </span>
                      {s.time && (
                        <span className="text-xs sm:text-sm text-slate-500">
                          {s.time}
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm sm:text-base">
                      {s.title}
                    </h4>
                    {s.description && (
                      <p className="text-xs sm:text-sm text-slate-600 mt-1">
                        {s.description}
                      </p>
                    )}
                    {s.url && (
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs sm:text-sm hover:underline mt-1 inline-block"
                        style={{ color: getCategoryColor(s.category) }}
                      >
                        詳細リンク →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* List view */}
      {viewMode === "list" && (
        <>
        <div ref={listRef} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* List header */}
          <div className="bg-rose-400 text-white text-center py-2 sm:py-3">
            <h2 className="text-base sm:text-xl font-bold">{getMonthName(year, month)}</h2>
          </div>

          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const dateStr = toDateString(year, month, day);
            const daySchedules = getSchedulesForDate(dateStr);
            const d = new Date(dateStr + "T00:00:00");
            const dow = d.getDay();
            const dowLabel = ["日", "月", "火", "水", "木", "金", "土"][dow];
            const isSunday = dow === 0;
            const isSaturday = dow === 6;
            const isPast = dateStr < today;
            const isToday = dateStr === today;

            if (daySchedules.length === 0) {
              return (
                <div
                  key={day}
                  className={`flex items-center border-b border-slate-100 px-3 sm:px-4 py-2 sm:py-2.5 ${
                    isPast ? "opacity-40" : ""
                  } ${isToday ? "bg-blue-50" : ""}`}
                >
                  <div className={`font-bold text-sm sm:text-base min-w-[60px] sm:min-w-[72px] ${
                    isSunday ? "text-red-500" : isSaturday ? "text-blue-500" : "text-slate-700"
                  }`}>
                    {day}（{dowLabel}）
                  </div>
                  <div className="text-slate-300 text-xs sm:text-sm ml-2">－</div>
                  <div className="text-slate-300 text-xs sm:text-sm ml-4">－</div>
                </div>
              );
            }

            return daySchedules.map((s, sIdx) => (
              <div
                key={`${day}-${s.id}`}
                className={`flex items-center border-b border-slate-100 px-3 sm:px-4 py-2 sm:py-2.5 ${
                  isPast ? "opacity-40" : ""
                } ${isToday ? "bg-blue-50" : ""}`}
              >
                {/* Date (only show on first schedule of the day) */}
                <div className={`font-bold text-sm sm:text-base min-w-[60px] sm:min-w-[72px] ${
                  isSunday ? "text-red-500" : isSaturday ? "text-blue-500" : "text-slate-700"
                }`}>
                  {sIdx === 0 ? `${day}（${dowLabel}）` : ""}
                </div>

                {/* Category badge */}
                <div className="min-w-[64px] sm:min-w-[80px] mr-2 sm:mr-3">
                  <span
                    className="text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded text-white inline-block"
                    style={{ backgroundColor: getCategoryColor(s.category) }}
                  >
                    {getCategoryLabel(s.category)}
                  </span>
                </div>

                {/* Title */}
                <div className="flex-1 min-w-0 text-xs sm:text-sm font-medium text-slate-800 truncate">
                  {s.title}
                </div>

                {/* Time */}
                <div className="text-[10px] sm:text-xs text-slate-400 ml-2 shrink-0">
                  {s.time || ""}
                </div>
              </div>
            ));
          })}
        </div>

        {/* Save as image button */}
        <div className="mt-3 flex justify-center">
          <button
            onClick={saveAsImage}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white rounded-lg text-xs sm:text-sm font-medium active:bg-slate-700 sm:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            {saving ? "保存中..." : "画像として保存"}
          </button>
        </div>
        </>
      )}

      {/* Upcoming list */}
      <div className="mt-6 sm:mt-8">
        <h2 className="text-lg sm:text-xl font-bold text-slate-700 mb-3 sm:mb-4">
          今後の予定一覧
        </h2>
        {filteredSchedules.length === 0 ? (
          <p className="text-slate-400 text-center py-8 text-sm">
            現在公開中の予定はありません
          </p>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {filteredSchedules.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-lg shadow-sm border border-slate-200 p-3 sm:p-4 flex items-start gap-3 sm:gap-4"
              >
                <div className="text-center min-w-[48px] sm:min-w-[60px]">
                  <div className="text-xl sm:text-2xl font-bold text-slate-700">
                    {new Date(s.date + "T00:00:00").getDate()}
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-400">
                    {new Date(s.date + "T00:00:00").getFullYear()}/
                    {new Date(s.date + "T00:00:00").getMonth() + 1}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                    <span
                      className="text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: getCategoryColor(s.category) }}
                    >
                      {getCategoryLabel(s.category)}
                    </span>
                    {s.time && (
                      <span className="text-xs sm:text-sm text-slate-500">
                        {s.time}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base truncate">
                    {s.title}
                  </h3>
                  {s.description && (
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5 line-clamp-2">
                      {s.description}
                    </p>
                  )}
                  {s.url && (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs sm:text-sm hover:underline mt-1 inline-block"
                      style={{ color: getCategoryColor(s.category) }}
                    >
                      詳細リンク →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </main>
  );
}
