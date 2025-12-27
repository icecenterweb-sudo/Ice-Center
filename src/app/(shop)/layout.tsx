import type { Metadata } from "next";
import localFont from "next/font/local";
import "./../globals.css";
import { Toaster } from "react-hot-toast";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ScrollToTop from "@/components/layout/ScrollToTop";
import Analytics from "@/components/analytics/GoogleAnalytics";

const yekan = localFont({
  src: [
    {
      path: "./../fonts/YekanBakhFamily/webfonts/woff2/YekanBakh-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "./../fonts/YekanBakhFamily/webfonts/woff2/YekanBakh-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./../fonts/YekanBakhFamily/webfonts/woff2/YekanBakh-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "./../fonts/YekanBakhFamily/webfonts/woff2/YekanBakh-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "./../fonts/YekanBakhFamily/webfonts/woff2/YekanBakh-Black.woff2",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-yekan",
  display: "swap",
});

export const metadata: Metadata = {
  title: "آیس سنتر | تجهیزات صنعتی بستنی و یخچال",
  description: "فروشگاه تخصصی دستگاه بستنی‌ساز، یخ‌ساز، آبمیوه‌گیری، فریزر و یخچال صنعتی",
};

export default function ShopLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className={`${yekan.variable} font-yekan antialiased bg-gray-50`}>
        <ScrollToTop />
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
        <Toaster position="bottom-left" />
        <Analytics />
      </body>
    </html>
  );
}