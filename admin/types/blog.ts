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

export interface CreateBlogPayload {
  title: string;
  slug?: string;
  description: string;
  content: string;
  image?: string;
  author?: string;
}
