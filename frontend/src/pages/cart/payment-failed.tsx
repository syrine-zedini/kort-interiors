import { useRouter } from "next/router";
import Link from "next/link";
import LuxuryNavbar from "@/components/home/LuxuryNavbar";

export default function PaymentFailed() {
  const router = useRouter();
  const { reason } = router.query;

  const getErrorMessage = () => {
    switch (reason) {
      case "declined":
        return "Votre carte bancaire a été refusée. Veuillez vérifier les informations et réessayer.";
      case "expired":
        return "Votre session de paiement a expiré. Veuillez recommencer le processus.";
      case "cancelled":
        return "Vous avez annulé le paiement. Vous pouvez réessayer quand vous êtes prêt.";
      case "invalid":
        return "Les informations de paiement sont invalides. Veuillez vérifier et réessayer.";
      default:
        return "Le paiement n'a pas pu être traité. Veuillez vérifier vos informations et réessayer.";
    }
  };

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
            {/* Error icon */}
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "#ffebee",
              marginBottom: 28,
            }}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
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
              Paiement Échoué
            </h1>

            {/* Description */}
            <p style={{
              fontSize: 15,
              color: "#666",
              margin: "0 0 12px",
              lineHeight: 1.6,
            }}>
              Désolé, une erreur s'est produite lors du traitement de votre paiement.
            </p>

            <p style={{
              fontSize: 14,
              color: "#999",
              margin: "0 0 32px",
              lineHeight: 1.5,
            }}>
              {getErrorMessage()}
            </p>

            {/* Tips section */}
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
                Que pouvez-vous faire ?
              </h3>
              <ul style={{
                margin: 0,
                paddingLeft: 20,
                fontSize: 13,
                color: "#555",
                lineHeight: 1.8,
              }}>
                <li>Vérifiez les informations de votre carte bancaire</li>
                <li>Assurez-vous que votre compte a suffisamment de fonds</li>
                <li>Essayez un autre moyen de paiement</li>
                <li>Contactez votre banque en cas de doute</li>
              </ul>
            </div>

            {/* Buttons */}
            <div style={{
              display: "flex",
              gap: 12,
              flexDirection: "column",
            }}>
              <Link href="/cart" style={{
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
                RÉESSAYER LE PAIEMENT
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
                RETOURNER À L'ACCUEIL
              </Link>
            </div>

            {/* Contact support */}
            <p style={{
              fontSize: 12,
              color: "#999",
              margin: "28px 0 0",
            }}>
              Vous avez besoin d'aide ?{" "}
              <Link href="/contact" style={{
                color: "#1a1a1a",
                textDecoration: "underline",
                cursor: "pointer",
              }}>
                Contactez-nous
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
