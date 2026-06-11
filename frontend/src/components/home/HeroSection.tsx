import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/pagination";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useCategories } from "../../hooks/useCategories";
import { useQuery } from "@tanstack/react-query";
import { fetchHeroSlides, HeroSlide } from "../../libs/api";
import { resolveApiBase } from "../../libs/apiBase";

// Fallback slides in case API fails
const fallbackSlides: HeroSlide[] = [
  {
    id: "1",
    bg: "#0e0d0c",
    eyebrow: "Nouvelle Collection",
    title: "L'art du\nlinge de maison",
    subtitle: "Des matières nobles, des couleurs intemporelles.",
    cta: "Découvrir la collection",
    image: "/assets/imgs/products/article_1.jpg",
    sortOrder: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    bg: "#111418",
    eyebrow: "Savoir-Faire",
    title: "L'élégance\nau naturel",
    subtitle: "Coton égyptien, lin lavé, satin de soie.",
    cta: "Explorer",
    image: "/assets/imgs/products/article_6.jpg",
    sortOrder: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    bg: "#12100f",
    eyebrow: "Art de Vivre",
    title: "Votre maison\ncomme refuge",
    subtitle: "Transformez chaque espace en havre de paix.",
    cta: "Voir les produits",
    image: "/assets/imgs/products/article_10.jpg",
    sortOrder: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const backendImages = [
  "/assets/imgs/products/article_1.jpg",
  "/assets/imgs/products/article_6.jpg",
  "/assets/imgs/products/article_10.jpg",
];

/* Variantes pour la séquence de texte hero */
const heroContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.13, delayChildren: 0.2 } },
};
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const heroItem = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.85, ease: EASE } },
};
const heroLine = {
  hidden: { scaleX: 0 },
  visible: { scaleX: 1, transition: { duration: 1.0, ease: EASE } },
};

