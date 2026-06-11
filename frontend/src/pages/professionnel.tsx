import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ClientSideLayout } from "@/layouts/client-side";
import api from "@/libs/axios";
import { ProductWithVariants } from "@/types/product";
import { useCategories } from "@/hooks/useCategories";
import { CategoryNode } from "@/types/category";

const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";

function flattenCategories(nodes: CategoryNode[], map: Record<string, CategoryNode> = {}) {
  nodes.forEach((node) => {
    map[node.id] = node;
    if (node.children?.length) flattenCategories(node.children, map);
  });
  return map;
}

export default function ProfessionnelPage() {
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const { categories } = useCategories();

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      try {
        const res = await api.get<ProductWithVariants[]>("/products", { params: { _t: Date.now() } });
        if (!cancelled) {
          setProducts(Array.isArray(res.data) ? res.data.slice(0, 6) : []);
        }
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    };

    loadProducts();
    return () => {
      cancelled = true;
    };
  }, []);

  const categoryMap = useMemo(() => flattenCategories(categories), [categories]);

  return (
    <ClientSideLayout isNavbarOn={true}>
      <section style={{ background: "#fff", minHeight: "100vh" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "96px 40px 88px" }}>
          <p
            style={{
              fontSize: "9px",
              letterSpacing: "5px",
              textTransform: "uppercase",
              color: "#999",
              margin: "0 0 14px",
            }}
          >
            Professionnel
          </p>

          <h1
            style={{
              fontSize: "clamp(30px, 4vw, 52px)",
              fontWeight: 200,
              letterSpacing: "-0.5px",
              color: "#0e0d0c",
              margin: "0 0 28px",
              lineHeight: 1.1,
            }}
          >
            Hotellerie, restauration et projets d'interieur
          </h1>

          <div
            style={{
              border: "1px solid #ece8e2",
              padding: "32px",
              background: "#fcfbf9",
              color: "#6b6b6b",
              fontSize: "14px",
              lineHeight: 1.9,
              marginBottom: "48px",
            }}
          >
            <p style={{ margin: "0 0 14px" }}>
              Nous accompagnons les professionnels avec une offre textile premium pensee pour les usages intensifs: hotellerie,
              maisons d'hotes, restauration, architecture d'interieur et retail.
            </p>
            <p style={{ margin: "0 0 14px" }}>
              Notre selection privilegie des matieres durables et confortables, avec une exigence constante sur la tenue,
              la douceur et la facilite d'entretien afin d'optimiser le cycle de vie des produits.
            </p>
            <p style={{ margin: "0 0 14px" }}>
              Notre engagement eco-responsable se traduit par des textiles certifies, des choix de fabrication plus
              respectueux de l'environnement et une approche orientee sustainability pour reduire l'impact global.
            </p>
            <p style={{ margin: 0 }}>
              Ce contenu est evolutif: vous pourrez ajouter ici vos conditions B2B, minimums de commande, delais,
              personnalisation, et vos references clients.
            </p>
          </div>

          <div style={{ marginBottom: "32px", marginTop: "32px" }}>
            <iframe
              src="https://online.pubhtml5.com/symld/gwly/"
              style={{
                width: "100%",
                height: "700px",
                border: "1px solid #ece8e2",
                borderRadius: "4px",
              }}
              allow="fullscreen"
              loading="lazy"
              title="Hotel Catalog"
            />
          </div>
        </div>

        <style jsx global>{`
          .pro-products-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 18px;
          }
          .pro-product-card {
            border: 1px solid #ece8e2;
            background: #fff;
            transition: transform 0.25s ease, box-shadow 0.25s ease;
          }
          .pro-product-link:hover .pro-product-card {
            transform: translateY(-2px);
            box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
          }
          .pro-product-image-wrap {
            width: 100%;
            aspect-ratio: 4 / 3;
            background: #f3f1ed;
            overflow: hidden;
          }
          .pro-product-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .pro-product-fallback {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #b2ada6;
            font-size: 12px;
            letter-spacing: 1px;
            text-transform: uppercase;
          }
          @media (max-width: 980px) {
            .pro-products-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </section>
    </ClientSideLayout>
  );
}
