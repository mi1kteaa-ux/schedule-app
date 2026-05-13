-- サイト設定テーブルに画像カラムを追加
-- Supabase ダッシュボード > SQL Editor にコピペして実行してください

alter table site_settings
  add column if not exists profile_image text not null default '',
  add column if not exists header_image text not null default '';
