import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ScrollToTop from "@/components/layout/ScrollToTop";
import Analytics from "@/components/analytics/GoogleAnalytics";
import AuthWrapper from "@/components/auth/AuthWrapper";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthWrapper>
      <ScrollToTop />
      <Header />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer />
      <Analytics />
    </AuthWrapper>
  );
}
