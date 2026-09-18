import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { obterFiltrosCatalogo, paginarEditaisPublicados, validarSelecaoCatalogo } from "@/services/editaisCatalogo";
import type { CatalogFilters } from "@/types/editaisCatalogo";

const DEFAULT_PAGE_SIZE = 8;
const KEY_PATTERN = /^[a-z][a-z0-9-]{1,63}$/;

export type CatalogQueryV2 = CatalogFilters & {
  search: string;
  page: number;
  pageSize: number;
  sort: "recent";
};

export function normalizeCatalogSearch(value: string) {
  return value.normalize("NFC").trim().replace(/\s+/gu, " ").slice(0, 200);
}

function singleValue(params: URLSearchParams, name: string) {
  const values = params.getAll(name);
  return values.length === 1 ? values[0] : null;
}

function integerInRange(value: string | null, fallback: number, min: number, max = Number.MAX_SAFE_INTEGER) {
  if (!value || !/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
}

function keys(params: URLSearchParams, name: string, limit: number) {
  return [...new Set(params.getAll(name).filter((value) => KEY_PATTERN.test(value)))].sort().slice(0, limit);
}

function years(params: URLSearchParams) {
  return [...new Set(params.getAll("ano_edital").filter((value) => /^\d{4}$/.test(value)).map(Number).filter((value) => value >= 1900 && value <= 9999))].sort((a, b) => a - b).slice(0, 10);
}

export function parseCatalogQuery(params: URLSearchParams): CatalogQueryV2 {
  return {
    search: normalizeCatalogSearch(params.getAll("search")[0] ?? ""),
    esfera: keys(params, "esfera", 4),
    area: keys(params, "area", 20),
    anoEdital: years(params),
    page: integerInRange(singleValue(params, "page"), 1, 1),
    pageSize: integerInRange(singleValue(params, "page_size"), DEFAULT_PAGE_SIZE, 1, 50),
    sort: "recent",
  };
}

export function serializeCatalogQuery(current: URLSearchParams, query: CatalogQueryV2) {
  const next = new URLSearchParams();
  if (current.getAll("origem").length === 1 && current.get("origem") === "catalogo") next.set("origem", "catalogo");
  if (query.search) next.set("search", query.search);
  query.esfera.forEach((value) => next.append("esfera", value));
  query.area.forEach((value) => next.append("area", value));
  query.anoEdital.forEach((value) => next.append("ano_edital", String(value)));
  if (query.page !== 1) next.set("page", String(query.page));
  if (query.pageSize !== DEFAULT_PAGE_SIZE) next.set("page_size", String(query.pageSize));
  if (query.sort !== "recent") next.set("sort", query.sort);
  return next;
}

function isCanonical(params: URLSearchParams, query: CatalogQueryV2) {
  return serializeCatalogQuery(params, query).toString() === params.toString();
}

function appliedFilters(query: CatalogQueryV2): CatalogFilters {
  return { esfera: query.esfera, area: query.area, anoEdital: query.anoEdital };
}

export function useCatalogDiscovery(_legacyOnContextChange?: () => void) {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = React.useMemo(() => parseCatalogQuery(searchParams), [searchParams]);
  const [draftSearch, setDraftSearch] = React.useState(query.search);

  React.useEffect(() => {
    if (!isCanonical(searchParams, query)) setSearchParams(serializeCatalogQuery(searchParams, query), { replace: true });
  }, [query, searchParams, setSearchParams]);
  React.useEffect(() => setDraftSearch(query.search), [query.search]);

  const result = useQuery({
    queryKey: ["catalogo-editais", "public", query],
    queryFn: ({ signal }) => paginarEditaisPublicados({ ...query, signal }),
  });
  const facets = useQuery({
    queryKey: ["catalogo-editais", "public", "filters", { search: query.search, ...appliedFilters(query) }],
    queryFn: ({ signal }) => obterFiltrosCatalogo({ search: query.search, ...appliedFilters(query), signal }),
  });

  React.useEffect(() => {
    if (!result.data) return;
    const canonicalPage = result.data.total === 0 ? 1 : Math.max(1, result.data.total_pages);
    if (query.page > canonicalPage) setSearchParams(serializeCatalogQuery(searchParams, { ...query, page: canonicalPage }), { replace: true });
  }, [query, result.data, searchParams, setSearchParams]);

  const commit = React.useCallback((next: CatalogQueryV2, replace = false) => {
    setSearchParams(serializeCatalogQuery(searchParams, next), { replace });
  }, [searchParams, setSearchParams]);
  const applySearch = React.useCallback(() => {
    const search = normalizeCatalogSearch(draftSearch);
    setDraftSearch(search);
    if (search !== query.search || query.page !== 1) commit({ ...query, search, page: 1 });
  }, [commit, draftSearch, query]);
  const clearSearch = React.useCallback(() => {
    setDraftSearch("");
    if (query.search || query.page !== 1) commit({ ...query, search: "", page: 1 });
  }, [commit, query]);
  const applyFilters = React.useCallback((filters: CatalogFilters) => {
    commit({ ...query, esfera: [...new Set(filters.esfera)].sort(), area: [...new Set(filters.area)].sort(), anoEdital: [...new Set(filters.anoEdital)].sort((a, b) => a - b), page: 1 });
  }, [commit, query]);
  const clearFilters = React.useCallback(() => applyFilters({ esfera: [], area: [], anoEdital: [] }), [applyFilters]);
  const setPage = React.useCallback((page: number) => {
    if (page !== query.page && page >= 1) commit({ ...query, page });
  }, [commit, query]);
  const validateSelection = React.useCallback((editalId: string, versionId: string, signal?: AbortSignal) => validarSelecaoCatalogo({
    editalId,
    versionId,
    search: query.search,
    filters: appliedFilters(query),
    signal,
  }), [query]);

  return {
    query,
    draftSearch,
    setDraftSearch,
    applySearch,
    clearSearch,
    applyFilters,
    clearFilters,
    setPage,
    result,
    facets,
    validateSelection,
    filterCount: query.esfera.length + query.area.length + query.anoEdital.length,
  };
}
