"use client";

import { useEffect, useState } from "react";
import { Save, Eye, EyeOff } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import ImageUploader from "@/components/ui/ImageUploader";
import api from "@/lib/axios";

interface PromoModalSettings {
  id: string;
  enabled: boolean;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  ctaText: string;
  ctaLink: string;
}

const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";

export default function PromoModalPage() {
  const [settings, setSettings] = useState<PromoModalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    api.get("/promo-modal")
      .then((r) => setSettings(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await api.put("/promo-modal", settings);
      if (res.status === 200) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const resolveImage = (img: string) => {
    if (!img) return "";
    if (img.startsWith("http")) return img;
    if (img.startsWith("/")) return `${IMAGE_BASE}${img}`;
    return `${IMAGE_BASE}/${img}`;
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-gray-400">Chargement...</div>
  );

  if (!settings) return (
    <div className="text-center py-24 text-red-500">Impossible de charger les paramètres.</div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pop-up de Bienvenue</h1>
          <p className="text-sm text-gray-500 mt-0.5">Personnaliser le pop-up d'accueil du site</p>
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            onClick={() => setPreview(!preview)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            {preview ? <EyeOff size={16} /> : <Eye size={16} />}
            {preview ? "Masquer aperçu" : "Aperçu"}
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Save size={16} />
            {saving ? "Enregistrement..." : saved ? "✓ Enregistré !" : "Enregistrer"}
          </Button>
        </div>
      </div>

      <div className={`grid gap-6 ${preview ? "grid-cols-2" : "grid-cols-1"}`}>
        {/* Form */}
        <div className="space-y-6 bg-white rounded-2xl border border-gray-200 p-6">
          {/* Active toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <p className="font-medium text-gray-800">Pop-up activé</p>
              <p className="text-sm text-gray-500 mt-0.5">Afficher ou masquer le pop-up sur le site</p>
            </div>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                settings.enabled ? "bg-emerald-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  settings.enabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Eyebrow */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Texte au-dessus du titre</label>
            <Input
              value={settings.eyebrow}
              onChange={(e) => setSettings({ ...settings, eyebrow: e.target.value })}
              placeholder="ex: BIENVENUE !"
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Titre principal</label>
            <Input
              value={settings.title}
              onChange={(e) => setSettings({ ...settings, title: e.target.value })}
              placeholder="ex: Découvrez notre nouvelle collection"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <Textarea
              value={settings.description}
              onChange={(e) => setSettings({ ...settings, description: e.target.value })}
              placeholder="Texte descriptif sous le titre..."
              rows={3}
            />
          </div>

          {/* CTA Text only */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Texte du bouton</label>
            <Input
              value={settings.ctaText}
              onChange={(e) => setSettings({ ...settings, ctaText: e.target.value })}
              placeholder="ex: Découvrez"
            />
          </div>

          {/* Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Image de la bannière</label>
            <ImageUploader
              value={settings.image}
              onChange={(val) => setSettings({ ...settings, image: typeof val === "string" ? val : val[0] || "" })}
              label="Image du pop-up"
              multiple={false}
            />
            {settings.image && (
              <p className="text-xs text-gray-400 mt-1 truncate">
                URL actuelle : {settings.image}
              </p>
            )}
          </div>
        </div>

        {/* Live Preview */}
        {preview && (
          <div className="relative bg-gray-900 rounded-2xl overflow-hidden flex items-center justify-center" style={{ minHeight: 500 }}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div className="relative bg-white rounded-2xl overflow-hidden shadow-2xl w-full max-w-sm mx-4">
              {/* Banner image */}
              <div className="w-full h-48 overflow-hidden">
                <img
                  src={resolveImage(settings.image)}
                  alt="preview"
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200'%3E%3Crect fill='%23f0ece6' width='400' height='200'/%3E%3Ctext fill='%23bbb' font-family='sans-serif' font-size='14' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3EImage%3C/text%3E%3C/svg%3E"; }}
                />
              </div>
              {/* Content */}
              <div className="p-6 text-center">
                <span className="text-xs font-semibold tracking-widest text-amber-600 uppercase block mb-2">
                  {settings.eyebrow || "BIENVENUE !"}
                </span>
                <h3 className="text-xl font-light text-gray-900 mb-3 leading-snug">
                  {settings.title || "Titre du pop-up"}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-5">
                  {settings.description || "Description..."}
                </p>
                <div className="inline-block bg-gray-900 text-white text-xs font-medium tracking-widest uppercase px-8 py-3 rounded-full">
                  {settings.ctaText || "Découvrez"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
