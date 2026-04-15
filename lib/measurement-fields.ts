import { formatMeasurementType, type MeasurementRow } from "@/lib/measurements";

type BaseMeasurementFieldRow = {
  id: number;
  nome: string | null;
  slug: string | null;
  unidade_medida_id: number | null;
  tipo_valor: string | null;
  ordem: number | null;
  ativo: boolean | null;
};

export type InstrumentMeasurementFieldRow = BaseMeasurementFieldRow & {
  instrumento_id: number | null;
  categoria_campo_medicao_id: number | null;
  created_at?: string | null;
};

export type CategoryMeasurementFieldRow = BaseMeasurementFieldRow & {
  categoria_id: number | null;
};

export type MeasurementFieldItem = {
  dbId?: number;
  name: string;
  slug: string;
  measurementId: string;
  measurementName: string;
  measurementRawName: string;
  valueType: string;
  order: number;
  groupName?: string;
  subgroupName?: string;
};

export type MeasurementFieldDraft = {
  dbId?: string | number;
  name?: string;
  measurementId?: string | number;
  groupName?: string;
  subgroupName?: string;
};

export type MeasurementFieldValueConfig = {
  type: string;
  groupName: string;
  subgroupName: string;
};

export type MeasurementFieldLayoutSubgroup<TField> = {
  key: string;
  label: string | null;
  fields: TField[];
};

export type MeasurementFieldLayoutGroup<TField> = {
  key: string;
  label: string | null;
  subgroups: MeasurementFieldLayoutSubgroup<TField>[];
};

type MeasurementFieldSlugParts = {
  name: string;
  groupName?: string | null;
  subgroupName?: string | null;
};

type MeasurementFieldLayoutSource = {
  slug: string;
  name: string;
  order: number;
  groupName?: string;
  subgroupName?: string;
};

