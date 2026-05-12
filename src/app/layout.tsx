import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { getSettings } from "@/lib/storage";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  let title = "スケジュール";
  let description = "出演・イベントスケジュール";
  try {
    const settings = await getSettings();
    title = settings.title || title;
    description = settings.subtitle || description;
  } catch {
    // Supabase未設定時はデフォルト値を使用
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "ja_JP",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
