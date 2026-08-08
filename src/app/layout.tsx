import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const yekan = localFont({
    src: [
        {
            path: "./fonts/YekanBakhFamily/webfonts/woff2/YekanBakh-Regular.woff2",
            weight: "400",
            style: "normal",
        },
        {
            path: "./fonts/YekanBakhFamily/webfonts/woff2/YekanBakh-SemiBold.woff2",
            weight: "600",
            style: "normal",
        },
        {
            path: "./fonts/YekanBakhFamily/webfonts/woff2/YekanBakh-Bold.woff2",
            weight: "700",
            style: "normal",
        },
    ],
    variable: "--font-yekan",
    display: "swap",
});

import { getSiteSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
    const settings = await getSiteSettings();
    return {
        title: `${settings.siteTitle} | ${settings.siteSlogan}`,
        description: settings.aboutText,
        icons: settings.faviconUrl ? { icon: settings.faviconUrl } : undefined,
        openGraph: {
            title: `${settings.siteTitle} | ${settings.siteSlogan}`,
            description: settings.aboutText,
            type: "website",
            siteName: settings.siteTitle,
            locale: "fa_IR",
        },
        twitter: {
            card: "summary_large_image",
            title: `${settings.siteTitle} | ${settings.siteSlogan}`,
            description: settings.aboutText,
        },
    };
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="fa" dir="rtl">
            <body className={`${yekan.variable} font-yekan antialiased`}>
                <a
                    href="#main-content"
                    className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:right-4 focus:z-[200] focus:bg-white focus:text-midnight focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:font-bold focus:text-sm"
                >
                    رفتن به محتوا
                </a>
                {children}
                <Toaster position="bottom-center" />
                <Analytics />
                <SpeedInsights />
            </body>
        </html>
    );
}

