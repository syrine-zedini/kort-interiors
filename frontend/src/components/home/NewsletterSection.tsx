import { useState } from "react";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) setSubmitted(true);
  };

  return (
    <section style={{ background: "#1a1a1a", padding: "112px 40px" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>

        <p style={{
          fontSize: "10px", letterSpacing: "4px", textTransform: "uppercase",
          color: "rgba(255,255,255,0.4)", margin: "0 0 20px",
        }}>
          Restez connecté
        </p>

        <h2 style={{
          fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 300,
          color: "#fff", letterSpacing: "0.5px", margin: "0 0 20px",
        }}>
          La newsletter Kort
        </h2>

        <p style={{
          fontSize: "14px", lineHeight: 1.8,
          color: "rgba(255,255,255,0.45)",
          margin: "0 0 56px",
        }}>
          Recevez en avant-première nos nouvelles collections,<br />
          offres exclusives et inspirations déco.
        </p>

        {submitted ? (
          <div style={{
            padding: "24px 40px",
            border: "1px solid rgba(255,255,255,0.2)",
            display: "inline-block",
          }}>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", letterSpacing: "1px", margin: 0 }}>
              Merci ! Vous êtes inscrit(e) à notre newsletter.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: "flex", maxWidth: "460px", margin: "0 auto" }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Votre adresse e-mail"
                required
                style={{
                  flex: 1, padding: "16px 20px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRight: "none", color: "#fff",
                  fontSize: "13px", letterSpacing: "0.3px",
                  outline: "none",
                }}
                className="newsletter-input"
              />
              <button
                type="submit"
                style={{
                  padding: "16px 32px",
                  background: "#fff", color: "#000",
                  border: "none", fontSize: "9px",
                  letterSpacing: "3px", textTransform: "uppercase",
                  cursor: "pointer", whiteSpace: "nowrap",
                  transition: "opacity 0.2s",
                  fontWeight: 500,
                }}
                className="newsletter-btn"
              >
                S&apos;inscrire
              </button>
            </div>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", margin: "16px 0 0" }}>
              En vous inscrivant, vous acceptez de recevoir nos communications. Désinscription possible à tout moment.
            </p>
          </form>
        )}
      </div>

      <style jsx>{`
        .newsletter-input:focus {
          border-color: rgba(255,255,255,0.4) !important;
          background: rgba(255,255,255,0.08) !important;
        }
        .newsletter-input::placeholder { color: rgba(255,255,255,0.3); }
        .newsletter-btn:hover { opacity: 0.75 !important; }
      `}</style>
    </section>
  );
}
