-- 背景色・カード色カラムを追加
-- Supabase ダッシュボード > SQL Editor にコピペして実行してください

-- ページ背景色
alter table site_settings
  add column if not exists background_color text not null default '#f8fafc';

-- カード・カレンダー背景色
alter table site_settings
  add column if not exists card_color text not null default '#ffffff';
