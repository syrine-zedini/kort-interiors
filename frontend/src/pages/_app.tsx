import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import Script from "next/script";
import { useRouter } from "next/router";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";

const queryClient = new QueryClient();

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || "G-72R4RHN63F";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Track page views on Next.js client-side route changes
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (typeof window !== "undefined" && (window as any).gtag && GA_MEASUREMENT_ID) {
        (window as any).gtag("config", GA_MEASUREMENT_ID, {
          page_path: url,
        });
      }
    };
    router.events.on("routeChangeComplete", handleRouteChange);
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events]);

  useEffect(() => {
    // Non-blocking light function to apply native lazy loading
    const applyLazyLoading = () => {
      const images = document.getElementsByTagName("img");
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (!img.getAttribute("loading")) {
          img.setAttribute("loading", "lazy");
        }
      }
    };

    // Run safely after render cycle
    const timeoutId = setTimeout(applyLazyLoading, 100);

    // Also apply when user scrolls or interacts to capture dynamically loaded images
    window.addEventListener("scroll", applyLazyLoading, { passive: true });
    window.addEventListener("click", applyLazyLoading, { passive: true });

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("scroll", applyLazyLoading);
      window.removeEventListener("click", applyLazyLoading);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <Head>
            <title>Kort Interiors</title>
          </Head>

          {/* Google Analytics GA4 */}
          {GA_MEASUREMENT_ID && (
            <>
              <Script
                strategy="afterInteractive"
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              />
              <Script
                id="google-analytics"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                  __html: `
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${GA_MEASUREMENT_ID}', {
                      page_path: window.location.pathname,
                    });
                  `,
                }}
              />
            </>
          )}

          <Component {...pageProps} />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
