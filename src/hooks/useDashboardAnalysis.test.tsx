import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { AxiosError } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "@/services/api";
import { useDashboardAnalysis } from "@/hooks/useDashboardAnalysis";

vi.mock("@/services/api", () => ({ api: { get: vi.fn() } }));
afterEach(() => vi.clearAllMocks());

describe("dashboard analysis request", () => {
  it("uses the route and filters, does not retry 404, and allows manual retry and filter updates", async () => {
    const client = new QueryClient();
    vi.mocked(api.get).mockImplementation(async url => {
      if (url === "/dashboard/analise") throw new AxiosError("Not Found", undefined, undefined, undefined,
        { status: 404, statusText: "Not Found", data: {}, headers: {}, config: {} as never });
      return { data: [] } as never;
    });
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const { result, rerender, unmount } = renderHook(
      ({ id, inicio }) => useDashboardAnalysis(id, { inicio, fim: "2026-10-18" }, true),
      { wrapper, initialProps: { id: "contest-1", inicio: "2026-10-12" } },
    );
    const calls = () => vi.mocked(api.get).mock.calls.filter(([url]) => url === "/dashboard/analise");
    await waitFor(() => expect(result.current.analysis.isError).toBe(true));
    expect(calls()).toEqual([["/dashboard/analise", { params: { concurso_id: "contest-1", inicio: "2026-10-12", fim: "2026-10-18" } }]]);
    expect(result.current.analysis.failureCount).toBe(1);
    await result.current.analysis.refetch();
    expect(calls()).toHaveLength(2);
    rerender({ id: "contest-2", inicio: "2026-10-13" });
    await waitFor(() => expect(result.current.analysis.isError).toBe(true));
    expect(calls()).toHaveLength(3);
    expect(calls()[2][1]).toEqual({ params: { concurso_id: "contest-2", inicio: "2026-10-13", fim: "2026-10-18" } });
    unmount();
    client.clear();
  });
});
