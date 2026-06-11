import { HeroSlide } from '../models/heroSlide.model';

export interface CreateHeroSlidePayload {
    eyebrow?: string;
    title: string;
    subtitle?: string;
    bg?: string;
    cta?: string;
    ctaLink?: string;
    image?: string;
    sortOrder?: number;
}

export interface UpdateHeroSlidePayload {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    bg?: string;
    cta?: string;
    ctaLink?: string;
    image?: string;
    sortOrder?: number;
}

/**
 * Fetch all hero slides ordered by sortOrder
 */
export async function getAllHeroSlides(): Promise<HeroSlide[]> {
    return await HeroSlide.findAll({
        order: [['sortOrder', 'ASC']],
    });
}

/**
 * Fetch a hero slide by ID
 */
export async function getHeroSlideById(id: string): Promise<HeroSlide | null> {
    try {
        return await HeroSlide.findByPk(id);
    } catch (error) {
        return null;
    }
}

/**
 * Create a new hero slide
 */
export async function createHeroSlide(payload: CreateHeroSlidePayload): Promise<HeroSlide> {
    // Determine sortOrder if not provided
    let sortOrder = payload.sortOrder ?? 0;

    if (sortOrder === 0) {
        // Get max sortOrder and add 1
        const maxSlide = await HeroSlide.findOne({
            order: [['sortOrder', 'DESC']],
        });
        sortOrder = (maxSlide?.sortOrder ?? -1) + 1;
    }

    return await HeroSlide.create({
        ...payload,
        sortOrder,
    });
}

/**
 * Update a hero slide
 */
export async function updateHeroSlide(id: string, payload: UpdateHeroSlidePayload): Promise<HeroSlide> {
    const slide = await HeroSlide.findByPk(id);
    if (!slide) {
        throw new Error('Slide héroïque non trouvée');
    }

    return await slide.update(payload);
}

/**
 * Delete a hero slide
 */
export async function deleteHeroSlide(id: string): Promise<void> {
    const slide = await HeroSlide.findByPk(id);
    if (!slide) {
        throw new Error('Slide héroïque non trouvée');
    }
    await slide.destroy();
}
