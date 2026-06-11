import Link from "next/link";
import { ClientSideLayout } from "@/layouts/client-side";

const boutiques = [
  {
    title: "Boutique La Marsa",
    address: "Rue du 9 avril 1938, Marsa 2070",
    phone: "54356017",
    locationCode: "V8JG+6V La Marsa",
    mapUrl: "https://maps.app.goo.gl/4xJBx4T8GBuPooF57",
  },
  {
    title: "Boutique Tunis",
    address: "V748+WRF, Rue farazdek, Tunis 2045",
    phone: "54356017",
    locationCode: "V748+WRF",
    mapUrl: "https://maps.app.goo.gl/mhjmw8vhUuQX82V4A",
  },
];

export default function NosBoutiquesPage() {
  return (
    <ClientSideLayout isNavbarOn={true}>
      <section style={{ background: "#fff", minHeight: "100vh" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "96px 40px 88px" }}>
          <p
            style={{
              fontSize: "9px",
              letterSpacing: "5px",
              textTransform: "uppercase",
              color: "#999",
              margin: "0 0 14px",
            }}
          >
            Nos boutiques
          </p>

          <h1
            style={{
              fontSize: "clamp(30px, 4vw, 52px)",
              fontWeight: 200,
              letterSpacing: "-0.5px",
              color: "#0e0d0c",
              margin: "0 0 30px",
              lineHeight: 1.1,
            }}
          >
            Retrouvez-nous en boutique
          </h1>

          <div className="boutiques-grid">
            {boutiques.map((boutique) => (
              <article key={boutique.title} className="boutique-card">
                <h2 style={{ margin: "0 0 14px", fontSize: "22px", fontWeight: 400, color: "#0e0d0c" }}>
                  {boutique.title}
                </h2>

                <p style={{ margin: "0 0 10px", color: "#5f5f5f", lineHeight: 1.8 }}>
                  {boutique.address}
                </p>

                <p style={{ margin: "0 0 10px", color: "#5f5f5f", lineHeight: 1.8 }}>
                  Tel: <a href={`tel:${boutique.phone}`} style={{ color: "#0e0d0c", textDecoration: "none" }}>{boutique.phone}</a>
                </p>

                <p style={{ margin: "0 0 20px", color: "#8b8b8b", fontSize: "13px", lineHeight: 1.7 }}>
                  {boutique.locationCode}
                </p>

                <a
                  href={boutique.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: "10px",
                    letterSpacing: "2.5px",
                    textTransform: "uppercase",
                    color: "#0e0d0c",
                    textDecoration: "none",
                    borderBottom: "1px solid #0e0d0c",
                    paddingBottom: "3px",
                  }}
                >
                  Ouvrir sur Google Maps
                </a>
              </article>
            ))}
          </div>

          <div style={{ marginTop: "28px" }}>
            <Link
              href="/a-propos"
              style={{
                fontSize: "10px",
                letterSpacing: "2.5px",
                textTransform: "uppercase",
                color: "#0e0d0c",
                textDecoration: "none",
                borderBottom: "1px solid #0e0d0c",
                paddingBottom: "3px",
              }}
            >
              En savoir plus sur nous
            </Link>
          </div>
        </div>

        <style jsx>{`
          .boutiques-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 18px;
          }
          .boutique-card {
            border: 1px solid #ece8e2;
            background: #fcfbf9;
            padding: 28px;
          }
          @media (max-width: 900px) {
            .boutiques-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </section>
    </ClientSideLayout>
  );
}
