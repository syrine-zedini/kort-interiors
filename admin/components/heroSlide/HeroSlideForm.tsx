"use client";

import { useState, useCallback } from "react";
import { CreateHeroSlidePayload, HeroSlide } from "@/types/heroSlide";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import ImageUploader from "@/components/ui/ImageUploader";
import Button from "@/components/ui/Button";

interface HeroSlideFormProps {
  initial?: HeroSlide;
  onSubmit: (data: CreateHeroSlidePayload) => Promise<void>;
  loading?: boolean;
}

export default function HeroSlideForm({ initial, onSubmit, loading }: HeroSlideFormProps) {
  const [eyebrow, setEyebrow] = useState(initial?.eyebrow ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "");
  const [bg, setBg] = useState(initial?.bg ?? "");
  const [cta, setCta] = useState(initial?.cta ?? "");
  const [ctaLink, setCtaLink] = useState(initial?.ctaLink ?? "");
  const [image, setImage] = useState(initial?.image ?? "");
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Le titre est obligatoire");
      return;
    }

    try {
      await onSubmit({
        eyebrow: eyebrow || undefined,
        title,
        subtitle: subtitle || undefined,
        bg: bg || undefined,
        cta: cta || undefined,
        ctaLink: ctaLink || undefined,
        image: typeof image === "string" ? image : "",
        sortOrder: sortOrder || undefined,
      });
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-2xl border border-gray-200 p-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Eyebrow */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Surtitre <span className="text-gray-500 text-xs">(optionnel)</span>
        </label>
        <Input
          value={eyebrow}
          onChange={(e) => setEyebrow(e.target.value)}
          placeholder="e.g., Nouvelle Collection"
        />
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Titre *</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre principal du slide"
          required
        />
      </div>

      {/* Subtitle */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sous-titre <span className="text-gray-500 text-xs">(optionnel)</span>
        </label>
        <Textarea
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Description du slide"
          rows={2}
        />
      </div>

      {/* Background Color */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Couleur de fond <span className="text-gray-500 text-xs">(optionnel)</span>
          </label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={bg || "#000000"}
              onChange={(e) => setBg(e.target.value)}
              className="w-14 h-10 p-1"
            />
            <Input
              value={bg}
              onChange={(e) => setBg(e.target.value)}
              placeholder="#0e0d0c"
              className="flex-1"
            />
          </div>
        </div>

        {/* Sort Order */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ordre d'affichage <span className="text-gray-500 text-xs">(optionnel)</span>
          </label>
          <Input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
            placeholder="0"
          />
        </div>
      </div>

      {/* CTA Button Text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Texte du bouton CTA <span className="text-gray-500 text-xs">(optionnel)</span>
        </label>
        <Input
          value={cta}
          onChange={(e) => setCta(e.target.value)}
          placeholder="e.g., Découvrir la collection"
        />
      </div>

      {/* CTA Button Link */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          URL du bouton CTA <span className="text-gray-500 text-xs">(optionnel)</span>
        </label>
        <Input
          value={ctaLink}
          onChange={(e) => setCtaLink(e.target.value)}
          placeholder="e.g., /products, /blog, https://example.com"
        />
        <p className="text-xs text-gray-500 mt-1">Relatif (/products) ou absolu (https://example.com)</p>
      </div>

      {/* Image */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Image de fond <span className="text-gray-500 text-xs">(optionnel)</span>
        </label>
        <ImageUploader
          value={image}
          onChange={(val) => setImage(typeof val === "string" ? val : val[0] || "")}
          label="Image du slide"
          multiple={false}
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
        <Button
          type="submit"
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {loading ? "Traitement..." : initial ? "Mettre à jour" : "Créer le slide"}
        </Button>
      </div>
    </form>
  );
}
