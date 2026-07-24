"use client";

import { useState, useRef, useCallback } from "react";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop, convertToPixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Upload, X, Check, Scissors, Loader2, Crop as CropIcon } from "lucide-react";
import api from "@/lib/axios";

interface ImageCropUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
}

const PRESETS = [
  { label: "800×800", w: 800, h: 800 },
  { label: "1200×900", w: 1200, h: 900 },
  { label: "600×400", w: 600, h: 400 },
  { label: "400×400", w: 400, h: 400 },
];

function centerAspectCrop(w: number, h: number) {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, w / h, w, h),
    w, h
  );
}

export default function ImageCropUploader({ value, onChange, label }: ImageCropUploaderProps) {
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [outputWidth, setOutputWidth] = useState(800);
  const [outputHeight, setOutputHeight] = useState(800);
  const [uploading, setUploading] = useState(false);
  const [showCrop, setShowCrop] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";

  const editExisting = async () => {
    if (!displaySrc) return;
    try {
      const res = await fetch(displaySrc, { mode: "cors" });
      const blob = await res.blob();
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImgSrc(reader.result?.toString() ?? "");
        setShowCrop(true);
        setCrop(undefined);
        setCompletedCrop(undefined);
      });
      reader.readAsDataURL(blob);
    } catch {
      setImgSrc(displaySrc);
      setShowCrop(true);
      setCrop(undefined);
      setCompletedCrop(undefined);
    }
  };

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setImgSrc(reader.result?.toString() ?? "");
      setShowCrop(true);
      setCrop(undefined);
      setCompletedCrop(undefined);
    });
    reader.readAsDataURL(e.target.files[0]);
    e.target.value = "";
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
    const { width: dw, height: dh } = e.currentTarget;
    const c = centerAspectCrop(w, h);
    setCrop(c);
    setCompletedCrop(convertToPixelCrop(c, dw, dh));
  };

  const applyCrop = useCallback(async () => {
    if (!imgRef.current || !completedCrop) return;
    const img = imgRef.current;
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;
    const cropW = completedCrop.width * scaleX;
    const cropH = completedCrop.height * scaleY;

    // Set the canvas size to the exact natural crop dimensions to preserve 100% native resolution
    const canvas = document.createElement("canvas");
    canvas.width = cropW;
    canvas.height = cropH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    try {
      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    } catch (err) {
      console.error("Canvas draw error (CORS)", err);
      return;
    }
    setUploading(true);
    canvas.toBlob(async (blob) => {
      if (!blob) { setUploading(false); return; }
      const fd = new FormData();
      fd.append("file", blob, "product-image.jpg");
      fd.append("type", "image");
      try {
        const { data } = await api.post("/files", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        onChange(data.data?.url ?? "");
        setShowCrop(false);
        setImgSrc("");
      } catch (err) {
        console.error("Upload failed", err);
      } finally {
        setUploading(false);
      }
    }, "image/jpeg", 0.98);
  }, [completedCrop, onChange]);

  const displaySrc = value
    ? value.startsWith("http") ? value : `${IMAGE_BASE}${value}`
    : null;

  return (
    <div className="flex flex-col gap-3">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}

      {/* Preview image actuelle */}
      {displaySrc && !showCrop && (
        <div className="flex flex-col gap-2">
          <div className="relative w-36 h-36 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 group">
            <img src={displaySrc} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={editExisting}
                className="p-1.5 bg-violet-600 rounded-lg text-white hover:bg-violet-700"
                title="Rogner l'image existante"
              >
                <CropIcon size={14} />
              </button>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="p-1.5 bg-white rounded-lg text-gray-700 hover:bg-gray-100"
                title="Remplacer par une autre image"
              >
                <Upload size={14} />
              </button>
              <button
                type="button"
                onClick={() => onChange("")}
                className="p-1.5 bg-red-500 rounded-lg text-white hover:bg-red-600"
                title="Supprimer"
              >
                <X size={14} />
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={editExisting}
            className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-800 transition self-start"
          >
            <CropIcon size={12} /> Rogner / redimensionner cette image
          </button>
        </div>
      )}

      {/* Zone de drop */}
      {!showCrop && (
        <div
          className="border-2 border-dashed border-gray-300 rounded-xl p-5 text-center cursor-pointer hover:border-violet-400 transition-colors"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.addEventListener("load", () => {
              setImgSrc(reader.result?.toString() ?? "");
              setShowCrop(true);
              setCrop(undefined);
              setCompletedCrop(undefined);
            });
            reader.readAsDataURL(file);
          }}
        >
          <Upload size={20} className="mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">{displaySrc ? "Changer l'image" : "Cliquer ou glisser une image"}</p>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onSelectFile} />
        </div>
      )}

      {/* Interface de rognage */}
      {showCrop && imgSrc && (
        <div className="space-y-4 bg-gray-50 rounded-2xl border border-violet-200 p-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Scissors size={15} className="text-violet-600" /> Rogner et redimensionner
            </p>
            <button type="button" onClick={() => { setShowCrop(false); setImgSrc(""); }} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>


          {/* Zone de rognage */}
          <div className="overflow-auto rounded-xl border border-gray-200 bg-white" style={{ maxHeight: 400 }}>
            <ReactCrop
              crop={crop}
              onChange={(_, pct) => setCrop(pct)}
              onComplete={(c) => setCompletedCrop(c)}
              minWidth={30}
              minHeight={30}
            >
              <img
                ref={imgRef}
                src={imgSrc}
                alt="crop"
                crossOrigin="anonymous"
                style={{ maxWidth: "100%", maxHeight: 400, display: "block" }}
                onLoad={onImageLoad}
              />
            </ReactCrop>
          </div>

          {/* Boutons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={applyCrop}
              disabled={!completedCrop || uploading}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition"
            >
              {uploading ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              {uploading ? "Upload en cours…" : "Appliquer et enregistrer"}
            </button>
            <button
              type="button"
              onClick={() => { setShowCrop(false); setImgSrc(""); }}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
