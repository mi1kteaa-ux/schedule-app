-- Supabase Storage に画像用バケットを作成
-- Supabase ダッシュボード > SQL Editor にコピペして実行してください

insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

-- 誰でも画像を閲覧できるポリシー
create policy "Public can view images"
  on storage.objects for select
  using (bucket_id = 'images');

-- サービスロールのみアップロード可能
create policy "Service role can upload images"
  on storage.objects for insert
  with check (bucket_id = 'images');

-- サービスロールのみ削除可能
create policy "Service role can delete images"
  on storage.objects for delete
  using (bucket_id = 'images');
