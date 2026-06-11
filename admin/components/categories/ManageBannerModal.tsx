import { useState, useRef } from "react";
import { X, Image as ImageIcon, UploadCloud } from "lucide-react";
import { CategoryNode, uploadImages } from "@/lib/api";
import Button from "@/components/ui/Button";

interface Props {
  category: CategoryNode;
  onClose: () => void;
  onSave: (bannerPath: string | null) => Promise<void>;
}

export default function ManageBannerModal({ category, onClose, onSave }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    try {
      const paths = await uploadImages([file]);
      if (paths && paths.length > 0) {
        await onSave(paths[0]);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Erreur lors de l'upload");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    setError(null);
    try {
      await onSave(null);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <ImageIcon size={18} className="text-amber-500" />
              Bannière de catégorie
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {category.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4">
          {category.banner ? (
            <div className="space-y-3">
              <div className="relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={`${(process.env.NEXT_PUBLIC_API_URL || '').replace("/api/v1", "")}${category.banner}`}
                  alt="Bannière"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="danger" onClick={handleRemove} loading={loading} disabled={loading}>
                  Supprimer
                </Button>
                <Button onClick={() => fileInputRef.current?.click()} loading={loading} disabled={loading}>
                  Remplacer
                </Button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 hover:border-amber-400 transition-colors"
            >
              <UploadCloud size={32} className="text-gray-400 mb-3" />
              <p className="text-sm font-medium text-gray-700">Cliquez pour uploader</p>
              <p className="text-xs text-gray-500 mt-1">Image JPG, PNG, WEBP (max 5Mo)</p>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUpload}
            className="hidden"
            accept="image/*"
          />

          {error && <p className="text-xs text-red-500 text-center">{error}</p>}
        </div>
      </div>
    </div>
  );
}
