"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchHeroSlides, deleteHeroSlide } from "@/lib/api";
import { HeroSlide } from "@/types/heroSlide";
import Link from "next/link";
import { Plus, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { useState } from "react";

export default function HeroSlidePage() {
  const qc = useQueryClient();
  const { data: slides = [], isLoading } = useQuery<HeroSlide[]>({
    queryKey: ["heroSlides"],
    queryFn: fetchHeroSlides,
  });

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;

  // Pagination
  const totalPages = Math.ceil(slides.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedSlides = slides.slice(startIndex, endIndex);

  const del = useMutation({
    mutationFn: deleteHeroSlide,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["heroSlides"] });
      setDeletingId(null);
    },
  });

  const confirmDelete = (id: string) => {
    setDeletingId(id);
    del.mutate(id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hero Slides</h1>
          <p className="text-sm text-gray-500 mt-0.5">{slides.length} slide{slides.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/heroSlide/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus size={16} /> Nouveau slide
          </Button>
        </Link>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Chargement des slides...</p>
        </div>
      ) : slides.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Aucun slide trouvé</p>
          <Link href="/heroSlide/new">
            <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700">
              <Plus size={16} /> Créer un slide
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedSlides.map((slide) => (
            <div
              key={slide.id}
              className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between hover:border-gray-300 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  {slide.bg && (
                    <div
                      className="w-12 h-12 rounded-lg border border-gray-200 flex-shrink-0"
                      style={{ backgroundColor: slide.bg }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{slide.title}</p>
                    <div className="flex gap-2 text-xs text-gray-500 mt-0.5">
                      {slide.eyebrow && <span className="truncate">Surtitre: {slide.eyebrow}</span>}
                      <span className="flex-shrink-0">Ordre: {slide.sortOrder}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                <Link href={`/heroSlide/${slide.id}`}>
                  <Button size="sm" variant="secondary" className="text-gray-600">
                    Modifier
                  </Button>
                </Link>
                <button
                  onClick={() => confirmDelete(slide.id)}
                  disabled={deletingId === slide.id}
                  className="p-2 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {slides.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Affichage {startIndex + 1}-{Math.min(endIndex, slides.length)} sur {slides.length}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Page précédente"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page
                      ? "bg-emerald-600 text-white"
                      : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Page suivante"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
