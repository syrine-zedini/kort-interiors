import Link from "next/link";

interface Props {
  main_category: string;
  parent_category?: string;
  parent_category_id?: string;
  isChild: boolean;
  productCount?: number;
  banner_image?: string;
}

export default function Header({ main_category, parent_category, parent_category_id, isChild, productCount, banner_image }: Props) {
  return (
    <div style={{ paddingTop: "88px", background: "#fff" }}>
      {/* Fil d'Ariane */}
      <div style={{ padding: "16px 40px 0", display: "flex", alignItems: "center", gap: "6px" }}>
        <Link href="/" style={{ fontSize: "11px", color: "#888", textDecoration: "none" }} className="breadcrumb-link">
          Accueil
        </Link>
        {isChild && parent_category && (
          <>
            <span style={{ fontSize: "11px", color: "#ccc" }}>›</span>
            <Link
              href={parent_category_id ? `/products/${parent_category_id}` : "#"}
              style={{ fontSize: "11px", color: "#888", textDecoration: "none" }}
              className="breadcrumb-link"
            >
              {parent_category}
            </Link>
          </>
        )}
        <span style={{ fontSize: "11px", color: "#ccc" }}>›</span>
        <span style={{ fontSize: "11px", color: "#444" }}>{main_category}</span>
      </div>

      {/* Titre + count */}
      <div style={{ textAlign: "center", padding: "32px 40px 28px" }}>
        <h1 style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: "clamp(28px, 4vw, 44px)",
          fontWeight: 400,
          letterSpacing: "-0.5px",
          color: "#1a1a1a",
          margin: "0 0 8px",
        }}>
          {main_category}
        </h1>
        {productCount !== undefined && (
          <p style={{ fontSize: "12px", color: "#999", margin: 0 }}>
            {productCount} article{productCount !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {banner_image && (
        <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "0 40px 40px" }}>
          <div style={{
            position: "relative",
            width: "100%",
            height: "400px",
            backgroundImage: `url(${(process.env.NEXT_PUBLIC_API_URL || '').replace('/api/v1', '')}${banner_image})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            borderRadius: "8px",
          }} />
        </div>
      )}

      <style jsx global>{`
        .breadcrumb-link:hover { color: #1a1a1a !important; }
      `}</style>
    </div>
  );
}
