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
};

type DefaultFieldPreviewTableProps = {
  fields: DefaultFieldPreviewItem[];
  measurements: MeasurementItem[];
  emptyMessage: string;
};

export function DefaultFieldPreviewTable({
  fields,
  measurements,
  emptyMessage
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
          <p className="instrument-fields-builder__compact-copy">
            Visualizacao compacta do template para revisar a categoria com mais agilidade.
          </p>
        </div>

        <div className="instrument-fields-builder__table-wrap">
          <table className="instrument-fields-builder__table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nome do campo</th>
                <th>Tipo de medida</th>
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
    <div className="measurement-layout">
      <div className="instrument-fields-builder__compact-header">
        <span className="instrument-fields-builder__table-count">{fields.length} itens</span>
        <p className="instrument-fields-builder__compact-copy">
          Template agrupado para equipamentos com muitos campos e blocos tecnicos.
        </p>
      </div>

      {groupedFields.map((group) => {
        const groupLabel = group.label || "Campos gerais";

        return (
          <section key={group.key} className="measurement-layout__group">
            <header className="measurement-layout__group-header">
              <h4>{groupLabel}</h4>
              <span>{group.subgroups.reduce((total, subgroup) => total + subgroup.fields.length, 0)} campos</span>
            </header>

            <div className="measurement-layout__subgroups">
              {group.subgroups.map((subgroup) => (
                <article key={subgroup.key} className="measurement-layout__subgroup">
                  {subgroup.label ? (
                    <div className="measurement-layout__subgroup-header">
                      <strong>{subgroup.label}</strong>
                    </div>
                  ) : null}

                  <div className="measurement-layout__table-wrap">
                    <table className="measurement-layout__table">
                      <thead>
                        <tr>
                          {subgroup.fields.map((field) => (
                            <th key={field.key}>{field.name}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {subgroup.fields.map((field) => {
                            const measurement = measurementsById.get(field.measurementId);

                            return (
                              <td key={field.key}>
                                <span className="measurement-layout__cell-value">
                                  {measurement?.name ?? "Nao informada"}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      </tbody>
                    </table>
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
