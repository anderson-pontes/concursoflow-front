import { api } from "@/services/api";

export type MentalMap = {
  slug: string;
  title: string;
  category: string;
  description: string;
  topics: string[];
  page_count: number | null;
  updated_at: string | null;
  featured: boolean;
  available: boolean;
};

type MentalMapCatalog = {
  items: MentalMap[];
  total: number;
};

type MentalMapAccess = {
  url: string;
  expires_in: number;
};

export async function listMentalMaps(): Promise<MentalMapCatalog> {
  return (await api.get<MentalMapCatalog>("/mapas-mentais")).data;
}

export async function requestMentalMapAccess(slug: string, download: boolean): Promise<MentalMapAccess> {
  return (
    await api.post<MentalMapAccess>(`/mapas-mentais/${encodeURIComponent(slug)}/access`, null, {
      params: { download },
    })
  ).data;
}
