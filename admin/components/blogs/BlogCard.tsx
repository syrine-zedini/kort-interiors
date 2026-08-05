"use client";

import { Blog } from "@/types/blog";
import { Pencil, Trash2, ImageOff } from "lucide-react";
import Link from "next/link";

const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";

interface BlogCardProps {
  blog: Blog;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export default function BlogCard({ blog, onDelete, isDeleting }: BlogCardProps) {
  const handleDelete = () => {
    if (confirm("Supprimer ce blog ? Cette action est irréversible.")) {
      onDelete(blog.id);
    }
  };

  const FRONTEND_BASE = process.env.NEXT_PUBLIC_FRONTEND_URL ?? "http://localhost:3005";

  // Images from backend uploads start with /public/
  // Images from frontend static assets start with /blog/ or similar
  const imageUrl = blog.image
    ? blog.image.startsWith("http")
      ? blog.image
      : blog.image.startsWith("/public")
      ? `${IMAGE_BASE}${blog.image}`
      : `${FRONTEND_BASE}${blog.image}`
    : null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="w-full h-48 bg-gray-100 overflow-hidden flex items-center justify-center">
        {imageUrl ? (
          <img src={imageUrl} alt={blog.title} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <ImageOff size={40} />
            <span className="text-sm mt-2">Pas d'image</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 line-clamp-2">{blog.title}</h3>
        <p className="text-sm text-gray-500 mt-2 line-clamp-2">{blog.description}</p>
        
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div className="text-xs text-gray-400">
            {new Date(blog.createdAt).toLocaleDateString("fr-FR")}
          </div>
          <div className="flex gap-2">
            <Link href={`/blog/${blog.id}`}>
              <button className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors">
                <Pencil size={16} />
              </button>
            </Link>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors disabled:opacity-50"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
