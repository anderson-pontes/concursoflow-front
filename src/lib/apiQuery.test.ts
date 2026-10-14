import { AxiosError } from "axios";
import { describe, expect, it } from "vitest";
import { apiUnavailableMessage, retryApiQuery } from "@/lib/apiQuery";

const error = (status?: number) => new AxiosError("Request failed", undefined, undefined, undefined,
  status ? { status, statusText: "", data: {}, headers: {}, config: {} as never } : undefined);

describe("API query failures", () => {
  it("never retries 404 automatically and preserves transient retries", () => {
    expect(retryApiQuery(0, error(404))).toBe(false);
    expect(retryApiQuery(0, error(500))).toBe(true);
    expect(retryApiQuery(2, error())).toBe(true);
    expect(retryApiQuery(3, error())).toBe(false);
  });
  it("distinguishes unavailable resources, connection failures and empty success", () => {
    expect(apiUnavailableMessage(error(404))).toContain("Recurso indisponível");
    expect(apiUnavailableMessage(error())).toContain("conectar");
    expect(apiUnavailableMessage(null)).toBeUndefined();
    expect(apiUnavailableMessage(error(500))).toBeUndefined();
  });
});
