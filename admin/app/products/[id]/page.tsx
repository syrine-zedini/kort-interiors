"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchProduct, updateProduct } from "@/lib/api";
import { CreateProductPayload } from "@/types/product";
import ProductForm from "@/components/products/ProductForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function EditProductPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProduct(id),
  });

  const mut = useMutation({
    mutationFn: (data: CreateProductPayload) => updateProduct(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["product", id] });
      router.push("/products");
    },
    onError: (e: any) => setError(e?.response?.data?.message ?? "Erreur lors de la mise à jour"),
  });

  if (isLoading) return <div className="text-gray-400 text-sm p-10 text-center">Chargement…</div>;
  if (!product)  return <div className="text-red-500 text-sm p-10 text-center">Produit introuvable.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/products" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Modifier — {product.name}</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <ProductForm initial={product} onSubmit={async (data) => { setError(null); await mut.mutateAsync(data); }} loading={mut.isPending} />
    </div>
  );
}
