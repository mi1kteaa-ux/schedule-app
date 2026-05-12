"use client";

import { useState, useEffect, useCallback } from "react";
import { Schedule, SiteSettings, CategoryConfig } from "@/lib/types";
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

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
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
      .then((res) => res.json())
      .then(setSchedules);
    fetch("/api/settings")
      .then((res) => res.json())
      .then(setSettings);
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

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800">
          {settings?.title ?? ""}
        </h1>
        {settings?.subtitle && (
          <p className="text-slate-500 mt-1">{settings.subtitle}</p>
        )}
      </header>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        <button
          onClick={() => setFilterCategory("all")}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            filterCategory === "all"
              ? "bg-slate-800 text-white"
              : "bg-slate-200 text-slate-600 hover:bg-slate-300"
          }`}
        >
          すべて
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilterCategory(cat.id)}
            className="px-3 py-1 rounded-full text-sm font-medium transition-colors"
            style={
              filterCategory === cat.id
                ? { backgroundColor: cat.color, color: "#fff" }
                : undefined
            }
          >
            <span
              className={
                filterCategory === cat.id
                  ? ""
                  : "text-slate-600"
              }
              style={
                filterCategory !== cat.id
                  ? undefined
                  : { color: "#fff" }
              }
            >
              {cat.label}
            </span>
          </button>
        ))}
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 rounded-lg hover:bg-slate-200 transition-colors text-slate-600"
        >
          ← 前月
        </button>
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-700">
            {getMonthName(year, month)}
          </h2>
          <button
            onClick={goToday}
            className="px-3 py-1 text-sm bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors text-slate-600"
          >
            今日
          </button>
        </div>
        <button
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-slate-200 transition-colors text-slate-600"
        >
          翌月 →
        </button>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-7">
          {Array.from({ length: 7 }, (_, i) => (
            <div
              key={i}
              className={`py-2 text-center text-sm font-medium border-b border-slate-200 ${
                i === 0
                  ? "text-red-500 bg-red-50"
                  : i === 6
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
              className="min-h-[80px] border-b border-r border-slate-100"
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
                className={`min-h-[80px] p-1 border-b border-r border-slate-100 transition-colors ${
                  isPast
                    ? "bg-slate-50 opacity-40"
                    : daySchedules.length > 0
                    ? "cursor-pointer hover:bg-slate-50"
                    : ""
                } ${isSelected ? "bg-blue-50 ring-2 ring-blue-300 ring-inset" : ""}`}
              >
                <div
                  className={`text-sm font-medium mb-1 ${
                    isToday
                      ? "bg-slate-800 text-white w-6 h-6 rounded-full flex items-center justify-center mx-auto"
                      : dayOfWeek === 0
                      ? "text-red-500 text-center"
                      : dayOfWeek === 6
                      ? "text-blue-500 text-center"
                      : "text-slate-700 text-center"
                  }`}
                >
                  {day}
                </div>
                <div className="space-y-0.5">
                  {daySchedules.slice(0, 2).map((s) => (
                    <div
                      key={s.id}
                      className="text-[10px] leading-tight px-1 py-0.5 rounded text-white truncate"
                      style={{ backgroundColor: getCategoryColor(s.category) }}
                    >
                      {s.title}
                    </div>
                  ))}
                  {daySchedules.length > 2 && (
                    <div className="text-[10px] text-slate-400 text-center">
                      +{daySchedules.length - 2}件
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
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-700 mb-4">
            {selectedDate.replace(/-/g, "/")} の予定
          </h3>
          <div className="space-y-4">
            {selectedSchedules.map((s) => (
              <div
                key={s.id}
                className="border-l-4 pl-4 py-2"
                style={{ borderColor: getCategoryColor(s.category) }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: getCategoryColor(s.category) }}
                  >
                    {getCategoryLabel(s.category)}
                  </span>
                  {s.time && (
                    <span className="text-sm text-slate-500">{s.time}</span>
                  )}
                </div>
                <h4 className="font-bold text-slate-800">{s.title}</h4>
                {s.description && (
                  <p className="text-sm text-slate-600 mt-1">
                    {s.description}
                  </p>
                )}
                {s.url && (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:underline mt-1 inline-block"
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

      {/* Upcoming list */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-slate-700 mb-4">
          今後の予定一覧
        </h2>
        {filteredSchedules.length === 0 ? (
          <p className="text-slate-400 text-center py-8">
            現在公開中の予定はありません
          </p>
        ) : (
          <div className="space-y-3">
            {filteredSchedules.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex items-start gap-4"
              >
                <div className="text-center min-w-[60px]">
                  <div className="text-2xl font-bold text-slate-700">
                    {new Date(s.date + "T00:00:00").getDate()}
                  </div>
                  <div className="text-xs text-slate-400">
                    {new Date(s.date + "T00:00:00").getFullYear()}/
                    {new Date(s.date + "T00:00:00").getMonth() + 1}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: getCategoryColor(s.category) }}
                    >
                      {getCategoryLabel(s.category)}
                    </span>
                    {s.time && (
                      <span className="text-sm text-slate-500">{s.time}</span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-800">{s.title}</h3>
                  {s.description && (
                    <p className="text-sm text-slate-500 mt-0.5">
                      {s.description}
                    </p>
                  )}
                  {s.url && (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm hover:underline mt-1 inline-block"
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
    </main>
  );
}
