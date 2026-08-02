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
  eyebrowColor?: string;
  eyebrowFont?: string;
  eyebrowWeight?: string;
  titleColor?: string;
  titleFont?: string;
  titleWeight?: string;
  subtitleColor?: string;
  subtitleFont?: string;
  subtitleWeight?: string;
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
  eyebrowColor?: string;
  eyebrowFont?: string;
  eyebrowWeight?: string;
  titleColor?: string;
  titleFont?: string;
  titleWeight?: string;
  subtitleColor?: string;
  subtitleFont?: string;
  subtitleWeight?: string;
}
