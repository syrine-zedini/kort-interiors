import { useEffect, useState } from "react";

export default function PromoModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Show only once per session
    const hasShown = sessionStorage.getItem("kort_promo_shown");
    if (!hasShown) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500); // 1.5s delay
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    sessionStorage.setItem("kort_promo_shown", "true");
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="promo-overlay" onClick={handleClose}>
      <div className="promo-card" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="promo-close" onClick={handleClose} aria-label="Fermer">
          ✕
        </button>

        {/* Top Image Banner */}
        <div className="promo-banner">
          <img
            src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=800&auto=format&fit=crop"
            alt="Kort Interiors Collection"
          />
        </div>

        {/* Content */}
        <div className="promo-body">
          <span className="promo-eyebrow">BIENVENUE !</span>
          <h2 className="promo-title">Découvrez notre nouvelle collection d'intérieur</h2>
          <p className="promo-desc">
            Des designs raffinés et des matériaux d'exception pour sublimer chaque espace de votre maison. Profitez de nos nouveautés exclusives dès aujourd'hui.
          </p>

          <a href="/products" className="promo-cta" onClick={handleClose}>
            Découvrez
          </a>
        </div>
      </div>

      <style jsx>{`
        .promo-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background-color: rgba(14, 12, 10, 0.6);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .promo-card {
          position: relative;
          background-color: #fff;
          width: 100%;
          max-width: 500px;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          animation: scaleUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .promo-close {
          position: absolute;
          top: 16px;
          right: 16px;
          z-index: 10;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.9);
          border: none;
          color: #0e0c0a;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .promo-close:hover {
          background-color: #fff;
          transform: scale(1.1);
        }

        .promo-banner {
          width: 100%;
          height: 220px;
          overflow: hidden;
        }

        .promo-banner img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 8s ease;
        }

        .promo-card:hover .promo-banner img {
          transform: scale(1.05);
        }

        .promo-body {
          padding: 32px 32px 36px;
          text-align: center;
        }

        .promo-eyebrow {
          font-family: 'Outfit', sans-serif;
          font-size: 11px;
          font-weight: 600;
          color: #c9a96e;
          letter-spacing: 4px;
          text-transform: uppercase;
          display: block;
          margin-bottom: 12px;
        }

        .promo-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(24px, 4vw, 30px);
          font-weight: 400;
          color: #0e0c0a;
          line-height: 1.25;
          margin: 0 0 16px;
        }

        .promo-desc {
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
          font-weight: 300;
          line-height: 1.6;
          color: #7a7065;
          margin: 0 0 28px;
        }

        .promo-cta {
          display: inline-block;
          background-color: #0e0c0a;
          color: #fff;
          font-family: 'Outfit', sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 2px;
          text-transform: uppercase;
          text-decoration: none;
          padding: 14px 36px;
          border-radius: 30px;
          transition: all 0.3s ease;
          border: 1px solid #0e0c0a;
        }

        .promo-cta:hover {
          background-color: #c9a96e;
          border-color: #c9a96e;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(201, 169, 110, 0.3);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleUp {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