function normalizeText(value: string | null | undefined) {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

function serializeTextToSlug(value: string) {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getMeasurementFieldSlugParts(value: string | MeasurementFieldSlugParts) {
  if (typeof value === "string") {
    return {
      name: normalizeText(value),
      groupName: "",
      subgroupName: ""
    };
  }

  return {
    name: normalizeText(value.name),
    groupName: normalizeText(value.groupName),
    subgroupName: normalizeText(value.subgroupName)
  };
}

export function serializeMeasurementFieldSlug(value: string | MeasurementFieldSlugParts) {
  const parts = getMeasurementFieldSlugParts(value);
  const compositeLabel = [parts.groupName, parts.subgroupName, parts.name]
    .filter(Boolean)
    .join(" ");

  return serializeTextToSlug(compositeLabel);
}

export function parseMeasurementFieldValueConfig(
  rawValue: string | null | undefined
): MeasurementFieldValueConfig {
  const normalizedRawValue = normalizeText(rawValue);

  if (!normalizedRawValue) {
    return {
      type: "numero",
      groupName: "",
      subgroupName: ""
    };
  }

  try {
    const parsedValue = JSON.parse(normalizedRawValue) as {
      type?: unknown;
      groupName?: unknown;
      subgroupName?: unknown;
    };

    if (parsedValue && typeof parsedValue === "object" && !Array.isArray(parsedValue)) {
      return {
        type:
          normalizeText(typeof parsedValue.type === "string" ? parsedValue.type : "numero") ||
          "numero",
        groupName: normalizeText(
          typeof parsedValue.groupName === "string" ? parsedValue.groupName : ""
        ),
        subgroupName: normalizeText(
          typeof parsedValue.subgroupName === "string" ? parsedValue.subgroupName : ""
        )
      };
    }
  } catch {
    // fallback for legacy plain-text values
  }

  return {
    type: normalizedRawValue || "numero",
    groupName: "",
    subgroupName: ""
  };
}

export function serializeMeasurementFieldValueConfig(config: {
  type?: string | null;
  groupName?: string | null;
  subgroupName?: string | null;
}) {
  const type = normalizeText(config.type) || "numero";
  const groupName = normalizeText(config.groupName);
  const subgroupName = normalizeText(config.subgroupName);

  if (!groupName && !subgroupName && type === "numero") {
    return "numero";
  }

  return JSON.stringify({
    type,
    groupName,
    subgroupName
  });
}

function getMeasurementInfo(
  measurementId: number | null | undefined,
  measurementsById: Map<number, MeasurementRow>
) {
  const measurement = measurementId ? measurementsById.get(measurementId) : undefined;
  const rawName = normalizeText(measurement?.tipo);

  return {
    measurementId: measurementId ? String(measurementId) : "",
    measurementName: rawName ? formatMeasurementType(rawName) : "",
    measurementRawName: rawName
  };
}

function mapMeasurementFieldRow(
  row: BaseMeasurementFieldRow,
  measurementsById: Map<number, MeasurementRow>
): MeasurementFieldItem {
  const measurementInfo = getMeasurementInfo(row.unidade_medida_id, measurementsById);
  const valueConfig = parseMeasurementFieldValueConfig(row.tipo_valor);
  const name = normalizeText(row.nome);
  const groupName = valueConfig.groupName || undefined;
  const subgroupName = valueConfig.subgroupName || undefined;

  return {
    dbId: row.id,
    name,
    slug:
      normalizeText(row.slug) ||
      serializeMeasurementFieldSlug({
        name,
        groupName,
        subgroupName
      }),
    measurementId: measurementInfo.measurementId,
    measurementName: measurementInfo.measurementName,
    measurementRawName: measurementInfo.measurementRawName,
    valueType: valueConfig.type || "numero",
    order: row.ordem ?? 0,
    groupName,
    subgroupName
  };
}

function compareFieldsByLayout(
  firstField: Pick<MeasurementFieldLayoutSource, "order" | "name">,
  secondField: Pick<MeasurementFieldLayoutSource, "order" | "name">
) {
  if (firstField.order !== secondField.order) {
    return firstField.order - secondField.order;
  }

  return firstField.name.localeCompare(secondField.name, "pt-BR", { sensitivity: "base" });
}

export function sortMeasurementFields<TField extends MeasurementFieldLayoutSource>(fields: TField[]) {
  return [...fields].sort(compareFieldsByLayout);
}

export function groupMeasurementFieldsByLayout<TField extends MeasurementFieldLayoutSource>(
  fields: TField[]
) {
  const sortedFields = sortMeasurementFields(fields);
  const groupedMap = new Map<
    string,
    {
      label: string | null;
      firstOrder: number;
      subgroups: Map<
        string,
        {
          label: string | null;
          firstOrder: number;
          fields: TField[];
        }
      >;
    }
  >();

  for (const field of sortedFields) {
    const groupLabel = normalizeText(field.groupName) || null;
    const subgroupLabel = normalizeText(field.subgroupName) || null;
    const groupKey = groupLabel ?? "__ungrouped__";
    const subgroupKey = subgroupLabel ?? "__default__";
    const currentGroup = groupedMap.get(groupKey) ?? {
      label: groupLabel,
      firstOrder: field.order,
      subgroups: new Map()
    };

    currentGroup.firstOrder = Math.min(currentGroup.firstOrder, field.order);

    const currentSubgroup = currentGroup.subgroups.get(subgroupKey) ?? {
      label: subgroupLabel,
      firstOrder: field.order,
      fields: []
    };

    currentSubgroup.firstOrder = Math.min(currentSubgroup.firstOrder, field.order);
    currentSubgroup.fields.push(field);
    currentGroup.subgroups.set(subgroupKey, currentSubgroup);
    groupedMap.set(groupKey, currentGroup);
  }

  return [...groupedMap.entries()]
    .sort((firstEntry, secondEntry) => {
      if (firstEntry[1].firstOrder !== secondEntry[1].firstOrder) {
        return firstEntry[1].firstOrder - secondEntry[1].firstOrder;
      }

      return (firstEntry[1].label ?? "").localeCompare(secondEntry[1].label ?? "", "pt-BR", {
        sensitivity: "base"
      });
    })
    .map(([groupKey, groupValue]): MeasurementFieldLayoutGroup<TField> => ({
      key: groupKey,
      label: groupValue.label,
      subgroups: [...groupValue.subgroups.entries()]
        .sort((firstEntry, secondEntry) => {
          if (firstEntry[1].firstOrder !== secondEntry[1].firstOrder) {
            return firstEntry[1].firstOrder - secondEntry[1].firstOrder;
          }

          return (firstEntry[1].label ?? "").localeCompare(secondEntry[1].label ?? "", "pt-BR", {
            sensitivity: "base"
          });
        })
        .map(([subgroupKey, subgroupValue]) => ({
          key: `${groupKey}:${subgroupKey}`,
          label: subgroupValue.label,
          fields: sortMeasurementFields(subgroupValue.fields)
        }))
    }));
}

export function hasMeasurementFieldGrouping(fields: Array<{
  groupName?: string;
  subgroupName?: string;
}>) {
  return fields.some((field) => normalizeText(field.groupName) || normalizeText(field.subgroupName));
}

export function mapInstrumentMeasurementFieldRow(
  row: InstrumentMeasurementFieldRow,
  measurementsById: Map<number, MeasurementRow>
) {
  return mapMeasurementFieldRow(row, measurementsById);
}

export function mapCategoryMeasurementFieldRow(
  row: CategoryMeasurementFieldRow,
  measurementsById: Map<number, MeasurementRow>
) {
  return mapMeasurementFieldRow(row, measurementsById);
}
