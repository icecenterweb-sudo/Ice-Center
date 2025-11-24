import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import TopBanner from "@/components/layout/TopBar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

// تنظیم فونت وزیر
const vazir = Vazirmatn({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-vazir",
  display: "swap",
});

export const metadata: Metadata = {
  title: "آیس سنتر | تجهیزات صنعتی بستنی و یخچال",
  description: "فروشگاه تخصصی دستگاه بستنی‌ساز، یخ‌ساز، آبمیوه‌گیری، فریزر و یخچال صنعتی",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className={`${vazir.variable} font-vazir antialiased bg-gray-50`}>
        <TopBanner />
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}