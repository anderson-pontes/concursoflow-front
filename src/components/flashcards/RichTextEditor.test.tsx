import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RichTextEditor } from "@/components/flashcards/RichTextEditor";
import { RICH_TEXT_COLORS, RICH_TEXT_HIGHLIGHT_COLORS } from "@/lib/palette/rich-text-colors";

const EXISTING_CARD_HTML = [
  "<h2>Controle de constitucionalidade</h2>",
  '<p><strong>Difuso</strong>, <em>concreto</em> e <u>incidental</u>.</p>',
  `<p><span style="color: ${RICH_TEXT_COLORS[7]}"><mark data-color="${RICH_TEXT_HIGHLIGHT_COLORS[0]}" style="background-color: ${RICH_TEXT_HIGHLIGHT_COLORS[0]}; color: inherit">Atenção</mark></span></p>`,
  "<ul><li><p>Qualquer juiz ou tribunal</p></li></ul>",
  "<ol><li><p>Caso concreto</p></li></ol>",
  '<img src="https://cdn.example.test/resumo.png" data-width-pct="50" alt="Resumo">',
].join("");

describe("RichTextEditor", () => {
  it("abre conteúdo legado sem disparar alteração nem perder recursos suportados", async () => {
    const onChange = vi.fn();

    render(<RichTextEditor value={EXISTING_CARD_HTML} onChange={onChange} />);

    const editor = await screen.findByRole("textbox");
    expect(editor.querySelector("h2")).toHaveTextContent("Controle de constitucionalidade");
    expect(editor.querySelector("strong")).toHaveTextContent("Difuso");
    expect(editor.querySelector("em")).toHaveTextContent("concreto");
    expect(editor.querySelector("u")).toHaveTextContent("incidental");
    expect(editor.querySelector("ul li")).toHaveTextContent("Qualquer juiz ou tribunal");
    expect(editor.querySelector("ol li")).toHaveTextContent("Caso concreto");
    expect(editor.querySelector("mark")).toHaveAttribute("data-color", RICH_TEXT_HIGHLIGHT_COLORS[0]);
    expect(editor.querySelector("img")?.parentElement).toHaveStyle({ width: "50%" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("mantém os comandos de formatação disponíveis após a atualização", async () => {
    const onChange = vi.fn();

    render(<RichTextEditor value="<p>Texto</p>" onChange={onChange} />);

    expect(await screen.findByRole("textbox")).toHaveTextContent("Texto");
    expect(screen.getByRole("button", { name: /Negrito/ })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Itálico/ })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Sublinhado/ })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Lista com marcadores" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Lista numerada" })).toBeEnabled();
    expect(onChange).not.toHaveBeenCalled();
  });
});
