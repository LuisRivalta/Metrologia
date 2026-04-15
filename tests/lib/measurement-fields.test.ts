import { describe, expect, it } from "vitest";

import {
  groupMeasurementFieldsByLayout,
  parseMeasurementFieldValueConfig,
  serializeMeasurementFieldSlug,
  serializeMeasurementFieldValueConfig
} from "@/lib/measurement-fields";

describe("measurement-fields", () => {
  it("keeps legacy slugs for flat fields and expands context-aware slugs when grouped", () => {
    expect(serializeMeasurementFieldSlug("Maior erro externo")).toBe("maior-erro-externo");
    expect(
      serializeMeasurementFieldSlug({
        name: "Erro",
        groupName: "Tensao alternada",
        subgroupName: "Fase A 500V - 60Hz"
      })
    ).toBe("tensao-alternada-fase-a-500v-60hz-erro");
  });

  it("stores group metadata in tipo_valor only when needed", () => {
    expect(serializeMeasurementFieldValueConfig({ type: "numero" })).toBe("numero");
    expect(
      parseMeasurementFieldValueConfig(
        serializeMeasurementFieldValueConfig({
          type: "numero",
          groupName: "Tensao alternada",
          subgroupName: "Fase A"
        })
      )
    ).toEqual({
      type: "numero",
      groupName: "Tensao alternada",
      subgroupName: "Fase A"
    });
  });

  it("groups fields by main group and subgroup while preserving order", () => {
    const groups = groupMeasurementFieldsByLayout([
      {
        slug: "fase-a-erro",
        name: "Erro",
        groupName: "Tensao alternada",
        subgroupName: "Fase A",
        order: 1
      },
      {
        slug: "fase-a-incerteza",
        name: "Incerteza",
        groupName: "Tensao alternada",
        subgroupName: "Fase A",
        order: 0
      },
      {
        slug: "fase-b-erro",
        name: "Erro",
        groupName: "Tensao alternada",
        subgroupName: "Fase B",
        order: 2
      }
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.label).toBe("Tensao alternada");
    expect(groups[0]?.subgroups.map((subgroup) => subgroup.label)).toEqual(["Fase A", "Fase B"]);
    expect(groups[0]?.subgroups[0]?.fields.map((field) => field.name)).toEqual([
      "Incerteza",
      "Erro"
    ]);
  });
});
