"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProduct } from "@/lib/api";
import { CreateProductPayload } from "@/types/product";
import ProductForm from "@/components/products/ProductForm";
import Link from "next/link";
import { ChevronLeft, Database, Globe } from "lucide-react";
import api from "@/lib/axios";

export default function NewProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Detect if we're creating a local DB product
  const isLocal = searchParams.get("source") === "local";

  // ── OOPOS mutation ──
  const ooposMut = useMutation({
    mutationFn: createProduct,
    onSuccess: (result: any) => {
      qc.invalidateQueries({ queryKey: ["oopos-catalogue"] });
      const code = result?.code ?? "";
      router.push(`/products${code ? `?newCode=${encodeURIComponent(code)}` : ""}`);
    },
    onError: (e: any) => setError(e?.response?.data?.message ?? "Erreur lors de la création"),
  });

  // ── BD locale mutation ──
  const localMut = useMutation({
    mutationFn: (payload: CreateProductPayload) => {
      // Extract price robustly from any pricing mode (including manual variants)
      let price: number | undefined = payload.prices?.[0];
      let discount: number | undefined = payload.discounts?.[0];

      if (price == null && payload.sizePricing) {
        const first = Object.values(payload.sizePricing)[0];
        if (first) { price = first.price; discount = first.discount; }
      }
      if (price == null && payload.sizeMaterialPricing) {
        const firstSize = Object.values(payload.sizeMaterialPricing)[0];
        if (firstSize) price = Object.values(firstSize)[0];
      }
      // manualVariants mode — get price from first variant
      if (price == null && payload.variants && payload.variants.length > 0) {
        price = payload.variants[0].price;
        discount = payload.variants[0].discount;
      }

      return api.post("/db-viewer/local-products", {
        name: payload.name,
        code: payload.code,
        price,
        discount,
        description: payload.description,
        images: payload.images ?? [],
        categoryId: payload.categoryId,
        colors: payload.colors ?? [],
        sizes: payload.sizes ?? [],
        styles: payload.styles ?? [],
        visible: true,
        details: payload.details,
        isDetailsEnabled: payload.isDetailsEnabled,
        manualVariants: payload.manualVariants,
        variants: payload.variants,
        items: payload.items,
        sizePricing: payload.sizePricing,
        sizeMaterialPricing: payload.sizeMaterialPricing,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["local-products"] });
      router.push("/products?tab=local");
    },
    onError: (e: any) => setError(e?.response?.data?.message ?? "Erreur lors de la création"),
  });

  const handleSubmit = async (data: CreateProductPayload) => {
    setError(null);
    try {
      if (isLocal) {
        await localMut.mutateAsync(data);
      } else {
        await ooposMut.mutateAsync(data);
      }
    } catch {
      // error handled by onError callbacks
    }
  };

  const isPending = isLocal ? localMut.isPending : ooposMut.isPending;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/products" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <div className="flex items-center gap-2">
          {isLocal ? (
            <Database size={18} className="text-violet-500" />
          ) : (
            <Globe size={18} className="text-amber-500" />
          )}
          <h1 className="text-2xl font-bold text-gray-900">
            {isLocal ? "Nouveau produit — BD locale" : "Nouveau produit — OOPOS"}
          </h1>
        </div>
      </div>

      {isLocal && (
        <div className="bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 text-sm text-violet-700">
          Ce produit sera enregistré dans la <strong>base de données locale (PostgreSQL)</strong> et sera visible sur le site web.
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <ProductForm onSubmit={handleSubmit} loading={isPending} />
    </div>
  );
}
