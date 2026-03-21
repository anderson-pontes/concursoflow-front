import { api } from "@/services/api";

export type Categoria = {
  id: string;
  user_id: string;
  nome: string;
  created_at: string;
};

export async function listCategorias() {
  return (await api.get("/categorias")).data as Categoria[];
}

export async function createCategoria(nome: string) {
  return (await api.post("/categorias", { nome })).data as Categoria;
}

export async function updateCategoria(id: string, nome: string) {
  return (await api.put(`/categorias/${id}`, { nome })).data as Categoria;
}

export async function deleteCategoria(id: string) {
  await api.delete(`/categorias/${id}`);
}
