import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { ClientSideLayout } from "../../../layouts/client-side";
import Loader from "../../../layouts/client-side/loader";
import api from "@/libs/axios";
import { ProductWithVariants } from "@/types/product";
import { ProductDetails } from "@/components/products/productDetails";

export default function ProductInCategoryPage() {
  const router = useRouter();
  const { categorySlug, productSlug } = router.query;

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<ProductWithVariants | null>(null);

  useEffect(() => {
    if (!productSlug || Array.isArray(productSlug)) return;

    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setProduct(null);
      try {
        const res = await api.get<ProductWithVariants>(`/products/${productSlug}`, {
          params: { _t: Date.now() },
        });
        if (!cancelled) setProduct(res.data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [productSlug]);

  if (!productSlug || Array.isArray(productSlug) || loading) return <Loader />;

  if (!product) {
    return (
      <ClientSideLayout isNavbarOn={true}>
        <div style={{ paddingTop: 88, background: "#fff", minHeight: "100vh" }}>
          <div style={{ borderTop: "1px solid #ece8e2" }}>
            <div style={{ padding: "80px 24px", textAlign: "center", color: "#999" }}>
              Produit introuvable.
            </div>
          </div>
        </div>
      </ClientSideLayout>
    );
  }

  const categorySlugStr = Array.isArray(categorySlug) ? categorySlug[0] : categorySlug;

  // Read variant selection from URL query parameters
  const qColor = typeof router.query.color === "string" ? router.query.color : undefined;
  const qSize = typeof router.query.size === "string" ? router.query.size : undefined;

  return (
    <ClientSideLayout isNavbarOn={true}>
      <div style={{ paddingTop: 88, background: "#fff", minHeight: "100vh" }}>
        <div style={{ borderTop: "1px solid #ece8e2" }}>
          <ProductDetails
            product={product}
            categorySlug={categorySlugStr}
            initialColor={qColor}
            initialSize={qSize}
          />
        </div>
      </div>
    </ClientSideLayout>
  );
}

