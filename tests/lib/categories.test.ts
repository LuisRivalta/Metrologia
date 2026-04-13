import { describe, expect, it } from "vitest";

import { mapCategoryRow, serializeCategorySlug } from "@/lib/categories";

describe("categories", () => {
  it("serializes category names into stable slugs", () => {
    expect(serializeCategorySlug("  Paqu\u00edmetro   Digital  ")).toBe("paquimetro-digital");
    expect(serializeCategorySlug(" / Controle de Pressao / ")).toBe("controle-de-pressao");
  });

  it("maps category rows trimming visible values", () => {
    expect(
      mapCategoryRow({
        id: 7,
        nome: "  Balanca de Precisao  ",
        slug: "  balanca-precisao  "
      })
    ).toEqual({
      id: "balanca-precisao",
      dbId: 7,
      name: "Balanca de Precisao",
      slug: "balanca-precisao",
      fields: []
    });
  });
});
