import api from "./axios";

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

export const fetchHeroSlides = async (): Promise<HeroSlide[]> => {
  try {
    const { data } = await api.get("/hero-slides");
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching hero slides:", error);
    return [];
  }
};
