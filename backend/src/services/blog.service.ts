import { Blog } from '../models/blog.model';
import { generateSlug } from '../helpers/slug';

export interface CreateBlogPayload {
    title: string;
    slug?: string;
    description: string;
    content: string;
    image?: string;
    author?: string;
}

export interface UpdateBlogPayload {
    title?: string;
    slug?: string;
    description?: string;
    content?: string;
    image?: string;
    author?: string;
}

/**
 * Fetch all blogs
 */
export async function getAllBlogs(): Promise<Blog[]> {
    return await Blog.findAll({
        order: [['createdAt', 'DESC']],
    });
}

/**
 * Fetch a blog by ID
 */
export async function getBlogById(id: string): Promise<Blog | null> {
    try {
        return await Blog.findByPk(id);
    } catch (error) {
        // Invalid UUID format, return null to try slug lookup
        return null;
    }
}

/**
 * Fetch a blog by slug
 */
export async function getBlogBySlug(slug: string): Promise<Blog | null> {
    try {
        // Normalize the slug (decode URL encoding, convert to lowercase)
        const normalizedSlug = decodeURIComponent(slug).toLowerCase();
        const regeneratedSlug = generateSlug(normalizedSlug);
        
        // Try multiple strategies to find the blog
        // 1. Exact match with normalized slug
        let blog = await Blog.findOne({ 
            where: { slug: normalizedSlug } 
        });
        
        // 2. Try regenerated slug (handles "test blog" -> "test-2" scenarios)
        if (!blog && regeneratedSlug !== normalizedSlug) {
            blog = await Blog.findOne({ 
                where: { slug: regeneratedSlug } 
            });
        }
        
        // 3. Case-insensitive search (last resort)
        if (!blog) {
            const allBlogs = await Blog.findAll();
            blog = allBlogs.find(
                b => b.slug.toLowerCase() === normalizedSlug || 
                     b.slug.toLowerCase() === regeneratedSlug
            ) || null;
        }
        
        return blog;
    } catch (error) {
        console.error(`Error fetching blog by slug "${slug}":`, error);
        return null;
    }
}

/**
 * Create a new blog
 */
export async function createBlog(payload: CreateBlogPayload): Promise<Blog> {
    // Generate slug from title if not provided
    let slug = payload.slug || generateSlug(payload.title);

    // Check if slug already exists
    const existing = await Blog.findOne({ where: { slug } });
    if (existing) {
        throw new Error('Un blog avec ce slug existe déjà');
    }

    return await Blog.create({
        ...payload,
        slug,
    });
}

/**
 * Update a blog
 */
export async function updateBlog(id: string, payload: UpdateBlogPayload): Promise<Blog> {
    const blog = await Blog.findByPk(id);
    if (!blog) {
        throw new Error('Blog non trouvé');
    }

    // Generate new slug if title changed but slug not provided
    let newSlug = payload.slug;
    if (payload.title && !payload.slug) {
        newSlug = generateSlug(payload.title);
    }

    // Check if new slug already exists (and it's not the same blog)
    if (newSlug && newSlug !== blog.slug) {
        const existing = await Blog.findOne({ where: { slug: newSlug } });
        if (existing) {
            throw new Error('Un blog avec ce slug existe déjà');
        }
    }

    const updateData = { ...payload };
    if (newSlug) {
        updateData.slug = newSlug;
    }

    return await blog.update(updateData);
}

/**
 * Delete a blog
 */
export async function deleteBlog(id: string): Promise<void> {
    const blog = await Blog.findByPk(id);
    if (!blog) {
        throw new Error('Blog non trouvé');
    }
    await blog.destroy();
}
