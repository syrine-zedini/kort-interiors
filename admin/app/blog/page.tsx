"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchBlogs, deleteBlog } from "@/lib/api";
import { Blog } from "@/types/blog";
import Link from "next/link";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import Button from "@/components/ui/Button";
import BlogCard from "@/components/blogs/BlogCard";
import { useState } from "react";

export default function BlogPage() {
  const qc = useQueryClient();
  const { data: blogs = [], isLoading } = useQuery<Blog[]>({
    queryKey: ["blogs"],
    queryFn: fetchBlogs,
  });

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;

  // Pagination
  const totalPages = Math.ceil(blogs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedBlogs = blogs.slice(startIndex, endIndex);
  const del = useMutation({
    mutationFn: deleteBlog,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blogs"] });
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
          <h1 className="text-2xl font-bold text-gray-900">Blogs</h1>
          <p className="text-sm text-gray-500 mt-0.5">{blogs.length} blog{blogs.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/blog/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus size={16} /> Nouveau blog
          </Button>
        </Link>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Chargement des blogs...</p>
        </div>
      ) : blogs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Aucun blog trouvé</p>
          <Link href="/blog/new">
            <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700">
              <Plus size={16} /> Créer un blog
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedBlogs.map((blog) => (
            <BlogCard
              key={blog.id}
              blog={blog}
              onDelete={confirmDelete}
              isDeleting={deletingId === blog.id}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {blogs.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Affichage {startIndex + 1}-{Math.min(endIndex, blogs.length)} sur {blogs.length}
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
