import { FadeUp, StaggerContainer, StaggerItem } from "../ui/Animate";

const pillars = [
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#1a1a1a" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="20,2 38,12 38,28 20,38 2,28 2,12" />
        <polygon points="20,11 29,16.5 29,23.5 20,29 11,23.5 11,16.5" />
      </svg>
    ),
    num: "01",
    label: "Matières",
    title: "Matières d'exception",
    desc: "Coton pima, lin lavé, percale de coton égyptien — chaque fibre sélectionnée pour sa douceur, sa longévité et son élégance naturelle.",
  },
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#1a1a1a" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="20" cy="20" r="17" />
        <circle cx="20" cy="20" r="10" />
        <circle cx="20" cy="20" r="2" fill="#1a1a1a" />
        <line x1="20" y1="3" x2="20" y2="9" />
        <line x1="20" y1="31" x2="20" y2="37" />
        <line x1="3" y1="20" x2="9" y2="20" />
        <line x1="31" y1="20" x2="37" y2="20" />
      </svg>
    ),
    num: "02",
    label: "Qualité",
    title: "Qualité certifiée",
    desc: "Nos textiles répondent aux normes OEKO-TEX® Standard 100. Aucune substance nocive — pour votre confort et celui de votre famille.",
  },
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#1a1a1a" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="16" width="32" height="20" rx="1" />
        <path d="M12 16 L12 10 C12 6 28 6 28 10 L28 16" />
        <line x1="4" y1="24" x2="36" y2="24" />
        <line x1="20" y1="24" x2="20" y2="36" />
      </svg>
    ),
    num: "03",
    label: "Livraison",
    title: "Livraison & Retours",
    desc: "Livraison offerte dès 300DT d'achat. Retours gratuits sous 30 jours. Votre satisfaction est notre engagement absolu.",
  },
];

export default function EditorialSection() {
  return (
    <section style={{ background: "#f5f0e8" }}>
      <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "96px 40px" }}>

        {/* En-tête */}
        <FadeUp style={{ marginBottom: "80px" }}>
          <p style={{
            fontSize: "9px", letterSpacing: "5px", textTransform: "uppercase",
            color: "#999", margin: "0 0 14px",
          }}>
            Notre engagement
          </p>
          <h2 style={{
            fontSize: "clamp(28px, 3.5vw, 44px)", fontWeight: 200,
            color: "#0e0d0c", margin: 0, letterSpacing: "-0.5px",
          }}>
            L&apos;art de vivre Kort
          </h2>
        </FadeUp>

        {/* Trois colonnes */}
        <StaggerContainer style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "0",
        }}
          className="pillar-grid"
        >
          {pillars.map((p, i) => (
            <StaggerItem
              key={i}
              className="pillar-col"
              style={{
                padding: "0 48px 0 0",
                borderRight: "1px solid rgba(14,13,12,0.12)",
                marginRight: "48px",
              }}
            >
              {/* Numéro + icône côte à côte */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "20px", marginBottom: "36px" }}>
                <span style={{
                  fontSize: "11px", fontWeight: 300,
                  letterSpacing: "2px", color: "#bbb",
                  paddingTop: "3px", minWidth: "24px",
                }}>
                  {p.num}
                </span>
                {p.icon}
              </div>

              {/* Label */}
              <p style={{
                fontSize: "8px", letterSpacing: "4px", textTransform: "uppercase",
                color: "#999", margin: "0 0 14px",
              }}>
                {p.label}
              </p>

              <h3 style={{
                fontSize: "20px", fontWeight: 400, color: "#0e0d0c",
                margin: "0 0 18px", letterSpacing: "0.2px",
              }}>
                {p.title}
              </h3>

              <p style={{
                fontSize: "13px", lineHeight: 2.0, color: "#6b6b6b",
              }}>
                {p.desc}
              </p>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Ligne de séparation + CTA */}
        <div style={{
          marginTop: "80px", paddingTop: "56px",
          borderTop: "1px solid rgba(14,13,12,0.1)",
          display: "flex", justifyContent: "center",
        }}>
          <a
            href="/products"
            className="pillar-cta"
            style={{
              display: "inline-flex", alignItems: "center", gap: "16px",
              fontSize: "9px", letterSpacing: "4px", textTransform: "uppercase",
              color: "#0e0d0c", textDecoration: "none",
              paddingBottom: "3px", borderBottom: "1px solid #0e0d0c",
              transition: "opacity 0.2s",
            }}
          >
            Explorer tous nos produits
            <svg width="28" height="8" viewBox="0 0 28 8" fill="none" stroke="currentColor" strokeWidth="1">
              <line x1="0" y1="4" x2="24" y2="4" />
              <polyline points="20,1 24,4 20,7" />
            </svg>
          </a>
        </div>
      </div>

      <style jsx>{`
        .pillar-cta:hover { opacity: 0.45; }
        .pillar-col:last-child {
          border-right: none !important;
          margin-right: 0 !important;
          padding-right: 0 !important;
        }
        @media (max-width: 800px) {
          .pillar-grid { gap: 48px !important; }
          .pillar-col {
            border-right: none !important;
            border-bottom: 1px solid rgba(14,13,12,0.1) !important;
            padding-right: 0 !important;
            margin-right: 0 !important;
            padding-bottom: 48px !important;
          }
          .pillar-col:last-child { border-bottom: none !important; padding-bottom: 0 !important; }
        }
      `}</style>
    </section>
  );
}
