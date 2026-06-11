import api from "@/libs/axios";

export interface Blog {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  image?: string;
  author?: string;
  createdAt: string;
  updatedAt: string;
}

export const fetchBlogs = async (): Promise<Blog[]> => {
  const { data } = await api.get("/blogs");
  return Array.isArray(data) ? data : (data.data ?? []);
};

export const fetchBlogBySlug = async (slug: string): Promise<Blog> => {
  const { data } = await api.get(`/blogs/${slug}`);
  return data;
};
