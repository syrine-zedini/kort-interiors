"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, Film } from "lucide-react";
import { uploadImages } from "@/lib/api";

interface ImageUploaderProps {
  value?: string[] | string;
  onChange: (paths: string[] | string) => void;
  label?: string;
  multiple?: boolean;
  accept?: string; // e.g. "video/mp4,video/*" for video uploads
  hint?: string;   // e.g. "Un fichier MP4"
}

export default function ImageUploader({
  value,
  onChange,
  label,
  multiple = true,
  accept = "image/*",
  hint,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";
  const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL ?? "http://localhost:3005";

  const resolveSrc = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    if (path.startsWith("/videos/")) return `${FRONTEND_URL}${path}`;
    return `${IMAGE_BASE}${path}`;
  };

  // Normalize value to always be an array for internal handling
  const imageArray = Array.isArray(value) ? value : (value ? [value] : []);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const paths = await uploadImages(Array.from(files));
      const newPaths = multiple ? [...imageArray, ...paths] : paths;
      onChange(multiple ? newPaths : newPaths[0] || "");
    } catch (e) {
      console.error("Upload failed", e);
    } finally {
      setUploading(false);
    }
  };

  const remove = (path: string) => {
    const updated = imageArray.filter((p) => p !== path);
    onChange(multiple ? updated : (updated[0] || ""));
  };

  const isVideo = (path: string) =>
    path.endsWith(".mp4") || path.endsWith(".webm") || path.endsWith(".mov");

  const defaultHint = multiple ? "Plusieurs fichiers acceptés" : accept.includes("video") ? "Un fichier vidéo" : "Une image";

  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}

      {/* Dropzone */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-amber-500 transition-colors"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <Loader2 size={24} className="animate-spin" />
            <span className="text-sm">Téléchargement…</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-400">
            {accept.includes("video") ? <Film size={24} /> : <Upload size={24} />}
            <span className="text-sm">Glisser-déposer ou cliquer pour choisir</span>
            <span className="text-xs">{hint ?? defaultHint}</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Preview grid */}
      {imageArray.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mt-1">
          {imageArray.map((path) => {
            const src = resolveSrc(path);
            return (
              <div key={path} className="relative group rounded-lg overflow-hidden aspect-square bg-gray-100">
                {isVideo(path) ? (
                  <video
                    src={src}
                    className="w-full h-full object-cover"
                    muted
                    preload="metadata"
                  />
                ) : (
                  <img src={src} alt="" className="w-full h-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => remove(path)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
