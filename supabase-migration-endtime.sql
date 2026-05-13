-- スケジュールテーブルに終了時間カラムを追加
-- Supabase ダッシュボード > SQL Editor にコピペして実行してください

alter table schedules
  add column if not exists end_time text not null default '';
