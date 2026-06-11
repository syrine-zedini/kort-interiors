import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { ClientSideLayout } from "../../../layouts/client-side";
import Loader from "../../../layouts/client-side/loader";
import api from "@/libs/axios";
import Products from "@/components/products";

export default function CategoryBySlugPage() {
  const router = useRouter();
  const { categorySlug } = router.query;

  const [loading, setLoading] = useState(true);
  const [categoryId, setCategoryId] = useState<string | null>(null);

  useEffect(() => {
    if (!categorySlug || Array.isArray(categorySlug)) return;

    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setCategoryId(null);
      try {
        const res = await api.get<any>(`/categories/${categorySlug}`);
        if (!cancelled) setCategoryId(res.data?.id ?? null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [categorySlug]);

  if (!categorySlug || Array.isArray(categorySlug) || loading) return <Loader />;

  if (!categoryId) {
    return (
      <ClientSideLayout isNavbarOn={true}>
        <div style={{ padding: "80px 24px", textAlign: "center", color: "#999" }}>
          Catégorie introuvable.
        </div>
      </ClientSideLayout>
    );
  }

  return (
    <ClientSideLayout isNavbarOn={true}>
      <Products categoryId={categoryId} />
    </ClientSideLayout>
  );
}

