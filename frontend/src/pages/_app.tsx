import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
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
          <Component {...pageProps} />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
