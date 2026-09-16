import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { paginarEditaisPublicados } from "@/services/editaisCatalogo";

const DEFAULT_PAGE_SIZE = 8;

export type CatalogQueryV1 = {
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

export function parseCatalogQuery(params: URLSearchParams): CatalogQueryV1 {
  const rawSearch = params.getAll("search")[0] ?? "";
  return {
    search: normalizeCatalogSearch(rawSearch),
    page: integerInRange(singleValue(params, "page"), 1, 1),
    pageSize: integerInRange(singleValue(params, "page_size"), DEFAULT_PAGE_SIZE, 1, 50),
    sort: singleValue(params, "sort") === "recent" ? "recent" : "recent",
  };
}

export function serializeCatalogQuery(current: URLSearchParams, query: CatalogQueryV1) {
  const next = new URLSearchParams();
  if (current.getAll("origem").length === 1 && current.get("origem") === "catalogo") {
    next.set("origem", "catalogo");
  }
  if (query.search) next.set("search", query.search);
  if (query.page !== 1) next.set("page", String(query.page));
  if (query.pageSize !== DEFAULT_PAGE_SIZE) next.set("page_size", String(query.pageSize));
  if (query.sort !== "recent") next.set("sort", query.sort);
  return next;
}

function isCanonical(params: URLSearchParams, query: CatalogQueryV1) {
  return serializeCatalogQuery(params, query).toString() === params.toString();
}

export function useCatalogDiscovery(onSearchContextChange?: () => void) {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = React.useMemo(() => parseCatalogQuery(searchParams), [searchParams]);
  const [draftSearch, setDraftSearch] = React.useState(query.search);
  const previousSearch = React.useRef(query.search);
  const onSearchChangeRef = React.useRef(onSearchContextChange);
  onSearchChangeRef.current = onSearchContextChange;

  React.useEffect(() => {
    if (!isCanonical(searchParams, query)) {
      setSearchParams(serializeCatalogQuery(searchParams, query), { replace: true });
    }
  }, [query, searchParams, setSearchParams]);

  React.useEffect(() => {
    setDraftSearch(query.search);
    if (previousSearch.current !== query.search) onSearchChangeRef.current?.();
    previousSearch.current = query.search;
  }, [query.search]);

  const result = useQuery({
    queryKey: ["catalogo-editais", "public", query.search, query.page, query.pageSize, query.sort],
    queryFn: ({ signal }) => paginarEditaisPublicados({ ...query, signal }),
  });

  React.useEffect(() => {
    if (!result.data) return;
    const canonicalPage = result.data.total === 0 ? 1 : Math.max(1, result.data.total_pages);
    if (query.page > canonicalPage) {
      setSearchParams(
        serializeCatalogQuery(searchParams, { ...query, page: canonicalPage }),
        { replace: true },
      );
    }
  }, [query, result.data, searchParams, setSearchParams]);

  const applySearch = React.useCallback(() => {
    const search = normalizeCatalogSearch(draftSearch);
    setDraftSearch(search);
    if (search === query.search && query.page === 1) return;
    previousSearch.current = search;
    onSearchChangeRef.current?.();
    setSearchParams(serializeCatalogQuery(searchParams, { ...query, search, page: 1 }));
  }, [draftSearch, query, searchParams, setSearchParams]);

  const clearSearch = React.useCallback(() => {
    setDraftSearch("");
    if (!query.search && query.page === 1) return;
    previousSearch.current = "";
    onSearchChangeRef.current?.();
    setSearchParams(serializeCatalogQuery(searchParams, { ...query, search: "", page: 1 }));
  }, [query, searchParams, setSearchParams]);

  const setPage = React.useCallback((page: number) => {
    if (page === query.page || page < 1) return;
    setSearchParams(serializeCatalogQuery(searchParams, { ...query, page }));
  }, [query, searchParams, setSearchParams]);

  return {
    query,
    draftSearch,
    setDraftSearch,
    applySearch,
    clearSearch,
    setPage,
    result,
  };
}
