import { describe, expect, it } from "vitest";

import { type MeasurementRow } from "@/lib/measurements";
import {
  groupMeasurementFieldsByLayout,
  hasMeasurementFieldGrouping,
  mapCategoryMeasurementFieldRow,
  mapInstrumentMeasurementFieldRow,
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

  it("mapeia linha de campo de instrumento para MeasurementFieldItem", () => {
    const measurementsById = new Map<number, MeasurementRow>([
      [1, { id: 1, tipo: "mm", tipo_desc: "Milimetros" }]
    ]);

    const row = {
      id: 10,
      nome: "Maior erro externo",
      slug: "maior-erro-externo",
      unidade_medida_id: 1,
      tipo_valor: "numero",
      ordem: 0,
      ativo: null,
      instrumento_id: null,
      categoria_campo_medicao_id: null
    };

    const item = mapInstrumentMeasurementFieldRow(row, measurementsById);

    expect(item.dbId).toBe(10);
    expect(item.name).toBe("Maior erro externo");
    expect(item.slug).toBe("maior-erro-externo");
    expect(item.measurementName).toBe("mm");
    expect(item.valueType).toBe("numero");
    expect(item.hint).toBeUndefined();
  });

  it("mapeia hint de campo de categoria quando presente", () => {
    const measurementsById = new Map<number, MeasurementRow>();

    const row = {
      id: 20,
      nome: "Capacidade",
      slug: "capacidade",
      unidade_medida_id: null,
      tipo_valor: "numero",
      ordem: 0,
      ativo: null,
      categoria_id: null,
      dica_extracao: "  pode estar no cabecalho  "
    };

    const item = mapCategoryMeasurementFieldRow(row, measurementsById);

    expect(item.hint).toBe("pode estar no cabecalho");
  });

  it("deriva slug quando linha nao tem slug preenchido", () => {
    const measurementsById = new Map<number, MeasurementRow>();

    const row = {
      id: 30,
      nome: "Erro",
      slug: "",
      unidade_medida_id: null,
      tipo_valor: JSON.stringify({ type: "numero", groupName: "Tensao", subgroupName: "Fase A" }),
      ordem: 0,
      ativo: null,
      instrumento_id: null,
      categoria_campo_medicao_id: null
    };

    const item = mapInstrumentMeasurementFieldRow(row, measurementsById);

    expect(item.slug).toBe("tensao-fase-a-erro");
    expect(item.groupName).toBe("Tensao");
    expect(item.subgroupName).toBe("Fase A");
  });

  it("hasMeasurementFieldGrouping retorna true quando algum campo tem grupo", () => {
    expect(hasMeasurementFieldGrouping([{ groupName: "Grupo A" }, {}])).toBe(true);
    expect(hasMeasurementFieldGrouping([{}, {}])).toBe(false);
  });
});
