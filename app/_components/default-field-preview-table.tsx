"use client";

import type { MeasurementItem } from "@/lib/measurements";

type DefaultFieldPreviewItem = {
  key: string;
  name: string;
  measurementId: string;
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
