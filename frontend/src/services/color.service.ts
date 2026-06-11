import api from "@/libs/axios";

export interface ColorDto {
  id: string;
  nameFr: string;
  hex: string;
}

let cachedColors: ColorDto[] | null = null;

export const getAllColors = async (): Promise<ColorDto[]> => {
  if (cachedColors) return cachedColors;
  const response = await api.get<ColorDto[]>("/colors");
  cachedColors = response.data;
  return cachedColors;
};

