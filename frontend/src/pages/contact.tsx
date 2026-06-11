import Link from "next/link";
import { useState } from "react";
import { ClientSideLayout } from "@/layouts/client-side";

const boutiques = [
  {
    title: "Boutique La Marsa",
    address: "Rue du 9 avril 1938, Marsa 2070",
    phone: "54356017",
  },
  {
    title: "Boutique Tunis",
    address: "V748+WRF, Rue farazdek, Tunis 2045",
    phone: "54356017",
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you can add your form submission logic (e.g., send email)
    setSubmitted(true);
    setFormData({ name: "", email: "", message: "" });
    setTimeout(() => setSubmitted(false), 3000);
  };
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
            Contact
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
            Nous contacter
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
              </article>
            ))}
          </div>

          <div style={{ marginTop: "28px" }}>
            <Link
              href="/nos-boutiques"
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
              En savoir plus sur nos boutiques
            </Link>
          </div>

          {/* Contact Form */}
          <div style={{ marginTop: "60px", maxWidth: "500px", margin: "60px auto 0" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 400, color: "#0e0d0c", marginBottom: "24px" }}>
              Envoyez-nous un message
            </h2>

            {submitted && (
              <div style={{
                padding: "14px 18px",
                backgroundColor: "#f0f8f4",
                border: "1px solid #d4edda",
                color: "#155724",
                borderRadius: "4px",
                marginBottom: "18px",
                fontSize: "13px",
              }}>
                Merci! Votre message a été envoyé avec succès.
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#666", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Nom
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Votre nom"
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #ece8e2",
                    borderRadius: "4px",
                    fontSize: "14px",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#666", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="votre@email.com"
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #ece8e2",
                    borderRadius: "4px",
                    fontSize: "14px",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#666", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  placeholder="Votre message..."
                  rows={5}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #ece8e2",
                    borderRadius: "4px",
                    fontSize: "14px",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    resize: "vertical",
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#0e0d0c",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: 500,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "opacity 0.25s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Envoyer
              </button>
            </form>
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
