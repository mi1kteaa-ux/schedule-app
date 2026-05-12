-- Supabase で実行するSQLスキーマ
-- Supabase ダッシュボード > SQL Editor にコピペして実行してください

-- スケジュールテーブル
create table schedules (
  id uuid primary key default gen_random_uuid(),
  date text not null,
  time text not null default '',
  category text not null,
  title text not null,
  description text not null default '',
  url text not null default '',
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- サイト設定テーブル（1行のみ使用）
create table site_settings (
  id integer primary key default 1 check (id = 1),
  title text not null default 'スケジュール',
  subtitle text not null default '出演・イベント予定',
  categories jsonb not null default '[
    {"id":"commentary","label":"番組解説","color":"#3b82f6"},
    {"id":"guest","label":"大会ゲスト","color":"#10b981"},
    {"id":"event","label":"イベント","color":"#f59e0b"},
    {"id":"streaming","label":"配信","color":"#8b5cf6"},
    {"id":"tournament","label":"大会出場","color":"#ef4444"},
    {"id":"lesson","label":"麻雀教室","color":"#ec4899"},
    {"id":"media","label":"メディア出演","color":"#06b6d4"},
    {"id":"talk","label":"トークショー","color":"#f97316"},
    {"id":"other","label":"その他","color":"#6b7280"}
  ]'::jsonb
);

-- 初期設定を挿入
insert into site_settings (id) values (1);

-- RLS (Row Level Security) を有効化
alter table schedules enable row level security;
alter table site_settings enable row level security;

-- 閲覧用ポリシー（誰でも公開済み・未来の予定を読める）
create policy "Public can read published future schedules"
  on schedules for select
  using (published = true and date >= to_char(now() at time zone 'Asia/Tokyo', 'YYYY-MM-DD'));

-- 管理用ポリシー（全件読み取り - サービスロールキー使用時）
create policy "Service role can read all schedules"
  on schedules for select
  using (auth.role() = 'service_role');

create policy "Service role can insert schedules"
  on schedules for insert
  with check (auth.role() = 'service_role');

create policy "Service role can update schedules"
  on schedules for update
  using (auth.role() = 'service_role');

create policy "Service role can delete schedules"
  on schedules for delete
  using (auth.role() = 'service_role');

-- 設定テーブルのポリシー
create policy "Public can read settings"
  on site_settings for select
  using (true);

create policy "Service role can update settings"
  on site_settings for update
  using (auth.role() = 'service_role');
