import type { Metadata } from "next";
import { Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin", "cyrillic"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin", "cyrillic"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const DESCRIPTION = "Учебная платформа: задания, тесты и разбор решений";

export const metadata: Metadata = {
  // Нужен, чтобы относительные ссылки в openGraph разворачивались в абсолютные
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Study Platform",
    template: "%s — Study Platform",
  },
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "Study Platform",
    title: "Study Platform",
    description: DESCRIPTION,
    url: "/",
  },
  robots: {
    // Кабинет за авторизацией индексировать нечего
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${interTight.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
