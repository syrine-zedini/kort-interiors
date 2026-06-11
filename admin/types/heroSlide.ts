export interface HeroSlide {
  id: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  bg?: string;
  cta?: string;
  ctaLink?: string;
  image?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

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
