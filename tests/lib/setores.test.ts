import { describe, expect, it } from "vitest";
import { mapSetorRow, formatSetorLabel } from "@/lib/setores";

describe("setores", () => {
  it("maps a db row to a SetorItem", () => {
    expect(mapSetorRow({ id: 1, codigo: " 3.03 ", nome: " Laboratório de Pressão " })).toEqual({
      id: 1,
      codigo: "3.03",
      nome: "Laboratório de Pressão"
    });
  });

  it("formats the display label as 'codigo – nome'", () => {
    expect(formatSetorLabel({ id: 1, codigo: "3.03", nome: "Lab. Pressão" })).toBe("3.03 – Lab. Pressão");
  });

  it("handles rows without created_at", () => {
    expect(mapSetorRow({ id: 5, codigo: "1.01", nome: "Elétrica" })).toEqual({
      id: 5,
      codigo: "1.01",
      nome: "Elétrica"
    });
  });
});
