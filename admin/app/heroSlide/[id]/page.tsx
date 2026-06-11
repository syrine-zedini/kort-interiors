"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchHeroSlide, updateHeroSlide } from "@/lib/api";
import { CreateHeroSlidePayload } from "@/types/heroSlide";
import HeroSlideForm from "@/components/heroSlide/HeroSlideForm";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function EditHeroSlidePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { id } = params;

  const { data: slide, isLoading } = useQuery({
    queryKey: ["heroSlide", id],
    queryFn: () => fetchHeroSlide(id),
  });

  const update = useMutation({
    mutationFn: (data: CreateHeroSlidePayload) => updateHeroSlide(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["heroSlides"] });
      qc.invalidateQueries({ queryKey: ["heroSlide", id] });
      router.push("/heroSlide");
    },
  });

  const handleSubmit = async (data: CreateHeroSlidePayload) => {
    update.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/heroSlide" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft size={20} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chargement...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (!slide) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/heroSlide" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft size={20} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Slide non trouvé</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/heroSlide" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Modifier le slide</h1>
          <p className="text-sm text-gray-500 mt-0.5">{slide.title}</p>
        </div>
      </div>

      {/* Form */}
      <HeroSlideForm initial={slide} onSubmit={handleSubmit} loading={update.isPending} />

      {update.isError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {(update.error as any)?.message || "Une erreur est survenue lors de la mise à jour du slide"}
        </div>
      )}
    </div>
  );
}
