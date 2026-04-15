"use client";

import {
  groupMeasurementFieldsByLayout,
  hasMeasurementFieldGrouping
} from "@/lib/measurement-fields";
import type { CalibrationFieldReviewStatus } from "@/lib/calibration-records";

type CalibrationFieldReviewTableRow = {
  id: string | number;
  fieldName: string;
  measurementName: string;
  groupName?: string;
  subgroupName?: string;
  value: string;
  autoCalculated?: boolean;
  unit?: string;
  confidence: number | null;
  evidence: string;
  status: CalibrationFieldReviewStatus;
};

type CalibrationFieldReviewTableProps = {
  rows: CalibrationFieldReviewTableRow[];
  emptyMessage: string;
  editable?: boolean;
  showStatusColumn?: boolean;
  onValueChange?: (rowId: string | number, value: string) => void;
  onStatusChange?: (rowId: string | number, status: CalibrationFieldReviewStatus) => void;
};

function getStatusLabel(status: CalibrationFieldReviewStatus) {
  if (status === "conforming") return "Conforme";
  if (status === "non_conforming") return "Nao conforme";
  return "Nao identificado";
}

export function CalibrationFieldReviewTable({
  rows,
  emptyMessage,
  editable = false,
  showStatusColumn = true,
  onValueChange,
  onStatusChange
}: CalibrationFieldReviewTableProps) {
  if (rows.length === 0) {
    return <div className="calibration-field-table__empty">{emptyMessage}</div>;
  }

  const shouldUseGroupedLayout = hasMeasurementFieldGrouping(rows);

  if (!shouldUseGroupedLayout) {
    return (
      <div className="calibration-field-table__wrap">
        <table className="calibration-field-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Campo</th>
              <th>Medida</th>
              <th>Valor</th>
              {showStatusColumn ? <th>Conforme</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id}>
                <td className="calibration-field-table__index">
                  {String(index + 1).padStart(2, "0")}
                </td>
                <td className="calibration-field-table__field">
                  <strong>{row.fieldName}</strong>
                </td>
                <td className="calibration-field-table__measurement">
                  <strong>{row.measurementName || "Nao informada"}</strong>
                  {row.unit ? <span>Leitura IA: {row.unit}</span> : null}
                </td>
                <td className="calibration-field-table__value">
                  {editable && !row.autoCalculated ? (
                    <input
                      type="text"
                      value={row.value}
                      placeholder="Ex: 0,005"
                      onChange={(event) => onValueChange?.(row.id, event.target.value)}
                    />
                  ) : (
                    <div className="calibration-field-table__value-static">
                      <strong>
                        {row.value || (row.autoCalculated ? "Calculado automaticamente" : "Nao informado")}
                      </strong>
                      {row.autoCalculated ? <span>Soma automatica</span> : null}
                    </div>
                  )}
                </td>
                {showStatusColumn ? (
                  <td className="calibration-field-table__status">
                    {editable ? (
                      <label className="calibration-field-table__check">
                        <input
                          type="checkbox"
                          checked={row.status === "conforming"}
                          onChange={(event) =>
                            onStatusChange?.(row.id, event.target.checked ? "conforming" : "unknown")
                          }
                        />
                        <span>Verificado</span>
                      </label>
                    ) : (
                      <span
                        className={`calibration-field-table__status-pill calibration-field-table__status-pill--${row.status}`}
                      >
                        {getStatusLabel(row.status)}
                      </span>
                    )}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const groupedRows = groupMeasurementFieldsByLayout(
    rows.map((row, index) => ({
      ...row,
      slug: String(row.id),
      name: row.fieldName,
      order: index
    }))
  );

  return (
    <div className="measurement-layout measurement-layout--review">
      {groupedRows.map((group) => (
        <section key={group.key} className="measurement-layout__group">
          <header className="measurement-layout__group-header">
            <h4>{group.label || "Campos gerais"}</h4>
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
                  <table className="measurement-layout__table measurement-layout__table--review">
                    <thead>
                      <tr>
                        <th className="measurement-layout__row-head">Campo</th>
                        {subgroup.fields.map((field) => (
                          <th key={field.id}>{field.fieldName}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <th className="measurement-layout__row-head">Medida</th>
                        {subgroup.fields.map((field) => (
                          <td key={field.id}>
                            <strong className="measurement-layout__cell-value">
                              {field.measurementName || "Nao informada"}
                            </strong>
                            {field.unit ? (
                              <span className="measurement-layout__cell-support">Leitura IA: {field.unit}</span>
                            ) : null}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <th className="measurement-layout__row-head">Valor</th>
                        {subgroup.fields.map((field) => (
                          <td key={field.id}>
                            {editable && !field.autoCalculated ? (
                              <input
                                className="measurement-layout__input"
                                type="text"
                                value={field.value}
                                placeholder="Ex: 0,005"
                                onChange={(event) => onValueChange?.(field.id, event.target.value)}
                              />
                            ) : (
                              <div className="measurement-layout__cell-stack">
                                <strong className="measurement-layout__cell-value">
                                  {field.value || (field.autoCalculated ? "Calculado automaticamente" : "Nao informado")}
                                </strong>
                                {field.autoCalculated ? (
                                  <span className="measurement-layout__cell-support">Soma automatica</span>
                                ) : null}
                              </div>
                            )}
                          </td>
                        ))}
                      </tr>
                      {showStatusColumn ? (
                        <tr>
                          <th className="measurement-layout__row-head">Conforme</th>
                          {subgroup.fields.map((field) => (
                            <td key={field.id}>
                              {editable ? (
                                <label className="calibration-field-table__check">
                                  <input
                                    type="checkbox"
                                    checked={field.status === "conforming"}
                                    onChange={(event) =>
                                      onStatusChange?.(
                                        field.id,
                                        event.target.checked ? "conforming" : "unknown"
                                      )
                                    }
                                  />
                                  <span>Verificado</span>
                                </label>
                              ) : (
                                <span
                                  className={`calibration-field-table__status-pill calibration-field-table__status-pill--${field.status}`}
                                >
                                  {getStatusLabel(field.status)}
                                </span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
