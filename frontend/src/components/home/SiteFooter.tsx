import Image from "next/image";
import Link from "next/link";
import { useCategories } from "@/hooks/useCategories";

const footerLinks: Record<string, string[]> = {
  "Informations": ["À propos",  "Nos boutiques"],
  //"Service client": ["Nous contacter"],
  //"Légal": ["Mentions légales", "Confidentialité", "CGV", "Cookies"],
};

function getFooterHref(label: string) {
  switch (label) {
    case "À propos":
      return "/a-propos";
    case "Nos boutiques":
      return "/nos-boutiques";
    default:
      return "#";
  }
}

function IconInstagram() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}
function IconPinterest() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.372 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
    </svg>
  );
}
function IconYoutube() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconFacebook() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2H15a6 6 0 0 0-6 6v4h-2v4h2v8h4v-8h3l1-4h-4V8a2 2 0 0 1 2-2h2z" />
    </svg>
  );
}



export default function SiteFooter() {
  const year = new Date().getFullYear();
  const { categories } = useCategories();

  const footerCategories = categories.slice(0, 6);
  const footerSubCategories = categories
    .flatMap((cat) => cat.children.map((child) => ({ ...child, parentId: cat.id })))
    .slice(0, 6);

  return (
    <footer style={{ background: "#111", color: "#fff" }}>
      {/* Main footer */}
      <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "80px 40px 60px" }}>
        <div className="footer-grid">
          {/* Brand column */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
                <Image
                  src="/assets/logo.jpg" alt="Kort Interiors"
                  width={38} height={38}
                  style={{ objectFit: "cover", width: "100%", height: "100%" }}
                />
              </div>
              <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "4px", textTransform: "uppercase" }}>
                Kort Interiors
              </span>
            </div>

            <p style={{ fontSize: "13px", lineHeight: 1.9, color: "rgba(255,255,255,0.4)", maxWidth: "220px", margin: "0 0 28px" }}>
              Art de vivre · Linge de maison d&apos;exception, inspiré par l&apos;élégance contemporaine.
            </p>

          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([section, items]) => (
            <div key={section}>
              <h4 style={{
                fontSize: "9px", letterSpacing: "3px", textTransform: "uppercase",
                color: "rgba(255,255,255,0.35)", margin: "0 0 24px", fontWeight: 400,
              }}>
                {section}
              </h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
                {items.map((item) => (
                  <li key={item}>
                    <Link href={getFooterHref(item)} style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", textDecoration: "none" }} className="footer-link">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 style={{
              fontSize: "9px", letterSpacing: "3px", textTransform: "uppercase",
              color: "rgba(255,255,255,0.35)", margin: "0 0 24px", fontWeight: 400,
            }}>
              Catégories
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
              {footerCategories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/products/${category.slug ?? category.id}`}
                    style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", textDecoration: "none" }}
                    className="footer-link"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 style={{
              fontSize: "9px", letterSpacing: "3px", textTransform: "uppercase",
              color: "rgba(255,255,255,0.35)", margin: "0 0 24px", fontWeight: 400,
            }}>
              Sous-catégories
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
              {footerSubCategories.map((subCategory) => (
                <li key={subCategory.id}>
                  <Link
                    href={`/products/${subCategory.slug ?? subCategory.id}`}
                    style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", textDecoration: "none" }}
                    className="footer-link"
                  >
                    {subCategory.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "24px 40px" }}>
        <div style={{ maxWidth: "1440px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.22)", margin: 0 }}>
            &copy; {year} Kort Interiors. Tous droits réservés.
          </p>
          <div style={{ display: "flex", gap: "32px", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "16px" }}>
              <a href="https://www.instagram.com/kort.interiors/" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,255,255,0.5)", transition: "color 0.2s", textDecoration: "none" }} className="footer-social">
                <IconInstagram />
              </a>
              <a href="https://www.facebook.com/kort.interiors/" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,255,255,0.5)", transition: "color 0.2s", textDecoration: "none" }} className="footer-social">
                <IconFacebook />
              </a>
            </div>
            <div style={{ display: "flex", gap: "24px" }}>
              {["Mentions légales", "Cookies", "CGV"].map((l) => (
                <a key={l} href="#" style={{ fontSize: "11px", color: "rgba(255,255,255,0.22)", textDecoration: "none" }} className="footer-link">
                  {l}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .footer-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr 1fr;
          gap: 48px;
          align-items: start;
        }
        .footer-social:hover { color: rgba(255,255,255,0.85) !important; }
        .footer-link:hover { color: rgba(255,255,255,1) !important; }
        @media (max-width: 900px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 560px) {
          .footer-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </footer>
  );
}
