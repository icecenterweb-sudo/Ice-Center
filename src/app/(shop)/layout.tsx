import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ScrollToTop from "@/components/layout/ScrollToTop";
import Analytics from "@/components/analytics/GoogleAnalytics";
import AuthWrapper from "@/components/auth/AuthWrapper";
import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/cart/CartDrawer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthWrapper>
      <CartProvider>
        <ScrollToTop />
        <Header />
        <main className="min-h-screen pb-16 md:pb-0">
          {children}
        </main>
        <Footer />
        <CartDrawer />
        <MobileBottomNav />
        <Analytics />
      </CartProvider>
    </AuthWrapper>
  );
}