export default function HeroSection() {
  const { categories } = useCategories();
  const [activeIndex, setActiveIndex] = useState(0);
  const [slideKey, setSlideKey] = useState(0);
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);

  // Fetch hero slides from API
  const { data: apiSlides = [] } = useQuery({
    queryKey: ["heroSlides"],
    queryFn: fetchHeroSlides,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Use API slides or fallback to default slides
  const slides = apiSlides.length > 0 ? apiSlides : fallbackSlides;

  const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";

  // Format image URL to include API base if needed
  const getImageUrl = (slide: HeroSlide, fallbackIndex: number): string => {
    // Check for falsy values including string 'null' and 'undefined'
    if (!slide.image || slide.image === "null" || slide.image === "undefined" || slide.image.trim() === "") {
      return backendImages[fallbackIndex % backendImages.length];
    }
    
    // If it's a frontend static asset (starts with /assets/), return as is
    if (slide.image.startsWith('/assets/')) {
      return slide.image;
    }

    // If image starts with http, it's absolute
    if (slide.image.startsWith('http')) {
      return slide.image;
    }
    // If image starts with /, prepend IMAGE_BASE
    if (slide.image.startsWith('/')) {
      return `${IMAGE_BASE}${slide.image}`;
    }
    // Otherwise, assume it's a relative path from public
    return `${IMAGE_BASE}/public/${slide.image}`;
  };

  // Get button link - use ctaLink if available, otherwise use category link
  const getButtonLink = (slide: HeroSlide): string => {
    if (slide.ctaLink && slide.ctaLink !== "null" && slide.ctaLink !== "undefined") {
      return slide.ctaLink;
    }
    // Fallback to category link
    const categoryIndex1 = activeIndex * 2;
    const firstLink = categories[categoryIndex1]
      ? `/products/${categories[categoryIndex1]?.slug ?? categories[categoryIndex1]?.id}`
      : "/products";
    return firstLink;
  };

  return (
    <section style={{ position: "relative", height: "100vh", overflow: "hidden" }}>
      <Swiper
        modules={[Autoplay, Pagination, EffectFade]}
        effect="fade"
        autoplay={slides.length > 1 ? { delay: 6000, disableOnInteraction: false } : false}
        loop={slides.length > 1}
        pagination={slides.length > 1 ? { clickable: true } : false}
        style={{ height: "100%" }}
        className="hero-swiper"
        onSwiper={setSwiperInstance}
        onActiveIndexChange={(swiper) => {
          setActiveIndex(swiper.realIndex);
          setSlideKey((k) => k + 1);
        }}
      >
        {slides.map((slide, i) => (
          <SwiperSlide key={slide.id}>
            <div style={{
              position: "relative", height: "100vh",
              background: slide.bg,
              paddingTop: "68px",
            }}>
              {/* Background image */}
              <img
                src={getImageUrl(slide, i)}
                alt=""
                style={{
                  position: "absolute", inset: 0,
                  width: "100%", height: "100%",
                  objectFit: "cover", opacity: 0.45,
                  filter: "grayscale(10%)",
                }}
                onError={(e) => { e.currentTarget.style.opacity = "0"; }}
              />

              {/* Overlay gradient */}
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(90deg, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.28) 45%, rgba(0,0,0,0.02) 100%)",
              }} />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Texte hero — overlay absolu, réanimé à chaque changement de slide */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 10,
        display: "flex", alignItems: "center",
        paddingTop: "68px",
        pointerEvents: "none",
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={slideKey}
            className="hero-content"
            style={{
              color: "#fff",
              paddingLeft: "7vw",
              paddingRight: "40vw",
              width: "100%",
              boxSizing: "border-box",
              pointerEvents: "auto",
            }}
            variants={heroContainer}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
          >
            {/* Eyebrow */}
            <motion.div
              variants={heroItem}
              style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px" }}
            >
              <motion.span
                variants={heroLine}
                style={{
                  display: "block", width: "40px", height: "1px",
                  background: "rgba(255,255,255,0.45)",
                  transformOrigin: "left",
                }}
              />
              <p style={{
                fontSize: "9px", letterSpacing: "5px",
                textTransform: "uppercase", color: "rgba(255,255,255,0.6)",
                margin: 0,
              }}>
                {slides[activeIndex]?.eyebrow}
              </p>
            </motion.div>

            {/* Titre */}
            <motion.h1
              variants={heroItem}
              style={{
                fontSize: "clamp(36px, 5vw, 68px)",
                fontWeight: 200,
                letterSpacing: "-1px",
                lineHeight: 1.08,
                margin: "0 0 22px",
                whiteSpace: "pre-line",
                color: "#ffffff",
                textShadow: "0 1px 8px rgba(0,0,0,0.3)",
              }}
            >
              {slides[activeIndex]?.title}
            </motion.h1>

            {/* Sous-titre */}
            <motion.p
              variants={heroItem}
              style={{
                fontSize: "11px", fontWeight: 300,
                letterSpacing: "2.5px",
                margin: "0 0 40px",
                color: "rgba(255,255,255,0.5)",
                textTransform: "uppercase",
              }}
            >
              {slides[activeIndex]?.subtitle}
            </motion.p>

            {/* Boutons */}
            <motion.div variants={heroItem} style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Link
                href={getButtonLink(slides[activeIndex])}
                style={{
                  display: "inline-block",
                  padding: "14px 40px",
                  background: "#fff",
                  color: "#000",
                  textDecoration: "none",
                  fontSize: "9px",
                  letterSpacing: "3px",
                  textTransform: "uppercase",
                  fontWeight: 500,
                }}
                className="hero-btn-primary"
              >
                {slides[activeIndex]?.cta}
              </Link>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Custom navigation arrows */}
      {slides.length > 1 && swiperInstance && (
        <>
          <button
            onClick={() => swiperInstance.slidePrev()}
            style={{
              position: "absolute",
              left: "2vw",
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 15,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "rgba(255, 255, 255, 0.4)",
              padding: "16px",
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            className="hero-nav-arrow"
            aria-label="Slide précédent"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="20" y1="12" x2="4" y2="12" />
              <polyline points="10 18 4 12 10 6" />
            </svg>
          </button>
          <button
            onClick={() => swiperInstance.slideNext()}
            style={{
              position: "absolute",
              right: "2vw",
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 15,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "rgba(255, 255, 255, 0.4)",
              padding: "16px",
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            className="hero-nav-arrow"
            aria-label="Slide suivant"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="12" x2="20" y2="12" />
              <polyline points="14 6 20 12 14 18" />
            </svg>
          </button>
        </>
      )}

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        style={{
          position: "absolute", bottom: "44px", right: "5vw",
          zIndex: 10, display: "flex", flexDirection: "column",
          alignItems: "center", gap: "10px",
          color: "rgba(255,255,255,0.4)",
        }}
      >
        <span style={{
          fontSize: "8px", letterSpacing: "4px", textTransform: "uppercase",
          writingMode: "vertical-rl", textOrientation: "mixed",
        }}>
          Défiler
        </span>
        <motion.div
          initial={{ scaleY: 0, originY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 1.8, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: "1px", height: "60px",
            background: "linear-gradient(to bottom, rgba(255,255,255,0.5), rgba(255,255,255,0))",
          }}
        />
      </motion.div>

      <style jsx global>{`
        .hero-swiper .swiper-pagination {
          bottom: 44px !important;
          left: 10vw !important;
          width: auto !important;
          text-align: left !important;
        }
        .hero-swiper .swiper-pagination-bullet {
          background: rgba(255,255,255,0.3) !important;
          opacity: 1 !important;
          width: 6px !important; height: 6px !important;
          border-radius: 50% !important;
          transition: all 0.3s !important;
          margin: 0 4px !important;
        }
        .hero-swiper .swiper-pagination-bullet-active {
          background: #fff !important;
          width: 32px !important;
          border-radius: 3px !important;
        }
        .hero-btn-primary:hover {
          background: rgba(255,255,255,0.88) !important;
        }
        .hero-btn-outline:hover {
          background: rgba(255,255,255,0.1) !important;
          border-color: rgba(255,255,255,0.8) !important;
        }
        .hero-nav-arrow:hover {
          color: #ffffff !important;
          transform: translateY(-50%) scale(1.1) !important;
        }
        @media (max-width: 1024px) {
          .hero-content { padding-right: 8vw !important; }
        }
        @media (max-width: 768px) {
          .hero-nav-arrow {
            display: none !important;
          }
        }
      `}</style>
    </section>
  );
}
