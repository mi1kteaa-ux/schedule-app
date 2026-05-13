import { getSupabase, getAdminClient } from "./supabase";
import { Schedule, ScheduleInput, SiteSettings, DEFAULT_CATEGORIES } from "./types";

// --- Settings ---

export async function getSettings(): Promise<SiteSettings> {
  const { data } = await getSupabase()
    .from("site_settings")
    .select("title, subtitle, profile_image, header_image, categories")
    .eq("id", 1)
    .single();

  if (!data) {
    return {
      title: "スケジュール",
      subtitle: "出演・イベント予定",
      profileImage: "",
      headerImage: "",
      categories: DEFAULT_CATEGORIES,
    };
  }
  return {
    title: data.title,
    subtitle: data.subtitle,
    profileImage: data.profile_image ?? "",
    headerImage: data.header_image ?? "",
    categories: data.categories ?? DEFAULT_CATEGORIES,
  };
}

export async function updateSettings(
  settings: Partial<SiteSettings>
): Promise<SiteSettings> {
  const admin = getAdminClient();
  const updateData: Record<string, unknown> = {};
  if (settings.title !== undefined) updateData.title = settings.title;
  if (settings.subtitle !== undefined) updateData.subtitle = settings.subtitle;
  if (settings.profileImage !== undefined) updateData.profile_image = settings.profileImage;
  if (settings.headerImage !== undefined) updateData.header_image = settings.headerImage;
  if (settings.categories !== undefined) updateData.categories = settings.categories;
  await admin
    .from("site_settings")
    .update(updateData)
    .eq("id", 1);
  return getSettings();
}

// --- Schedules ---

function toSchedule(row: Record<string, unknown>): Schedule {
  return {
    id: row.id as string,
    date: row.date as string,
    time: row.time as string,
    category: row.category as string,
    title: row.title as string,
    description: row.description as string,
    url: row.url as string,
    published: row.published as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getPublishedFutureSchedules(): Promise<Schedule[]> {
  const { data } = await getSupabase()
    .from("schedules")
    .select("*")
    .order("date", { ascending: true });
  return (data ?? []).map(toSchedule);
}

export async function getAllSchedules(): Promise<Schedule[]> {
  const admin = getAdminClient();
  const { data } = await admin
    .from("schedules")
    .select("*")
    .order("date", { ascending: true });
  return (data ?? []).map(toSchedule);
}

export async function createSchedule(input: ScheduleInput): Promise<Schedule> {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("schedules")
    .insert({
      date: input.date,
      time: input.time,
      category: input.category,
      title: input.title,
      description: input.description,
      url: input.url,
      published: input.published,
    })
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "Insert failed");
  return toSchedule(data);
}

export async function updateSchedule(
  id: string,
  input: Partial<ScheduleInput>
): Promise<Schedule | null> {
  const admin = getAdminClient();
  const updateData: Record<string, unknown> = { ...input, updated_at: new Date().toISOString() };
  const { data, error } = await admin
    .from("schedules")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) return null;
  return toSchedule(data);
}

export async function deleteSchedule(id: string): Promise<boolean> {
  const admin = getAdminClient();
  const { error } = await admin
    .from("schedules")
    .delete()
    .eq("id", id);
  return !error;
}
