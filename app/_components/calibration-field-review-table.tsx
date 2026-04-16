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

function getSubgroupGridClassName(count: number) {
  return count <= 1
    ? "calibration-group-layout__subgroups calibration-group-layout__subgroups--single"
    : "calibration-group-layout__subgroups";
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
    <div className="calibration-group-layout">
      {groupedRows.map((group) => (
        <section key={group.key} className="calibration-group-layout__group">
          <header className="calibration-group-layout__group-header">
            <h4>{group.label || "Campos gerais"}</h4>
            <span>{group.subgroups.reduce((total, subgroup) => total + subgroup.fields.length, 0)} campos</span>
          </header>

          <div className={getSubgroupGridClassName(group.subgroups.length)}>
            {group.subgroups.map((subgroup) => (
              <article key={subgroup.key} className="calibration-group-layout__subgroup">
                <div className="calibration-group-layout__subgroup-header">
                  <strong>{subgroup.label || "Campos gerais"}</strong>
                  <span className="calibration-group-layout__subgroup-count">
                    {subgroup.fields.length} {subgroup.fields.length === 1 ? "campo" : "campos"}
                  </span>
                </div>

                <div className="calibration-group-layout__fields">
                  {subgroup.fields.map((field) => (
                    <article key={field.id} className="calibration-group-layout__field">
                      <div className="calibration-group-layout__field-head">
                        <div className="calibration-group-layout__field-copy">
                          <strong className="calibration-group-layout__field-name">
                            {field.fieldName}
                          </strong>
                          <div className="calibration-group-layout__field-meta">
                            <span className="calibration-group-layout__field-measurement">
                              {field.measurementName || "Nao informada"}
                            </span>
                            {field.unit ? (
                              <span className="calibration-group-layout__field-support">
                                Leitura IA: {field.unit}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {showStatusColumn ? (
                          <div className="calibration-group-layout__field-status">
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
                          </div>
                        ) : null}
                      </div>

                      <div className="calibration-group-layout__field-entry">
                        <span className="calibration-group-layout__field-entry-label">
                          {editable && !field.autoCalculated ? "Valor medido" : "Valor"}
                        </span>

                        <div className="calibration-group-layout__field-value">
                          {editable && !field.autoCalculated ? (
                            <input
                              className="calibration-group-layout__input"
                              type="text"
                              value={field.value}
                              placeholder="Ex: 0,005"
                              onChange={(event) => onValueChange?.(field.id, event.target.value)}
                            />
                          ) : (
                            <div className="calibration-group-layout__value-static">
                              <strong>
                                {field.value ||
                                  (field.autoCalculated
                                    ? "Calculado automaticamente"
                                    : "Nao informado")}
                              </strong>
                              {field.autoCalculated ? (
                                <span>Soma automatica</span>
                              ) : null}
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
