"use client";

import { useEffect, useState } from "react";
import { Save, Play, Image as ImageIcon, Film } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ImageUploader from "@/components/ui/ImageUploader";
import api from "@/lib/axios";

interface VideoSettings {
  id: string;
  eyebrow: string;
  title: string;
  poster: string;
  video: string;
}

const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL ?? "http://localhost:3005";

export default function VideoSectionPage() {
  const [settings, setSettings] = useState<VideoSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get("/video-section")
      .then((res) => setSettings(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await api.put("/video-section", settings);
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

  const resolveUrl = (pathStr: string) => {
    if (!pathStr) return "";
    if (pathStr.startsWith("http")) return pathStr;
    // /videos/ files are served by the frontend static server
    if (pathStr.startsWith("/videos/")) return `${FRONTEND_URL}${pathStr}`;
    // /public/ files are uploaded to the backend
    return `${IMAGE_BASE}${pathStr}`;
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
          <h1 className="text-2xl font-bold text-gray-900">Section Vidéo d'Accueil</h1>
          <p className="text-sm text-gray-500 mt-0.5">Personnaliser la vidéo de la page d'accueil</p>
        </div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Editor Form */}
        <div className="space-y-6 bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3">Contenu Textuel</h2>
          
          {/* Eyebrow */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Petit texte du haut (Surtitre)</label>
            <Input
              value={settings.eyebrow}
              onChange={(e) => setSettings({ ...settings, eyebrow: e.target.value })}
              placeholder="ex: L'univers Kort"
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Titre principal</label>
            <Input
              value={settings.title}
              onChange={(e) => setSettings({ ...settings, title: e.target.value })}
              placeholder="ex: Créer votre havre de paix"
            />
          </div>

          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pt-4 pb-3">Médias</h2>

          {/* Poster Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Image de couverture (Poster)</label>
            <ImageUploader
              value={settings.poster}
              onChange={(val) => setSettings({ ...settings, poster: typeof val === "string" ? val : val[0] || "" })}
              label="Image de couverture (poster.png)"
              multiple={false}
            />
            {settings.poster && (
              <p className="text-xs text-gray-400 mt-1 truncate">
                Lien : {settings.poster}
              </p>
            )}
          </div>

          {/* Video file */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fichier Vidéo (MP4)</label>
            <ImageUploader
              value={settings.video}
              onChange={(val) => setSettings({ ...settings, video: typeof val === "string" ? val : val[0] || "" })}
              label="Sélectionner une vidéo MP4"
              multiple={false}
              accept="video/mp4,video/webm,video/*"
              hint="Un fichier MP4 (max 50 Mo)"
            />
            {settings.video && (
              <p className="text-xs text-gray-400 mt-1 truncate">
                Lien : {settings.video}
              </p>
            )}
          </div>
        </div>

        {/* Live Preview / Player */}
        <div className="space-y-6 bg-white rounded-2xl border border-gray-200 p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3">Aperçu en direct</h2>
            
            <div className="mt-6 text-center">
              <span className="text-[10px] font-medium tracking-[5px] uppercase text-amber-600 block mb-3">
                {settings.eyebrow || "L'univers Kort"}
              </span>
              <h3 className="font-serif font-light text-2xl text-gray-900 mb-6">
                {settings.title || "Titre de la section"}
              </h3>
            </div>

            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black shadow-inner flex items-center justify-center">
              {settings.video ? (
                <video
                  key={settings.video + settings.poster}
                  src={resolveUrl(settings.video)}
                  poster={resolveUrl(settings.poster)}
                  controls
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-500">
                  <Film size={40} className="stroke-1 mb-2" />
                  <span className="text-sm">Pas de vidéo sélectionnée</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 mt-6">
            <h4 className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-1">💡 Recommandation</h4>
            <p className="text-xs text-amber-700 leading-relaxed">
              Pour des performances optimales sur le site mobile et web, nous vous conseillons d'utiliser des vidéos compressées (idéalement moins de 10 Mo) et au format MP4.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
