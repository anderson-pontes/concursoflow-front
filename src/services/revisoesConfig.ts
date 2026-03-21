import { api } from "@/services/api";

export type RevisoesConfig = {
  id: string;
  user_id: string;
  dias: number[];
  updated_at: string;
};

export async function getRevisoesConfig() {
  return (await api.get("/revisoes-config")).data as RevisoesConfig;
}

export async function putRevisoesConfig(dias: number[]) {
  return (await api.put("/revisoes-config", { dias })).data as RevisoesConfig;
}
