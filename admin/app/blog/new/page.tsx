"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createBlog } from "@/lib/api";
import { CreateBlogPayload } from "@/types/blog";
import BlogForm from "@/components/blogs/BlogForm";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function NewBlogPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: createBlog,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blogs"] });
      router.push("/blog");
    },
  });

  const handleSubmit = async (data: CreateBlogPayload) => {
    create.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/blog" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouveau blog</h1>
          <p className="text-sm text-gray-500 mt-0.5">Créer un nouveau blog</p>
        </div>
      </div>

      {/* Form */}
      <BlogForm onSubmit={handleSubmit} loading={create.isPending} />

      {create.isError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {(create.error as any)?.message || "Une erreur est survenue lors de la création du blog"}
        </div>
      )}
    </div>
  );
}
