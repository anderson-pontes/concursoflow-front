import { describe, expect, it } from "vitest";

import { parseBulkTopics, reorderCatalogItems } from "@/lib/adminEditalEditor";

describe("adminEditalEditor", () => {
  it("transforma conteúdo hierárquico em tópicos sem duplicatas", () => {
    expect(parseBulkTopics("1 Redes\n1.1 Modelo OSI\n1.2 TCP/IP\n- DNS\nDNS", ["Redes"])).toEqual(["Modelo OSI", "TCP/IP", "DNS"]);
  });

  it("reordena e normaliza a ordem persistida", () => {
    const items = [{ id: "a", ordem: 8 }, { id: "b", ordem: 4 }, { id: "c", ordem: 2 }];
    expect(reorderCatalogItems(items, 2, 0)).toEqual([{ id: "c", ordem: 1 }, { id: "a", ordem: 2 }, { id: "b", ordem: 3 }]);
  });
});
