import { Suspense } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ScrollToTop from "@/components/layout/ScrollToTop";
import Analytics from "@/components/analytics/GoogleAnalytics";
import VisitTracker from "@/components/analytics/VisitTracker";
import AuthWrapper from "@/components/auth/AuthWrapper";
import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/cart/CartDrawer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import SupportChatWidget from "@/components/chat/SupportChatWidget";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <AuthWrapper>
        <CartProvider>
          <Suspense fallback={null}>
            <ScrollToTop />
          </Suspense>
          <Suspense fallback={<div className="h-16 md:h-20 bg-white" />}>
            <Header />
          </Suspense>
          <main className="min-h-screen pb-16 md:pb-0">
            {children}
          </main>
          <Footer />
          <Suspense fallback={null}>
            <CartDrawer />
          </Suspense>
          <Suspense fallback={null}>
            <SupportChatWidget />
          </Suspense>
          <Suspense fallback={<div className="md:hidden h-16 fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200" />}>
            <MobileBottomNav />
          </Suspense>
          <Analytics />
          <Suspense fallback={null}>
            <VisitTracker />
          </Suspense>
        </CartProvider>
      </AuthWrapper>
    </Suspense>
  );
}
