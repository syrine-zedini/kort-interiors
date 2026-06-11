import { useRouter } from "next/router";
import { useEffect } from "react";
import Link from "next/link";
import LuxuryNavbar from "@/components/home/LuxuryNavbar";

export default function PaymentSuccess() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect to home after 5 seconds
    const timer = setTimeout(() => {
      router.push("/");
    }, 5000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <>
      <LuxuryNavbar transparent={false} />
      <div style={{ minHeight: "100vh", background: "#f5f5f5", fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "90vh",
          padding: "40px 20px",
        }}>
          <div style={{
            background: "#fff",
            padding: "60px 40px",
            maxWidth: 560,
            width: "100%",
            textAlign: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}>
            {/* Success icon */}
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "#e8f5e9",
              marginBottom: 28,
            }}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            {/* Title */}
            <h1 style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: 36,
              fontWeight: 400,
              color: "#1a1a1a",
              margin: "0 0 16px",
              letterSpacing: 0.5,
            }}>
              Paiement Réussi
            </h1>

            {/* Description */}
            <p style={{
              fontSize: 15,
              color: "#666",
              margin: "0 0 12px",
              lineHeight: 1.6,
            }}>
              Votre paiement a été traité avec succès.
            </p>

            <p style={{
              fontSize: 14,
              color: "#999",
              margin: "0 0 32px",
              lineHeight: 1.5,
            }}>
              Vous recevrez un email de confirmation sous peu avec les détails de votre commande et le numéro de suivi.
            </p>

            {/* What's next section */}
            <div style={{
              background: "#f9f9f9",
              padding: "24px",
              marginBottom: 32,
              borderRadius: 4,
              textAlign: "left",
            }}>
              <h3 style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#1a1a1a",
                margin: "0 0 12px",
                letterSpacing: 0.8,
                textTransform: "uppercase",
              }}>
                Prochaines étapes
              </h3>
              <ul style={{
                margin: 0,
                paddingLeft: 20,
                fontSize: 13,
                color: "#555",
                lineHeight: 1.8,
              }}>
                <li>Confirmation de commande par email</li>
                <li>Préparation et emballage de votre commande</li>
                <li>Expédition avec suivi de colis</li>
              </ul>
            </div>

            {/* Buttons */}
            <div style={{
              display: "flex",
              gap: 12,
              flexDirection: "column",
            }}>
              <Link href="/orders" style={{
                display: "block",
                padding: "14px 24px",
                background: "#1a1a1a",
                color: "#fff",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 1.5,
                textAlign: "center",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#333"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#1a1a1a"; }}>
                VOIR MES COMMANDES
              </Link>

              <Link href="/" style={{
                display: "block",
                padding: "14px 24px",
                background: "#f0f0f0",
                color: "#1a1a1a",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 1.5,
                textAlign: "center",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#e0e0e0"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#f0f0f0"; }}>
                CONTINUER LES ACHATS
              </Link>
            </div>

            {/* Auto-redirect message */}
            <p style={{
              fontSize: 12,
              color: "#999",
              margin: "28px 0 0",
              fontStyle: "italic",
            }}>
              Redirection automatique vers l'accueil dans quelques secondes...
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
