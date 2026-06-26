"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProduct } from "@/lib/api";
import { CreateProductPayload } from "@/types/product";
import ProductForm from "@/components/products/ProductForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function NewProductPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: createProduct,
    onSuccess: (result: any) => {
      qc.invalidateQueries({ queryKey: ["oopos-catalogue"] });
      const code = result?.code ?? "";
      router.push(`/products${code ? `?newCode=${encodeURIComponent(code)}` : ""}`);
    },
    onError: (e: any) => setError(e?.response?.data?.message ?? "Erreur lors de la création"),
  });

  const handleSubmit = async (data: CreateProductPayload) => {
    setError(null);
    try {
      await mut.mutateAsync(data);
    } catch {
      // error is handled by onError callback above
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/products" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nouveau produit</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <ProductForm onSubmit={handleSubmit} loading={mut.isPending} />
    </div>
  );
}
