"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Schedule,
  ScheduleInput,
  SiteSettings,
  CategoryConfig,
  SnsLinks,
  COLOR_PRESETS,
  DEFAULT_CATEGORIES,
  EMPTY_SNS_LINKS,
  SNS_DEFINITIONS,
} from "@/lib/types";

const EMPTY_FORM: ScheduleInput = {
  date: "",
  time: "",
  category: "",
  title: "",
  description: "",
  url: "",
  published: true,
};

type SettingsTab = "site" | "images" | "sns" | "categories";

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
      setAuthError("パスワードが正しくありません");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.date || !form.title || !form.category) return;

    const url = editingId
      ? `/api/schedules/${editingId}`
      : "/api/schedules";
    const method = editingId ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": storedPassword,
      },
      body: JSON.stringify(form),
    });

    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setShowForm(false);
    fetchSchedules();
  }

  function handleEdit(schedule: Schedule) {
    setForm({
      date: schedule.date,
      time: schedule.time,
      category: schedule.category,
      title: schedule.title,
      description: schedule.description,
      url: schedule.url,
      published: schedule.published,
    });
    setEditingId(schedule.id);
    setShowForm(true);
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
            <button
              onClick={() => setSettingsTab("site")}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-colors ${
                settingsTab === "site"
                  ? "text-slate-800 border-b-2 border-slate-800"
                  : "text-slate-500 active:text-slate-700"
              }`}
            >
              サイト情報
            </button>
            <button
              onClick={() => setSettingsTab("images")}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-colors ${
                settingsTab === "images"
                  ? "text-slate-800 border-b-2 border-slate-800"
                  : "text-slate-500 active:text-slate-700"
              }`}
            >
              画像設定
            </button>
            <button
              onClick={() => setSettingsTab("sns")}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-colors ${
                settingsTab === "sns"
                  ? "text-slate-800 border-b-2 border-slate-800"
                  : "text-slate-500 active:text-slate-700"
              }`}
            >
              SNSリンク
            </button>
            <button
              onClick={() => setSettingsTab("categories")}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-colors ${
                settingsTab === "categories"
                  ? "text-slate-800 border-b-2 border-slate-800"
                  : "text-slate-500 active:text-slate-700"
              }`}
            >
              カテゴリ設定
            </button>
          </div>

          <div className="p-4 sm:p-6">
            {/* Site info tab */}
            {settingsTab === "site" && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await saveSettings({
                    title: settings.title,
                    subtitle: settings.subtitle,
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
                  {/* Profile image */}
                  <ImageUploadField
                    label="プロフィール画像"
                    hint="正方形の画像を推奨（丸くトリミングされます）"
                    value={settings.profileImage}
                    folder="profile"
                    password={storedPassword}
                    previewClass="w-16 h-16 sm:w-20 sm:h-20 rounded-full"
                    onChange={(url) => setSettings({ ...settings, profileImage: url })}
                  />

                  {/* Header image */}
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
                {/* Category list */}
                <div className="space-y-2 mb-6">
                  {editCategories.length === 0 && (
                    <p className="text-slate-400 text-sm text-center py-4">
                      カテゴリが登録されていません
                    </p>
                  )}
                  {editCategories.map((cat, idx) => (
                    <div
                      key={cat.id}
                      className="bg-slate-50 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        {/* Reorder buttons */}
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            onClick={() => moveCategoryUp(idx)}
                            className="text-slate-400 active:text-slate-600 sm:hover:text-slate-600 text-xs leading-none"
                            disabled={idx === 0}
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => moveCategoryDown(idx)}
                            className="text-slate-400 active:text-slate-600 sm:hover:text-slate-600 text-xs leading-none"
                            disabled={idx === editCategories.length - 1}
                          >
                            ▼
                          </button>
                        </div>

                        {/* Color preview & picker */}
                        <div className="relative shrink-0">
                          <div
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg cursor-pointer border border-slate-200"
                            style={{ backgroundColor: cat.color }}
                          />
                          <input
                            type="color"
                            value={cat.color}
                            onChange={(e) =>
                              updateCategoryField(cat.id, "color", e.target.value)
                            }
                            className="absolute inset-0 opacity-0 cursor-pointer w-7 h-7 sm:w-8 sm:h-8"
                          />
                        </div>

                        {/* Label input */}
                        <input
                          type="text"
                          value={cat.label}
                          onChange={(e) =>
                            updateCategoryField(cat.id, "label", e.target.value)
                          }
                          className="flex-1 min-w-0 px-2 sm:px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />

                        {/* Preview badge */}
                        <span
                          className="text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full text-white shrink-0"
                          style={{ backgroundColor: cat.color }}
                        >
                          {cat.label || "---"}
                        </span>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => removeCategory(cat.id)}
                          className="text-red-400 active:text-red-600 sm:hover:text-red-600 text-xs shrink-0"
                        >
                          削除
                        </button>
                      </div>

                      {/* Color presets dropdown - second row on mobile */}
                      <div className="mt-2 ml-7 sm:ml-8">
                        <select
                          value={cat.color}
                          onChange={(e) =>
                            updateCategoryField(cat.id, "color", e.target.value)
                          }
                          className="px-2 py-1 border border-slate-300 rounded text-xs sm:text-sm bg-white w-full sm:w-auto"
                        >
                          {COLOR_PRESETS.map((p) => (
                            <option key={p.color} value={p.color}>
                              {p.name}
                            </option>
                          ))}
                          {!COLOR_PRESETS.find((p) => p.color === cat.color) && (
                            <option value={cat.color}>カスタム</option>
                          )}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add new category */}
                <div className="bg-slate-50 rounded-lg p-3 sm:p-4 mb-4">
                  <h4 className="text-xs sm:text-sm font-medium text-slate-600 mb-2 sm:mb-3">
                    カテゴリを追加
                  </h4>
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <div className="relative shrink-0">
                      <div
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg cursor-pointer border border-slate-200"
                        style={{ backgroundColor: newCatColor }}
                      />
                      <input
                        type="color"
                        value={newCatColor}
                        onChange={(e) => setNewCatColor(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-7 h-7 sm:w-8 sm:h-8"
                      />
                    </div>
                    <input
                      type="text"
                      value={newCatLabel}
                      onChange={(e) => setNewCatLabel(e.target.value)}
                      placeholder="カテゴリ名"
                      className="flex-1 min-w-0 px-2 sm:px-3 py-1.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCategory();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={addCategory}
                      className="px-3 sm:px-4 py-1.5 bg-slate-700 text-white rounded-lg text-xs sm:text-sm active:bg-slate-600 sm:hover:bg-slate-600 transition-colors shrink-0"
                    >
                      追加
                    </button>
                  </div>
                  <div className="ml-9 sm:ml-11">
                    <select
                      value={newCatColor}
                      onChange={(e) => setNewCatColor(e.target.value)}
                      className="px-2 py-1 border border-slate-300 rounded text-xs sm:text-sm bg-white w-full sm:w-auto"
                    >
                      {COLOR_PRESETS.map((p) => (
                        <option key={p.color} value={p.color}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await saveSettings({ categories: editCategories });
                      setShowSettings(false);
                    }}
                    className="px-4 sm:px-6 py-2 bg-slate-800 text-white rounded-lg text-xs sm:text-sm font-medium active:bg-slate-700 sm:hover:bg-slate-700 transition-colors"
                  >
                    保存
                  </button>
                  <button
                    type="button"
                    onClick={resetToDefaults}
                    className="px-4 sm:px-6 py-2 bg-slate-200 text-slate-600 rounded-lg text-xs sm:text-sm font-medium active:bg-slate-300 sm:hover:bg-slate-300 transition-colors"
                  >
                    プリセットに戻す
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditCategories(settings?.categories ?? []);
                      setShowSettings(false);
                    }}
                    className="px-4 sm:px-6 py-2 bg-slate-200 text-slate-600 rounded-lg text-xs sm:text-sm font-medium active:bg-slate-300 sm:hover:bg-slate-300 transition-colors"
                  >
                    キャンセル
                  </button>
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
              <label className="block text-sm font-medium text-slate-600 mb-1">
                日付 *
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                時間
              </label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                カテゴリ *
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <option value="">選択してください</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                タイトル *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                placeholder="例: Mリーグ解説"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-600 mb-1">
                詳細・備考
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="放送チャンネル、会場情報など"
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-600 mb-1">
                関連URL
              </label>
              <input
                type="url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="published"
                checked={form.published}
                onChange={(e) =>
                  setForm({ ...form, published: e.target.checked })
                }
                className="w-4 h-4"
              />
              <label
                htmlFor="published"
                className="text-sm font-medium text-slate-600"
              >
                公開する
              </label>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              type="submit"
              className="px-6 py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors"
            >
              {editingId ? "更新" : "追加"}
            </button>
            <button
              type="button"
              onClick={() => {
                setForm({ ...EMPTY_FORM });
                setEditingId(null);
                setShowForm(false);
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
                      <span className="text-[10px] sm:text-xs text-slate-500">{s.time}</span>
                    )}
                    {!s.published && (
                      <span className="text-[10px] sm:text-xs text-orange-500 font-medium">
                        非公開
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base truncate">
                    {s.title}
                  </h3>
                  {s.description && (
                    <p className="text-xs sm:text-sm text-slate-500 truncate">
                      {s.description}
                    </p>
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
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
      </label>

      {/* Mode toggle */}
      <div className="flex gap-1 mb-3">
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`px-3 py-1 text-xs rounded-lg transition-colors ${
            mode === "upload"
              ? "bg-slate-800 text-white"
              : "bg-slate-100 text-slate-500 active:bg-slate-200"
          }`}
        >
          ファイルを選択
        </button>
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`px-3 py-1 text-xs rounded-lg transition-colors ${
            mode === "url"
              ? "bg-slate-800 text-white"
              : "bg-slate-100 text-slate-500 active:bg-slate-200"
          }`}
        >
          URLを入力
        </button>
      </div>

      {mode === "upload" ? (
        <div>
          <label
            className={`flex flex-col items-center justify-center w-full h-24 sm:h-28 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
              uploading
                ? "border-slate-300 bg-slate-50"
                : "border-slate-300 bg-white active:bg-slate-50 sm:hover:bg-slate-50 active:border-slate-400 sm:hover:border-slate-400"
            }`}
          >
            {uploading ? (
              <div className="text-sm text-slate-400">アップロード中...</div>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                </svg>
                <span className="text-xs sm:text-sm text-slate-500">
                  タップして画像を選択
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  JPEG / PNG / WebP / GIF（5MBまで）
                </span>
              </>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <input
          type="url"
          value={value}
          onChange={(e) => {
            setError("");
            onChange(e.target.value);
          }}
          placeholder="https://example.com/image.jpg"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      )}

      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
      <p className="text-[10px] sm:text-xs text-slate-400 mt-1">{hint}</p>

      {/* Preview & clear */}
      {value && (
        <div className="mt-3 flex items-end gap-3">
          <img
            src={value}
            alt="プレビュー"
            className={`object-cover border border-slate-200 ${previewClass}`}
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="px-2.5 py-1 text-[10px] sm:text-xs bg-red-50 text-red-500 rounded-lg active:bg-red-100 sm:hover:bg-red-100 transition-colors shrink-0"
          >
            画像を削除
          </button>
        </div>
      )}
    </div>
  );
}
