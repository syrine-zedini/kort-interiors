"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createHeroSlide } from "@/lib/api";
import { CreateHeroSlidePayload } from "@/types/heroSlide";
import HeroSlideForm from "@/components/heroSlide/HeroSlideForm";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function NewHeroSlidePage() {
  const router = useRouter();
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: createHeroSlide,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["heroSlides"] });
      router.push("/heroSlide");
    },
  });

  const handleSubmit = async (data: CreateHeroSlidePayload) => {
    create.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/heroSlide" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouveau slide</h1>
          <p className="text-sm text-gray-500 mt-0.5">Créer un nouveau slide héroïque</p>
        </div>
      </div>

      {/* Form */}
      <HeroSlideForm onSubmit={handleSubmit} loading={create.isPending} />

      {create.isError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {(create.error as any)?.message || "Une erreur est survenue lors de la création du slide"}
        </div>
      )}
    </div>
  );
}
