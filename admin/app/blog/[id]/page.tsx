"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchBlog, updateBlog } from "@/lib/api";
import { CreateBlogPayload } from "@/types/blog";
import BlogForm from "@/components/blogs/BlogForm";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function EditBlogPage() {
  const router = useRouter();
  const params = useParams();
  const blogId = params.id as string;
  const qc = useQueryClient();

  const { data: blog, isLoading } = useQuery({
    queryKey: ["blog", blogId],
    queryFn: () => fetchBlog(blogId),
  });

  const update = useMutation({
    mutationFn: (data: CreateBlogPayload) => updateBlog(blogId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blogs"] });
      qc.invalidateQueries({ queryKey: ["blog", blogId] });
      router.push("/blog");
    },
  });

  const handleSubmit = async (data: CreateBlogPayload) => {
    update.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Chargement du blog...</p>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Blog non trouvé</p>
        <Link href="/blog" className="text-emerald-600 hover:underline mt-4">
          Retour aux blogs
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/blog" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Éditer le blog</h1>
          <p className="text-sm text-gray-500 mt-0.5">{blog.title}</p>
        </div>
      </div>

      {/* Form */}
      <BlogForm initial={blog} onSubmit={handleSubmit} loading={update.isPending} />

      {update.isError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {(update.error as any)?.message || "Une erreur est survenue lors de la mise à jour du blog"}
        </div>
      )}
    </div>
  );
}
