"use client";

import {
  groupMeasurementFieldsByLayout,
  hasMeasurementFieldGrouping
} from "@/lib/measurement-fields";
import type { MeasurementItem } from "@/lib/measurements";

type DefaultFieldPreviewItem = {
  key: string;
  name: string;
  measurementId: string;
  groupName?: string;
  subgroupName?: string;
  currentValue?: string;
  currentValueUnit?: string;
};

type DefaultFieldPreviewTableProps = {
  fields: DefaultFieldPreviewItem[];
  measurements: MeasurementItem[];
  emptyMessage: string;
  showCurrentValue?: boolean;
  showCompactCopy?: boolean;
};

function normalizeText(value: string | null | undefined) {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

function formatCurrentValue(field: Pick<DefaultFieldPreviewItem, "currentValue" | "currentValueUnit">) {
  const value = normalizeText(field.currentValue);
  const unit = normalizeText(field.currentValueUnit);

  if (!value) {
    return "Sem valor";
  }

  return unit ? `${value} ${unit}` : value;
}

function getSubgroupGridClassName(count: number) {
  return count <= 1
    ? "template-preview__subgroups template-preview__subgroups--single"
    : "template-preview__subgroups";
}

function getFieldGridClassName(count: number) {
  if (count <= 1) {
    return "template-preview__fields template-preview__fields--single";
  }

  if (count === 2) {
    return "template-preview__fields template-preview__fields--double";
  }

  return "template-preview__fields template-preview__fields--triple";
}

export function DefaultFieldPreviewTable({
  fields,
  measurements,
  emptyMessage,
  showCurrentValue = false,
  showCompactCopy = true
}: DefaultFieldPreviewTableProps) {
  if (fields.length === 0) {
    return <div className="instrument-fields-builder__empty">{emptyMessage}</div>;
  }

  const measurementsById = new Map(measurements.map((measurement) => [measurement.id, measurement]));
  const groupedFields = groupMeasurementFieldsByLayout(
    fields.map((field, index) => ({
      ...field,
      slug: field.key,
      order: index
    }))
  );
  const shouldUseGroupedLayout = hasMeasurementFieldGrouping(fields);

  if (!shouldUseGroupedLayout) {
    return (
      <>
        <div className="instrument-fields-builder__compact-header">
          <span className="instrument-fields-builder__table-count">{fields.length} itens</span>
          {showCompactCopy ? (
            <p className="instrument-fields-builder__compact-copy">
              Visualizacao compacta do template para revisar a categoria com mais agilidade.
            </p>
          ) : null}
        </div>

        <div className="instrument-fields-builder__table-wrap">
          <table className="instrument-fields-builder__table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nome do campo</th>
                <th>Tipo de medida</th>
                {showCurrentValue ? <th>Valor atual</th> : null}
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => {
                const measurement = measurementsById.get(field.measurementId);

                return (
                  <tr key={field.key}>
                    <td className="instrument-fields-builder__table-index">
                      {String(index + 1).padStart(2, "0")}
                    </td>
                    <td className="instrument-fields-builder__table-name">{field.name}</td>
                    <td className="instrument-fields-builder__table-measurement">
                      {measurement?.name ?? "Nao informada"}
                    </td>
                    {showCurrentValue ? (
                      <td className="instrument-fields-builder__table-value">
                        {formatCurrentValue(field)}
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  return (
    <div className="template-preview">
      <div className="instrument-fields-builder__compact-header">
        <span className="instrument-fields-builder__table-count">{fields.length} itens</span>
        {showCompactCopy ? (
          <p className="instrument-fields-builder__compact-copy">
            Template agrupado para equipamentos com muitos campos e blocos tecnicos.
          </p>
        ) : null}
      </div>

      {groupedFields.map((group) => {
        const groupLabel = group.label || "Campos gerais";

        return (
          <section key={group.key} className="template-preview__group">
            <header className="template-preview__group-header">
              <h4>{groupLabel}</h4>
              <span>{group.subgroups.reduce((total, subgroup) => total + subgroup.fields.length, 0)} campos</span>
            </header>

            <div className={getSubgroupGridClassName(group.subgroups.length)}>
              {group.subgroups.map((subgroup) => (
                <article key={subgroup.key} className="template-preview__subgroup">
                  <div className="template-preview__subgroup-header">
                    <strong>{subgroup.label || "Campos gerais"}</strong>
                  </div>

                  <div className={getFieldGridClassName(subgroup.fields.length)}>
                    {subgroup.fields.map((field) => {
                      const measurement = measurementsById.get(field.measurementId);

                      return (
                        <article key={field.key} className="template-preview__field">
                          <strong className="template-preview__field-name">{field.name}</strong>
                          <span className="template-preview__field-measurement">
                            {measurement?.name ?? "Nao informada"}
                          </span>
                          {showCurrentValue ? (
                            <span className="template-preview__field-value">
                              {formatCurrentValue(field)}
                            </span>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
