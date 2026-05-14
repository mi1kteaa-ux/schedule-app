-- スケジュールテーブルに場所カラム、サイト設定にテーマカラーを追加
-- Supabase ダッシュボード > SQL Editor にコピペして実行してください

-- 場所（会場）フィールド
alter table schedules
  add column if not exists location text not null default '';

-- テーマカラー（アクセントカラー）
alter table site_settings
  add column if not exists theme_color text not null default '#fb7185';
