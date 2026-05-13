-- サイト設定テーブルにSNSリンクカラムを追加
-- Supabase ダッシュボード > SQL Editor にコピペして実行してください

alter table site_settings
  add column if not exists sns_links jsonb not null default '{}'::jsonb;
