"use client";

import { useState, useCallback } from "react";
import { CreateBlogPayload, Blog } from "@/types/blog";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import ImageUploader from "@/components/ui/ImageUploader";
import Button from "@/components/ui/Button";

// Helper to generate slug (matches backend logic)
const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

interface BlogFormProps {
  initial?: Blog;
  onSubmit: (data: CreateBlogPayload) => Promise<void>;
  loading?: boolean;
}

export default function BlogForm({ initial, onSubmit, loading }: BlogFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugCustomized, setSlugCustomized] = useState(!!initial?.slug);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [image, setImage] = useState(initial?.image ?? "");
  const [author, setAuthor] = useState(initial?.author ?? "");
  const [error, setError] = useState("");

  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle);
    // Auto-generate slug from title if user hasn't customized it
    if (!slugCustomized) {
      setSlug(generateSlug(newTitle));
    }
  }, [slugCustomized]);

  const handleSlugChange = (newSlug: string) => {
    setSlug(newSlug);
    setSlugCustomized(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim() || !description.trim() || !content.trim()) {
      setError("Le titre, la description et le contenu sont obligatoires");
      return;
    }

    try {
      await onSubmit({
        title,
        slug: slug || undefined, // Only send slug if it's set, let backend auto-generate if empty
        description,
        content,
        image: typeof image === "string" ? image : "",
        author,
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

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Titre *</label>
        <Input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Titre du blog"
          required
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Slug <span className="text-gray-500 text-xs">(optionnel - auto-généré depuis le titre)</span>
        </label>
        <Input
          value={slug}
          onChange={(e) => handleSlugChange(e.target.value)}
          placeholder="slug-du-blog"
        />
        {slug && (
          <p className="text-xs text-gray-500 mt-1">
            Accessible à <code className="bg-gray-100 px-1 rounded">http://localhost:3005/blog/{slug}</code>
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description courte du blog"
          rows={2}
          required
        />
      </div>

      {/* Content */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Contenu *</label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Contenu complet du blog"
          rows={8}
          required
        />
      </div>

      {/* Author */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Auteur</label>
        <Input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Nom de l'auteur"
        />
      </div>

      {/* Image */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
        <ImageUploader 
          value={image} 
          onChange={(val) => setImage(typeof val === "string" ? val : val[0] || "")}
          label="Image de couverture"
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
          {loading ? "Traitement..." : initial ? "Mettre à jour" : "Créer le blog"}
        </Button>
      </div>
    </form>
  );
}
