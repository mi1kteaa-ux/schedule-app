"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Schedule,
  ScheduleInput,
  SiteSettings,
  CategoryConfig,
  COLOR_PRESETS,
  DEFAULT_CATEGORIES,
  EMPTY_SNS_LINKS,
  SNS_DEFINITIONS,
  THEME_COLOR_PRESETS,
  formatTimeRange,
} from "@/lib/types";

const EMPTY_FORM: ScheduleInput = {
  date: "",
  time: "",
  endTime: "",
  category: "",
  title: "",
  description: "",
  location: "",
  url: "",
  published: true,
};

type SettingsTab = "site" | "images" | "sns" | "categories";

/** 繰り返し設定 */
interface RepeatConfig {
  enabled: boolean;
  type: "weekly" | "biweekly" | "monthly";
  count: number; // 繰り返し回数
}

const DEFAULT_REPEAT: RepeatConfig = {
  enabled: false,
  type: "weekly",
  count: 4,
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [form, setForm] = useState<ScheduleInput>({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("site");
  const [editCategories, setEditCategories] = useState<CategoryConfig[]>([]);
  const [newCatLabel, setNewCatLabel] = useState("");
  const [newCatColor, setNewCatColor] = useState("#3b82f6");
  const [repeat, setRepeat] = useState<RepeatConfig>({ ...DEFAULT_REPEAT });
  const [submitting, setSubmitting] = useState(false);

  const storedPassword = authenticated ? password : "";
  const categories = settings?.categories ?? [];

  function getCategoryColor(id: string): string {
    return categories.find((c) => c.id === id)?.color ?? "#6b7280";
  }

  function getCategoryLabel(id: string): string {
    return categories.find((c) => c.id === id)?.label ?? id;
  }

  const fetchSchedules = useCallback(async () => {
    const res = await fetch("/api/schedules?mode=admin", {
      headers: { "x-admin-password": storedPassword },
    });
    if (res.ok) {
      setSchedules(await res.json());
    }
  }, [storedPassword]);

  const fetchSettings = useCallback(async () => {
    const res = await fetch("/api/settings");
    if (res.ok) {
      const data = await res.json();
      setSettings(data);
      setEditCategories(data.categories ?? []);
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      fetchSchedules();
      fetchSettings();
    }
  }, [authenticated, fetchSchedules, fetchSettings]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthenticated(true);
      setAuthError("");
    } else {
      const data = await res.json().catch(() => ({}));
      setAuthError(data.error || "パスワードが正しくありません");
    }
  }

  /** 繰り返し日付を生成 */
  function generateRepeatDates(baseDate: string, config: RepeatConfig): string[] {
    const dates: string[] = [baseDate];
    const base = new Date(baseDate + "T00:00:00");

    for (let i = 1; i < config.count; i++) {
      const next = new Date(base);
      if (config.type === "weekly") {
        next.setDate(base.getDate() + 7 * i);
      } else if (config.type === "biweekly") {
        next.setDate(base.getDate() + 14 * i);
      } else {
        next.setMonth(base.getMonth() + i);
      }
      const y = next.getFullYear();
      const m = String(next.getMonth() + 1).padStart(2, "0");
      const d = String(next.getDate()).padStart(2, "0");
      dates.push(`${y}-${m}-${d}`);
    }
    return dates;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.date || !form.title || !form.category) return;

    setSubmitting(true);

    try {
      if (editingId) {
        // 編集モード（繰り返しなし）
        await fetch(`/api/schedules/${editingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-admin-password": storedPassword,
          },
          body: JSON.stringify(form),
        });
      } else if (repeat.enabled) {
        // 繰り返し登録
        const dates = generateRepeatDates(form.date, repeat);
        for (const date of dates) {
          await fetch("/api/schedules", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-admin-password": storedPassword,
            },
            body: JSON.stringify({ ...form, date }),
          });
        }
      } else {
        // 通常の新規登録
        await fetch("/api/schedules", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-password": storedPassword,
          },
          body: JSON.stringify(form),
        });
      }

      setForm({ ...EMPTY_FORM });
      setEditingId(null);
      setShowForm(false);
      setRepeat({ ...DEFAULT_REPEAT });
      fetchSchedules();
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(schedule: Schedule) {
    setForm({
      date: schedule.date,
      time: schedule.time,
      endTime: schedule.endTime,
      category: schedule.category,
      title: schedule.title,
      description: schedule.description,
      location: schedule.location,
      url: schedule.url,
      published: schedule.published,
    });
    setEditingId(schedule.id);
    setShowForm(true);
    setRepeat({ ...DEFAULT_REPEAT });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: string) {
    if (!confirm("この予定を削除しますか？")) return;
    await fetch(`/api/schedules/${id}`, {
      method: "DELETE",
      headers: { "x-admin-password": storedPassword },
    });
    fetchSchedules();
  }

  async function handleTogglePublish(schedule: Schedule) {
    await fetch(`/api/schedules/${schedule.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": storedPassword,
      },
      body: JSON.stringify({ published: !schedule.published }),
    });
    fetchSchedules();
  }

  async function saveSettings(data: Partial<SiteSettings>) {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": storedPassword,
      },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      await fetchSettings();
    }
  }

  function addCategory() {
    if (!newCatLabel.trim()) return;
    const id = newCatLabel
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9　-鿿]/g, "_")
      + "_" + Date.now().toString(36);
    setEditCategories([
      ...editCategories,
      { id, label: newCatLabel.trim(), color: newCatColor },
    ]);
    setNewCatLabel("");
    setNewCatColor("#3b82f6");
  }

  function removeCategory(id: string) {
    setEditCategories(editCategories.filter((c) => c.id !== id));
  }

  function updateCategoryField(
    id: string,
    field: "label" | "color",
    value: string
  ) {
    setEditCategories(
      editCategories.map((c) =>
        c.id === id ? { ...c, [field]: value } : c
      )
    );
  }

  function moveCategoryUp(index: number) {
    if (index === 0) return;
    const arr = [...editCategories];
    [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
    setEditCategories(arr);
  }

  function moveCategoryDown(index: number) {
    if (index >= editCategories.length - 1) return;
    const arr = [...editCategories];
    [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
    setEditCategories(arr);
  }

  function resetToDefaults() {
    if (!confirm("プリセットに戻しますか？カスタムカテゴリは失われます。")) return;
    setEditCategories([...DEFAULT_CATEGORIES]);
  }

  if (!authenticated) {
    return (
      <main className="flex-1 flex items-center justify-center px-4">
        <form
          onSubmit={handleLogin}
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 w-full max-w-sm"
        >
          <h1 className="text-2xl font-bold text-slate-800 mb-6 text-center">
            管理画面ログイン
          </h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワード"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
          {authError && (
            <p className="text-red-500 text-sm mb-4">{authError}</p>
          )}
          <button
            type="submit"
            className="w-full bg-slate-800 text-white py-3 rounded-lg font-medium hover:bg-slate-700 transition-colors"
          >
            ログイン
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-3 sm:px-4 py-6 sm:py-8">
      <header className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-3 sm:mb-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
            スケジュール管理
          </h1>
          <a
            href="/"
            className="px-3 py-1.5 text-xs sm:text-sm bg-slate-100 rounded-lg active:bg-slate-200 sm:hover:bg-slate-200 transition-colors text-slate-600 sm:hidden"
          >
            閲覧ページ →
          </a>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowSettings(!showSettings);
              if (!showSettings) setSettingsTab("site");
            }}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg transition-colors ${
              showSettings
                ? "bg-slate-800 text-white"
                : "bg-slate-100 text-slate-600 active:bg-slate-200 sm:hover:bg-slate-200"
            }`}
          >
            設定
          </button>
          <a
            href="/"
            className="hidden sm:inline-block px-4 py-2 text-sm bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors text-slate-600"
          >
            閲覧ページ →
          </a>
          <button
            onClick={() => {
              setShowForm(!showForm);
              if (editingId) {
                setEditingId(null);
                setForm({ ...EMPTY_FORM });
                setRepeat({ ...DEFAULT_REPEAT });
              }
            }}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm bg-slate-800 text-white rounded-lg active:bg-slate-700 sm:hover:bg-slate-700 transition-colors"
          >
            {showForm ? "閉じる" : "＋ 新規追加"}
          </button>
        </div>
      </header>

      {/* Settings panel */}
      {showSettings && settings && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6 sm:mb-8 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            {(["site", "images", "sns", "categories"] as SettingsTab[]).map((tab) => {
              const labels: Record<SettingsTab, string> = {
                site: "サイト情報",
                images: "画像設定",
                sns: "SNSリンク",
                categories: "カテゴリ設定",
              };
              return (
                <button
                  key={tab}
                  onClick={() => setSettingsTab(tab)}
                  className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-colors ${
                    settingsTab === tab
                      ? "text-slate-800 border-b-2 border-slate-800"
                      : "text-slate-500 active:text-slate-700"
                  }`}
                >
                  {labels[tab]}
                </button>
              );
            })}
          </div>

          <div className="p-4 sm:p-6">
            {/* Site info tab - with theme color */}
            {settingsTab === "site" && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await saveSettings({
                    title: settings.title,
                    subtitle: settings.subtitle,
                    themeColor: settings.themeColor,
                  });
                  setShowSettings(false);
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">
                      タイトル
                    </label>
                    <input
                      type="text"
                      value={settings.title}
                      onChange={(e) =>
                        setSettings({ ...settings, title: e.target.value })
                      }
                      placeholder="例: 山田太郎のスケジュール"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">
                      サブタイトル
                    </label>
                    <input
                      type="text"
                      value={settings.subtitle}
                      onChange={(e) =>
                        setSettings({ ...settings, subtitle: e.target.value })
                      }
                      placeholder="例: 麻雀プロ 出演・イベント予定"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>

                  {/* Theme color */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-600 mb-2">
                      テーマカラー
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {THEME_COLOR_PRESETS.map((preset) => (
                        <button
                          key={preset.color}
                          type="button"
                          onClick={() =>
                            setSettings({ ...settings, themeColor: preset.color })
                          }
                          className={`w-8 h-8 rounded-lg border-2 transition-transform ${
                            settings.themeColor === preset.color
                              ? "border-slate-800 scale-110"
                              : "border-slate-200"
                          }`}
                          style={{ backgroundColor: preset.color }}
                          title={preset.name}
                        />
                      ))}
                      <div className="relative">
                        <div
                          className="w-8 h-8 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs cursor-pointer"
                          title="カスタムカラー"
                        >
                          +
                        </div>
                        <input
                          type="color"
                          value={settings.themeColor || "#fb7185"}
                          onChange={(e) =>
                            setSettings({ ...settings, themeColor: e.target.value })
                          }
                          className="absolute inset-0 opacity-0 cursor-pointer w-8 h-8"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded"
                        style={{ backgroundColor: settings.themeColor || "#fb7185" }}
                      />
                      <span className="text-xs text-slate-500">
                        {settings.themeColor || "#fb7185"} - ヘッダーバーやボタンに適用されます
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors"
                  >
                    保存
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    className="px-6 py-2 bg-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-300 transition-colors"
                  >
                    閉じる
                  </button>
                </div>
              </form>
            )}

            {/* Images tab */}
            {settingsTab === "images" && settings && (
              <div>
                <div className="space-y-6">
                  <ImageUploadField
                    label="プロフィール画像"
                    hint="正方形の画像を推奨（丸くトリミングされます）"
                    value={settings.profileImage}
                    folder="profile"
                    password={storedPassword}
                    previewClass="w-16 h-16 sm:w-20 sm:h-20 rounded-full"
                    onChange={(url) => setSettings({ ...settings, profileImage: url })}
                  />
                  <ImageUploadField
                    label="ヘッダー画像"
                    hint="横長の画像を推奨（幅いっぱいに表示されます）"
                    value={settings.headerImage}
                    folder="header"
                    password={storedPassword}
                    previewClass="w-full h-20 sm:h-28 rounded-lg"
                    onChange={(url) => setSettings({ ...settings, headerImage: url })}
                  />
                </div>
                <div className="flex gap-2 mt-5">
                  <button
                    type="button"
                    onClick={async () => {
                      await saveSettings({
                        profileImage: settings.profileImage,
                        headerImage: settings.headerImage,
                      });
                      setShowSettings(false);
                    }}
                    className="px-4 sm:px-6 py-2 bg-slate-800 text-white rounded-lg text-xs sm:text-sm font-medium active:bg-slate-700 sm:hover:bg-slate-700 transition-colors"
                  >
                    保存
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    className="px-4 sm:px-6 py-2 bg-slate-200 text-slate-600 rounded-lg text-xs sm:text-sm font-medium active:bg-slate-300 sm:hover:bg-slate-300 transition-colors"
                  >
                    閉じる
                  </button>
                </div>
              </div>
            )}

            {/* SNS links tab */}
            {settingsTab === "sns" && settings && (
              <div>
                <p className="text-xs sm:text-sm text-slate-500 mb-4">
                  各SNSのプロフィールURLを入力してください。空欄のものはアイコンが表示されません。
                </p>
                <div className="space-y-3">
                  {SNS_DEFINITIONS.map((sns) => (
                    <div key={sns.key}>
                      <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1">
                        {sns.label}
                      </label>
                      <input
                        type="url"
                        value={settings.snsLinks?.[sns.key] ?? ""}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            snsLinks: {
                              ...(settings.snsLinks ?? EMPTY_SNS_LINKS),
                              [sns.key]: e.target.value,
                            },
                          })
                        }
                        placeholder={sns.placeholder}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-5">
                  <button
                    type="button"
                    onClick={async () => {
                      await saveSettings({ snsLinks: settings.snsLinks });
                      setShowSettings(false);
                    }}
                    className="px-4 sm:px-6 py-2 bg-slate-800 text-white rounded-lg text-xs sm:text-sm font-medium active:bg-slate-700 sm:hover:bg-slate-700 transition-colors"
                  >
                    保存
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    className="px-4 sm:px-6 py-2 bg-slate-200 text-slate-600 rounded-lg text-xs sm:text-sm font-medium active:bg-slate-300 sm:hover:bg-slate-300 transition-colors"
                  >
                    閉じる
                  </button>
                </div>
              </div>
            )}

            {/* Categories tab */}
            {settingsTab === "categories" && (
              <div>
                <div className="space-y-2 mb-6">
                  {editCategories.length === 0 && (
                    <p className="text-slate-400 text-sm text-center py-4">
                      カテゴリが登録されていません
                    </p>
                  )}
                  {editCategories.map((cat, idx) => (
                    <div key={cat.id} className="bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex flex-col gap-0.5">
                          <button type="button" onClick={() => moveCategoryUp(idx)} className="text-slate-400 active:text-slate-600 sm:hover:text-slate-600 text-xs leading-none" disabled={idx === 0}>▲</button>
                          <button type="button" onClick={() => moveCategoryDown(idx)} className="text-slate-400 active:text-slate-600 sm:hover:text-slate-600 text-xs leading-none" disabled={idx === editCategories.length - 1}>▼</button>
                        </div>
                        <div className="relative shrink-0">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg cursor-pointer border border-slate-200" style={{ backgroundColor: cat.color }} />
                          <input type="color" value={cat.color} onChange={(e) => updateCategoryField(cat.id, "color", e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-7 h-7 sm:w-8 sm:h-8" />
                        </div>
                        <input type="text" value={cat.label} onChange={(e) => updateCategoryField(cat.id, "label", e.target.value)} className="flex-1 min-w-0 px-2 sm:px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
                        <span className="text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full text-white shrink-0" style={{ backgroundColor: cat.color }}>{cat.label || "---"}</span>
                        <button type="button" onClick={() => removeCategory(cat.id)} className="text-red-400 active:text-red-600 sm:hover:text-red-600 text-xs shrink-0">削除</button>
                      </div>
                      <div className="mt-2 ml-7 sm:ml-8">
                        <select value={cat.color} onChange={(e) => updateCategoryField(cat.id, "color", e.target.value)} className="px-2 py-1 border border-slate-300 rounded text-xs sm:text-sm bg-white w-full sm:w-auto">
                          {COLOR_PRESETS.map((p) => (<option key={p.color} value={p.color}>{p.name}</option>))}
                          {!COLOR_PRESETS.find((p) => p.color === cat.color) && (<option value={cat.color}>カスタム</option>)}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add new category */}
                <div className="bg-slate-50 rounded-lg p-3 sm:p-4 mb-4">
                  <h4 className="text-xs sm:text-sm font-medium text-slate-600 mb-2 sm:mb-3">カテゴリを追加</h4>
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <div className="relative shrink-0">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg cursor-pointer border border-slate-200" style={{ backgroundColor: newCatColor }} />
                      <input type="color" value={newCatColor} onChange={(e) => setNewCatColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-7 h-7 sm:w-8 sm:h-8" />
                    </div>
                    <input type="text" value={newCatLabel} onChange={(e) => setNewCatLabel(e.target.value)} placeholder="カテゴリ名" className="flex-1 min-w-0 px-2 sm:px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCategory(); } }} />
                    <button type="button" onClick={addCategory} className="px-3 sm:px-4 py-1.5 bg-slate-700 text-white rounded-lg text-xs sm:text-sm active:bg-slate-600 sm:hover:bg-slate-600 transition-colors shrink-0">追加</button>
                  </div>
                  <div className="ml-9 sm:ml-11">
                    <select value={newCatColor} onChange={(e) => setNewCatColor(e.target.value)} className="px-2 py-1 border border-slate-300 rounded text-xs sm:text-sm bg-white w-full sm:w-auto">
                      {COLOR_PRESETS.map((p) => (<option key={p.color} value={p.color}>{p.name}</option>))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={async () => { await saveSettings({ categories: editCategories }); setShowSettings(false); }} className="px-4 sm:px-6 py-2 bg-slate-800 text-white rounded-lg text-xs sm:text-sm font-medium active:bg-slate-700 sm:hover:bg-slate-700 transition-colors">保存</button>
                  <button type="button" onClick={resetToDefaults} className="px-4 sm:px-6 py-2 bg-slate-200 text-slate-600 rounded-lg text-xs sm:text-sm font-medium active:bg-slate-300 sm:hover:bg-slate-300 transition-colors">プリセットに戻す</button>
                  <button type="button" onClick={() => { setEditCategories(settings?.categories ?? []); setShowSettings(false); }} className="px-4 sm:px-6 py-2 bg-slate-200 text-slate-600 rounded-lg text-xs sm:text-sm font-medium active:bg-slate-300 sm:hover:bg-slate-300 transition-colors">キャンセル</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schedule form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-6 sm:mb-8"
        >
          <h2 className="text-base sm:text-lg font-bold text-slate-700 mb-3 sm:mb-4">
            {editingId ? "予定を編集" : "新しい予定を追加"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">日付 *</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">開始時間</label>
              <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">終了時間</label>
              <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">カテゴリ *</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400">
                <option value="">選択してください</option>
                {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.label}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">タイトル *</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="例: Mリーグ解説" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">会場・場所</label>
              <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="例: 渋谷ABEMAS STUDIO" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-600 mb-1">詳細・備考</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="放送チャンネル、会場情報など" rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-600 mb-1">関連URL</label>
              <input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400" />
            </div>
            <div className="md:col-span-2 flex items-center gap-2">
              <input type="checkbox" id="published" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="w-4 h-4" />
              <label htmlFor="published" className="text-sm font-medium text-slate-600">公開する</label>
            </div>

            {/* 繰り返し設定（新規追加時のみ） */}
            {!editingId && (
              <div className="md:col-span-2 bg-slate-50 rounded-lg p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="repeat-enabled"
                    checked={repeat.enabled}
                    onChange={(e) => setRepeat({ ...repeat, enabled: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="repeat-enabled" className="text-sm font-medium text-slate-600">
                    繰り返し登録
                  </label>
                </div>
                {repeat.enabled && (
                  <div className="flex flex-wrap gap-3 mt-2">
                    <select
                      value={repeat.type}
                      onChange={(e) => setRepeat({ ...repeat, type: e.target.value as RepeatConfig["type"] })}
                      className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                      <option value="weekly">毎週</option>
                      <option value="biweekly">隔週</option>
                      <option value="monthly">毎月</option>
                    </select>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={2}
                        max={52}
                        value={repeat.count}
                        onChange={(e) => setRepeat({ ...repeat, count: parseInt(e.target.value) || 2 })}
                        className="w-16 px-2 py-1.5 border border-slate-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                      <span className="text-sm text-slate-600">回分</span>
                    </div>
                    <p className="w-full text-xs text-slate-400">
                      {form.date ? `${form.date} から${repeat.type === "weekly" ? "毎週" : repeat.type === "biweekly" ? "隔週" : "毎月"}${repeat.count}件を一括登録` : "日付を選択してください"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-6">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              {submitting ? "処理中..." : editingId ? "更新" : repeat.enabled ? `${repeat.count}件を一括追加` : "追加"}
            </button>
            <button
              type="button"
              onClick={() => {
                setForm({ ...EMPTY_FORM });
                setEditingId(null);
                setShowForm(false);
                setRepeat({ ...DEFAULT_REPEAT });
              }}
              className="px-6 py-2 bg-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-300 transition-colors"
            >
              キャンセル
            </button>
          </div>
        </form>
      )}

      {/* Schedule list */}
      <div className="space-y-2 sm:space-y-3">
        {schedules.length === 0 ? (
          <p className="text-slate-400 text-center py-8 sm:py-12 text-sm">
            予定がまだ登録されていません
          </p>
        ) : (
          schedules.map((s) => (
            <div
              key={s.id}
              className={`bg-white rounded-lg shadow-sm border border-slate-200 p-3 sm:p-4 ${
                !s.published ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="text-center min-w-[44px] sm:min-w-[60px]">
                  <div className="text-lg sm:text-xl font-bold text-slate-700">
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
                      <span className="text-[10px] sm:text-xs text-slate-500">{formatTimeRange(s.time, s.endTime)}</span>
                    )}
                    {!s.published && (
                      <span className="text-[10px] sm:text-xs text-orange-500 font-medium">非公開</span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base truncate">{s.title}</h3>
                  {s.location && (
                    <p className="text-[10px] sm:text-xs text-slate-400 truncate flex items-center gap-0.5">
                      <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                      {s.location}
                    </p>
                  )}
                  {s.description && (
                    <p className="text-xs sm:text-sm text-slate-500 truncate">{s.description}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-1 mt-2 sm:mt-0 sm:justify-end pl-[56px] sm:pl-0">
                <button
                  onClick={() => handleTogglePublish(s)}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs rounded-lg transition-colors ${
                    s.published
                      ? "bg-green-100 text-green-700 active:bg-green-200 sm:hover:bg-green-200"
                      : "bg-orange-100 text-orange-700 active:bg-orange-200 sm:hover:bg-orange-200"
                  }`}
                >
                  {s.published ? "公開中" : "非公開"}
                </button>
                <button
                  onClick={() => handleEdit(s)}
                  className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs bg-slate-100 text-slate-600 rounded-lg active:bg-slate-200 sm:hover:bg-slate-200 transition-colors"
                >
                  編集
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs bg-red-100 text-red-600 rounded-lg active:bg-red-200 sm:hover:bg-red-200 transition-colors"
                >
                  削除
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}

/* ─── Image Upload Component ─── */

function ImageUploadField({
  label,
  hint,
  value,
  folder,
  password,
  previewClass,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  folder: string;
  password: string;
  previewClass: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"upload" | "url">("upload");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "x-admin-password": password },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        onChange(data.url);
      } else {
        setError(data.error || "アップロードに失敗しました");
      }
    } catch {
      setError("アップロードに失敗しました");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      <div className="flex gap-1 mb-3">
        <button type="button" onClick={() => setMode("upload")} className={`px-3 py-1 text-xs rounded-lg transition-colors ${mode === "upload" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-500 active:bg-slate-200"}`}>ファイルを選択</button>
        <button type="button" onClick={() => setMode("url")} className={`px-3 py-1 text-xs rounded-lg transition-colors ${mode === "url" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-500 active:bg-slate-200"}`}>URLを入力</button>
      </div>
      {mode === "upload" ? (
        <label className={`flex flex-col items-center justify-center w-full h-24 sm:h-28 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${uploading ? "border-slate-300 bg-slate-50" : "border-slate-300 bg-white active:bg-slate-50 sm:hover:bg-slate-50 active:border-slate-400 sm:hover:border-slate-400"}`}>
          {uploading ? (
            <div className="text-sm text-slate-400">アップロード中...</div>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" /></svg>
              <span className="text-xs sm:text-sm text-slate-500">タップして画像を選択</span>
              <span className="text-[10px] text-slate-400 mt-0.5">JPEG / PNG / WebP / GIF（5MBまで）</span>
            </>
          )}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFileChange} disabled={uploading} className="hidden" />
        </label>
      ) : (
        <input type="url" value={value} onChange={(e) => { setError(""); onChange(e.target.value); }} placeholder="https://example.com/image.jpg" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      <p className="text-[10px] sm:text-xs text-slate-400 mt-1">{hint}</p>
      {value && (
        <div className="mt-3 flex items-end gap-3">
          <img src={value} alt="プレビュー" className={`object-cover border border-slate-200 ${previewClass}`} />
          <button type="button" onClick={() => onChange("")} className="px-2.5 py-1 text-[10px] sm:text-xs bg-red-50 text-red-500 rounded-lg active:bg-red-100 sm:hover:bg-red-100 transition-colors shrink-0">画像を削除</button>
        </div>
      )}
    </div>
  );
}
