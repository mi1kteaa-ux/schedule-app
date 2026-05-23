import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { getSettings } from "@/lib/storage";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

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

  const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
  const ogImageUrl = `${baseUrl}/api/og`;

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "ja_JP",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // サーバーサイドで設定を取得してFOUC防止
  let bgColor = "#f8fafc";
  let cardColor = "#ffffff";
  let isDark = false;
  try {
    const s = await getSettings();
    bgColor = s.backgroundColor || bgColor;
    cardColor = s.cardColor || cardColor;
    // 相対輝度で明暗判定
    const r = parseInt(bgColor.slice(1, 3), 16) / 255;
    const g = parseInt(bgColor.slice(3, 5), 16) / 255;
    const b = parseInt(bgColor.slice(5, 7), 16) / 255;
    isDark = 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.45;
  } catch {
    // デフォルト値のまま
  }

  return (
    <html
      lang="ja"
      className={`${geistSans.variable} h-full antialiased${isDark ? " dark" : ""}`}
      suppressHydrationWarning
      style={{ ["--custom-bg" as string]: bgColor, ["--custom-card" as string]: cardColor }}
    >
      <body className="min-h-full flex flex-col" style={{ background: bgColor }}>{children}</body>
    </html>
  );
}
