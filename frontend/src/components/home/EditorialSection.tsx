import { FadeUp, StaggerContainer, StaggerItem } from "../ui/Animate";

const pillars = [
  {
    image: "/editorial/pillar_matieres.jpg",
    num: "01",
    label: "Matières",
    title: "Matières d'exception",
    desc: "Coton pima, lin lavé, percale de coton égyptien — chaque fibre sélectionnée pour sa douceur, sa longévité et son élégance naturelle.",
  },
  {
    image: "/editorial/pillar_qualite.jpg",
    num: "02",
    label: "Qualité",
    title: "Qualité certifiée",
    desc: "Nos textiles répondent aux normes OEKO-TEX® Standard 100. Aucune substance nocive — pour votre confort et celui de votre famille.",
  },
  {
    image: "/editorial/pillar_livraison.jpg",
    num: "03",
    label: "Livraison",
    title: "Livraison & Retours",
    desc: "Livraison offerte dès 300DT d'achat. Retours gratuits sous 30 jours. Votre satisfaction est notre engagement absolu.",
  },
];

export default function EditorialSection() {
  return (
    <section className="editorial-section">
      {/* Decorative background pattern */}
      <div className="editorial-bg-pattern" />

      <div className="editorial-inner">

        {/* Header */}
        <FadeUp className="editorial-header">
          <div className="editorial-eyebrow-wrap">
            <span className="editorial-line" />
            <p className="editorial-eyebrow">Notre engagement</p>
            <span className="editorial-line" />
          </div>
          <h2 className="editorial-title">
            L&apos;art de vivre{" "}
            <em className="editorial-title-italic">Kort</em>
          </h2>
          <p className="editorial-subtitle">
            Chaque détail conçu pour sublimer votre quotidien
          </p>
        </FadeUp>

        {/* Gold accent divider */}
        <div className="editorial-gold-divider" />

        {/* Three pillars */}
        <StaggerContainer className="pillar-grid">
          {pillars.map((p, i) => (
            <StaggerItem key={i}
              className={`pillar-col pillar-col-${i}`}
            >
              {/* Image */}
              <div className="pillar-img-wrap">
                <img src={p.image} alt={p.title} className="pillar-img" />
                <div className="pillar-img-overlay" />
                <span className="pillar-num-badge">{p.num}</span>
              </div>

              {/* Content */}
              <div className="pillar-content">
                {/* Gold accent line */}
                <div className="pillar-accent-line" />

                {/* Label */}
                <p className="pillar-label">{p.label}</p>

                {/* Title */}
                <h3 className="pillar-title">{p.title}</h3>

                {/* Desc */}
                <p className="pillar-desc">{p.desc}</p>

                {/* Hover reveal arrow */}
                <div className="pillar-arrow">
                  <svg width="20" height="8" viewBox="0 0 28 8" fill="none" stroke="currentColor" strokeWidth="1">
                    <line x1="0" y1="4" x2="24" y2="4" />
                    <polyline points="20,1 24,4 20,7" />
                  </svg>
                </div>
              </div>

            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* CTA */}
        <FadeUp className="editorial-cta-wrap">
          <a href="/products" className="editorial-cta">
            <span>Explorer tous nos produits</span>
            <span className="editorial-cta-icon">
              <svg width="32" height="10" viewBox="0 0 32 10" fill="none" stroke="currentColor" strokeWidth="1">
                <line x1="0" y1="5" x2="28" y2="5" />
                <polyline points="24,1 28,5 24,9" />
              </svg>
            </span>
          </a>
        </FadeUp>
      </div>

      <style jsx>{`
        .editorial-section {
          position: relative;
          background: linear-gradient(160deg, #f5efe5 0%, #ede4d6 50%, #f0e9dc 100%);
          overflow: hidden;
        }

        .editorial-bg-pattern {
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(circle at 15% 20%, rgba(201,169,110,0.08) 0%, transparent 50%),
            radial-gradient(circle at 85% 80%, rgba(201,169,110,0.06) 0%, transparent 50%);
          pointer-events: none;
        }

        .editorial-inner {
          position: relative;
          z-index: 1;
          max-width: 1320px;
          margin: 0 auto;
          padding: 110px 48px 100px;
        }

        /* Header */
        .editorial-header {
          text-align: center;
          margin-bottom: 56px;
        }

        .editorial-eyebrow-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 18px;
          margin-bottom: 28px;
        }

        .editorial-line {
          display: block;
          width: 48px;
          height: 1px;
          background: linear-gradient(to right, transparent, #c9a96e, transparent);
        }

        .editorial-eyebrow {
          font-family: 'Outfit', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 5px;
          text-transform: uppercase;
          color: #c9a96e;
          margin: 0;
        }

        .editorial-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(38px, 5vw, 64px);
          font-weight: 300;
          color: #0e0c0a;
          margin: 0 0 18px;
          letter-spacing: -0.5px;
          line-height: 1.05;
        }

        .editorial-title-italic {
          font-style: italic;
          font-weight: 400;
          color: #c9a96e;
        }

        .editorial-subtitle {
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
          font-weight: 300;
          letter-spacing: 1.5px;
          color: #8a7e72;
          margin: 0;
          text-transform: uppercase;
        }

        .editorial-gold-divider {
          width: 80px;
          height: 1px;
          background: linear-gradient(to right, transparent, #c9a96e, transparent);
          margin: 0 auto 72px;
        }

        /* Pillar Grid */
        :global(.pillar-grid) {
          display: grid !important;
          grid-template-columns: repeat(3, 1fr) !important;
          gap: 0 !important;
        }

        :global(.pillar-col) {
          position: relative;
          transition: transform 0.4s cubic-bezier(0.16,1,0.3,1);
        }

        :global(.pillar-col-0) {
          padding: 0 52px 0 0 !important;
          border-right: 1px solid rgba(201,169,110,0.2) !important;
        }

        :global(.pillar-col-1) {
          padding: 0 52px 0 52px !important;
          border-right: 1px solid rgba(201,169,110,0.2) !important;
        }

        :global(.pillar-col-2) {
          padding: 0 0 0 52px !important;
        }

        :global(.pillar-col:hover) {
          transform: translateY(-4px);
        }

        /* Image */
        .pillar-img-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 4/3;
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 28px;
        }

        .pillar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.7s cubic-bezier(0.16,1,0.3,1);
        }

        :global(.pillar-col:hover) .pillar-img {
          transform: scale(1.06);
        }

        .pillar-img-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent 40%, rgba(14,12,10,0.35) 100%);
          transition: opacity 0.4s ease;
        }

        :global(.pillar-col:hover) .pillar-img-overlay {
          opacity: 0.7;
        }

        .pillar-num-badge {
          position: absolute;
          top: 14px;
          left: 16px;
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 42px;
          font-weight: 300;
          color: rgba(255,255,255,0.85);
          line-height: 1;
          letter-spacing: -1px;
          text-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }

        /* Content block */
        .pillar-content {
          padding: 0;
        }

        .pillar-accent-line {
          width: 32px;
          height: 1px;
          background: linear-gradient(to right, #c9a96e, transparent);
          margin-bottom: 20px;
          transition: width 0.4s ease;
        }

        :global(.pillar-col:hover) .pillar-accent-line {
          width: 56px;
        }

        .pillar-label {
          font-family: 'Outfit', sans-serif;
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 4px;
          text-transform: uppercase;
          color: #c9a96e;
          margin: 0 0 12px;
        }

        .pillar-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 24px;
          font-weight: 400;
          color: #0e0c0a;
          margin: 0 0 16px;
          letter-spacing: 0.2px;
          line-height: 1.25;
          transition: color 0.3s;
        }

        :global(.pillar-col:hover) .pillar-title {
          color: #3a2d1f;
        }

        .pillar-desc {
          font-family: 'Outfit', sans-serif;
          font-size: 13px;
          font-weight: 300;
          line-height: 2;
          color: #7a7065;
          margin: 0 0 24px;
        }

        .pillar-arrow {
          color: #c9a96e;
          opacity: 0;
          transform: translateX(-8px);
          transition: opacity 0.3s, transform 0.3s;
        }

        :global(.pillar-col:hover) .pillar-arrow {
          opacity: 1;
          transform: translateX(0);
        }

        /* CTA */
        .editorial-cta-wrap {
          margin-top: 72px;
          padding-top: 56px;
          border-top: 1px solid rgba(201,169,110,0.2);
          display: flex;
          justify-content: center;
        }

        .editorial-cta {
          display: inline-flex;
          align-items: center;
          gap: 16px;
          font-family: 'Outfit', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 5px;
          text-transform: uppercase;
          color: #0e0c0a;
          text-decoration: none;
          padding-bottom: 4px;
          position: relative;
          transition: color 0.3s;
        }

        .editorial-cta::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 1px;
          background: linear-gradient(to right, #c9a96e, #0e0c0a);
          transform-origin: left;
          transition: transform 0.4s cubic-bezier(0.16,1,0.3,1);
        }

        .editorial-cta:hover { color: #c9a96e; }

        .editorial-cta:hover::after {
          background: linear-gradient(to right, #c9a96e, #c9a96e);
        }

        .editorial-cta-icon {
          transition: transform 0.3s;
        }
        .editorial-cta:hover .editorial-cta-icon {
          transform: translateX(6px);
        }

        /* Mobile */
        @media (max-width: 900px) {
          .editorial-inner { padding: 60px 16px 50px; }
          :global(.pillar-grid) {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 12px !important;
          }
          :global(.pillar-col-0), :global(.pillar-col-1), :global(.pillar-col-2) {
            border-right: none !important;
            padding: 0 !important;
            margin-right: 0 !important;
            margin-bottom: 0 !important;
          }
          :global(.pillar-col-0) {
            border-right: 1px solid rgba(201,169,110,0.15) !important;
            padding-right: 10px !important;
          }
          :global(.pillar-col-1) {
            border-right: 1px solid rgba(201,169,110,0.15) !important;
            padding-left: 10px !important;
            padding-right: 10px !important;
          }
          :global(.pillar-col-2) {
            padding-left: 10px !important;
          }
          .pillar-title {
            font-size: 16px;
            word-wrap: break-word;
          }
          .pillar-desc {
            font-size: 11px;
            line-height: 1.6;
          }
          .pillar-num {
            font-size: 32px;
          }
          .pillar-label {
            font-size: 8px;
            letter-spacing: 2px;
          }
        }

        @media (max-width: 600px) {
          .editorial-title { font-size: 32px; }
          .editorial-cta { font-size: 9px; letter-spacing: 2px; }
          :global(.pillar-grid) {
            gap: 8px !important;
          }
          :global(.pillar-col-0) {
            padding-right: 8px !important;
          }
          :global(.pillar-col-1) {
            padding-left: 8px !important;
            padding-right: 8px !important;
          }
          :global(.pillar-col-2) {
            padding-left: 8px !important;
          }
          .pillar-title {
            font-size: 13px;
          }
          .pillar-desc {
            font-size: 10px;
          }
        }
      `}</style>
    </section>
  );
}
