"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Schedule,
  ScheduleInput,
  SiteSettings,
  CategoryConfig,
  COLOR_PRESETS,
  DEFAULT_CATEGORIES,
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

type SettingsTab = "site" | "categories";

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
    <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-800">
          スケジュール管理
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowSettings(!showSettings);
              if (!showSettings) setSettingsTab("site");
            }}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              showSettings
                ? "bg-slate-800 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            設定
          </button>
          <a
            href="/"
            className="px-4 py-2 text-sm bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors text-slate-600"
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
            className="px-4 py-2 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            {showForm ? "閉じる" : "＋ 新規追加"}
          </button>
        </div>
      </header>

      {/* Settings panel */}
      {showSettings && settings && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-8 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setSettingsTab("site")}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                settingsTab === "site"
                  ? "text-slate-800 border-b-2 border-slate-800"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              サイト情報
            </button>
            <button
              onClick={() => setSettingsTab("categories")}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                settingsTab === "categories"
                  ? "text-slate-800 border-b-2 border-slate-800"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              カテゴリ設定
            </button>
          </div>

          <div className="p-6">
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
                      className="flex items-center gap-3 bg-slate-50 rounded-lg p-3"
                    >
                      {/* Reorder buttons */}
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          onClick={() => moveCategoryUp(idx)}
                          className="text-slate-400 hover:text-slate-600 text-xs leading-none"
                          disabled={idx === 0}
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => moveCategoryDown(idx)}
                          className="text-slate-400 hover:text-slate-600 text-xs leading-none"
                          disabled={idx === editCategories.length - 1}
                        >
                          ▼
                        </button>
                      </div>

                      {/* Color preview & picker */}
                      <div className="relative">
                        <div
                          className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200"
                          style={{ backgroundColor: cat.color }}
                        />
                        <input
                          type="color"
                          value={cat.color}
                          onChange={(e) =>
                            updateCategoryField(cat.id, "color", e.target.value)
                          }
                          className="absolute inset-0 opacity-0 cursor-pointer w-8 h-8"
                        />
                      </div>

                      {/* Color presets dropdown */}
                      <select
                        value={cat.color}
                        onChange={(e) =>
                          updateCategoryField(cat.id, "color", e.target.value)
                        }
                        className="px-2 py-1 border border-slate-300 rounded text-sm bg-white"
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

                      {/* Label input */}
                      <input
                        type="text"
                        value={cat.label}
                        onChange={(e) =>
                          updateCategoryField(cat.id, "label", e.target.value)
                        }
                        className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />

                      {/* Preview badge */}
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full text-white shrink-0"
                        style={{ backgroundColor: cat.color }}
                      >
                        {cat.label || "---"}
                      </span>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => removeCategory(cat.id)}
                        className="text-red-400 hover:text-red-600 text-sm shrink-0"
                      >
                        削除
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add new category */}
                <div className="bg-slate-50 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-slate-600 mb-3">
                    カテゴリを追加
                  </h4>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div
                        className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200"
                        style={{ backgroundColor: newCatColor }}
                      />
                      <input
                        type="color"
                        value={newCatColor}
                        onChange={(e) => setNewCatColor(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-8 h-8"
                      />
                    </div>
                    <select
                      value={newCatColor}
                      onChange={(e) => setNewCatColor(e.target.value)}
                      className="px-2 py-1 border border-slate-300 rounded text-sm bg-white"
                    >
                      {COLOR_PRESETS.map((p) => (
                        <option key={p.color} value={p.color}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={newCatLabel}
                      onChange={(e) => setNewCatLabel(e.target.value)}
                      placeholder="カテゴリ名"
                      className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
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
                      className="px-4 py-1.5 bg-slate-700 text-white rounded-lg text-sm hover:bg-slate-600 transition-colors"
                    >
                      追加
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await saveSettings({ categories: editCategories });
                      setShowSettings(false);
                    }}
                    className="px-6 py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors"
                  >
                    保存
                  </button>
                  <button
                    type="button"
                    onClick={resetToDefaults}
                    className="px-6 py-2 bg-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-300 transition-colors"
                  >
                    プリセットに戻す
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditCategories(settings?.categories ?? []);
                      setShowSettings(false);
                    }}
                    className="px-6 py-2 bg-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-300 transition-colors"
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
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8"
        >
          <h2 className="text-lg font-bold text-slate-700 mb-4">
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
      <div className="space-y-3">
        {schedules.length === 0 ? (
          <p className="text-slate-400 text-center py-12">
            予定がまだ登録されていません
          </p>
        ) : (
          schedules.map((s) => (
            <div
              key={s.id}
              className={`bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex items-center gap-4 ${
                !s.published ? "opacity-60" : ""
              }`}
            >
              <div className="text-center min-w-[60px]">
                <div className="text-xl font-bold text-slate-700">
                  {new Date(s.date + "T00:00:00").getDate()}
                </div>
                <div className="text-xs text-slate-400">
                  {new Date(s.date + "T00:00:00").getFullYear()}/
                  {new Date(s.date + "T00:00:00").getMonth() + 1}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: getCategoryColor(s.category) }}
                  >
                    {getCategoryLabel(s.category)}
                  </span>
                  {s.time && (
                    <span className="text-xs text-slate-500">{s.time}</span>
                  )}
                  {!s.published && (
                    <span className="text-xs text-orange-500 font-medium">
                      非公開
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-slate-800 truncate">
                  {s.title}
                </h3>
                {s.description && (
                  <p className="text-sm text-slate-500 truncate">
                    {s.description}
                  </p>
                )}
              </div>

              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => handleTogglePublish(s)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    s.published
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-orange-100 text-orange-700 hover:bg-orange-200"
                  }`}
                >
                  {s.published ? "公開中" : "非公開"}
                </button>
                <button
                  onClick={() => handleEdit(s)}
                  className="px-3 py-1.5 text-xs bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  編集
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="px-3 py-1.5 text-xs bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
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
