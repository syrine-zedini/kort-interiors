"use client";

import { useState, useCallback } from "react";
import { CreateHeroSlidePayload, HeroSlide } from "@/types/heroSlide";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import ImageUploader from "@/components/ui/ImageUploader";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";

interface HeroSlideFormProps {
  initial?: HeroSlide;
  onSubmit: (data: CreateHeroSlidePayload) => Promise<void>;
  loading?: boolean;
}

const fontOptions = [
  { value: "", label: "Police par défaut" },
  { value: "var(--bd-ff-body)", label: "Sora" },
  { value: "'Playfair Display', serif", label: "Playfair Display" },
  { value: "'Montserrat', sans-serif", label: "Montserrat" },
  { value: "'Inter', sans-serif", label: "Inter" },
  { value: "'Georgia', serif", label: "Georgia" },
  { value: "'Courier New', monospace", label: "Courier New" }
];

const weightOptions = [
  { value: "", label: "Graisse par défaut" },
  { value: "100", label: "Ultra Light (100)" },
  { value: "200", label: "Extra Light (200)" },
  { value: "300", label: "Light (300)" },
  { value: "400", label: "Regular (400)" },
  { value: "500", label: "Medium (500)" },
  { value: "600", label: "Semi Bold (600)" },
  { value: "700", label: "Bold (700)" },
];

export default function HeroSlideForm({ initial, onSubmit, loading }: HeroSlideFormProps) {
  const [eyebrow, setEyebrow] = useState(initial?.eyebrow ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "");
  const [bg, setBg] = useState(initial?.bg ?? "");
  const [cta, setCta] = useState(initial?.cta ?? "");
  const [ctaLink, setCtaLink] = useState(initial?.ctaLink ?? "");
  const [image, setImage] = useState(initial?.image ?? "");
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [eyebrowColor, setEyebrowColor] = useState(initial?.eyebrowColor ?? "");
  const [eyebrowFont, setEyebrowFont] = useState(initial?.eyebrowFont ?? "");
  const [eyebrowWeight, setEyebrowWeight] = useState(initial?.eyebrowWeight ?? "");
  const [titleColor, setTitleColor] = useState(initial?.titleColor ?? "");
  const [titleFont, setTitleFont] = useState(initial?.titleFont ?? "");
  const [titleWeight, setTitleWeight] = useState(initial?.titleWeight ?? "");
  const [subtitleColor, setSubtitleColor] = useState(initial?.subtitleColor ?? "");
  const [subtitleFont, setSubtitleFont] = useState(initial?.subtitleFont ?? "");
  const [subtitleWeight, setSubtitleWeight] = useState(initial?.subtitleWeight ?? "");
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
        eyebrowColor: eyebrowColor || "",
        eyebrowFont: eyebrowFont || "",
        eyebrowWeight: eyebrowWeight || "",
        titleColor: titleColor || "",
        titleFont: titleFont || "",
        titleWeight: titleWeight || "",
        subtitleColor: subtitleColor || "",
        subtitleFont: subtitleFont || "",
        subtitleWeight: subtitleWeight || "",
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
      <div className="space-y-3 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Couleur</label>
            <div className="flex gap-1">
              <Input
                type="color"
                value={eyebrowColor || "#ffffff"}
                onChange={(e) => setEyebrowColor(e.target.value)}
                className="w-10 h-9 p-1"
              />
              <Input
                value={eyebrowColor}
                onChange={(e) => setEyebrowColor(e.target.value)}
                placeholder="#ffffff"
                className="flex-1 text-xs"
              />
            </div>
          </div>
          <Select
            options={fontOptions}
            value={eyebrowFont}
            onChange={(e) => setEyebrowFont(e.target.value)}
            label="Police"
            className="text-xs"
          />
          <Select
            options={weightOptions}
            value={eyebrowWeight}
            onChange={(e) => setEyebrowWeight(e.target.value)}
            label="Graisse"
            className="text-xs"
          />
        </div>
      </div>

      {/* Title */}
      <div className="space-y-3 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Titre *</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre principal du slide"
            required
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Couleur</label>
            <div className="flex gap-1">
              <Input
                type="color"
                value={titleColor || "#ffffff"}
                onChange={(e) => setTitleColor(e.target.value)}
                className="w-10 h-9 p-1"
              />
              <Input
                value={titleColor}
                onChange={(e) => setTitleColor(e.target.value)}
                placeholder="#ffffff"
                className="flex-1 text-xs"
              />
            </div>
          </div>
          <Select
            options={fontOptions}
            value={titleFont}
            onChange={(e) => setTitleFont(e.target.value)}
            label="Police"
            className="text-xs"
          />
          <Select
            options={weightOptions}
            value={titleWeight}
            onChange={(e) => setTitleWeight(e.target.value)}
            label="Graisse"
            className="text-xs"
          />
        </div>
      </div>

      {/* Subtitle */}
      <div className="space-y-3 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Couleur</label>
            <div className="flex gap-1">
              <Input
                type="color"
                value={subtitleColor || "#ffffff"}
                onChange={(e) => setSubtitleColor(e.target.value)}
                className="w-10 h-9 p-1"
              />
              <Input
                value={subtitleColor}
                onChange={(e) => setSubtitleColor(e.target.value)}
                placeholder="#ffffff"
                className="flex-1 text-xs"
              />
            </div>
          </div>
          <Select
            options={fontOptions}
            value={subtitleFont}
            onChange={(e) => setSubtitleFont(e.target.value)}
            label="Police"
            className="text-xs"
          />
          <Select
            options={weightOptions}
            value={subtitleWeight}
            onChange={(e) => setSubtitleWeight(e.target.value)}
            label="Graisse"
            className="text-xs"
          />
        </div>
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
