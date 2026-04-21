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
  showConfidenceIndicators?: boolean;
  onValueChange?: (rowId: string | number, value: string) => void;
  onStatusChange?: (rowId: string | number, status: CalibrationFieldReviewStatus) => void;
};

function getStatusLabel(status: CalibrationFieldReviewStatus) {
  if (status === "conforming") return "Conforme";
  if (status === "non_conforming") return "Nao conforme";
  return "Nao identificado";
}

function renderConfidenceBadge(
  confidence: number | null,
  value: string,
  show: boolean
) {
  if (!show) return null;

  if (value !== "" && confidence !== null && confidence < 0.7) {
    return (
      <span className="calibration-field-table__confidence calibration-field-table__confidence--low">
        baixa confiança
      </span>
    );
  }

  if (value === "" && confidence === null) {
    return (
      <span className="calibration-field-table__confidence calibration-field-table__confidence--not-found">
        não encontrado
      </span>
    );
  }

  return null;
}

export function CalibrationFieldReviewTable({
  rows,
  emptyMessage,
  editable = false,
  showStatusColumn = true,
  showConfidenceIndicators = false,
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
                    <>
                      <input
                        type="text"
                        value={row.value}
                        placeholder="Ex: 0,005"
                        onChange={(event) => onValueChange?.(row.id, event.target.value)}
                      />
                      {renderConfidenceBadge(row.confidence, row.value, showConfidenceIndicators)}
                    </>
                  ) : (
                    <div className="calibration-field-table__value-static">
                      <strong>
                        {row.value || (row.autoCalculated ? "Calculado automaticamente" : "Nao informado")}
                      </strong>
                      {row.autoCalculated ? <span>Soma automatica</span> : null}
                      {renderConfidenceBadge(row.confidence, row.value, showConfidenceIndicators && !row.autoCalculated)}
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
    <div className="calibration-matrix-layout">
      {groupedRows.map((group) => (
        <section key={group.key} className="calibration-matrix-layout__group">
          <header className="calibration-matrix-layout__group-header">
            <h4>{group.label || "Campos gerais"}</h4>
            <span>
              {group.subgroups.reduce((total, subgroup) => total + subgroup.fields.length, 0)} campos
            </span>
          </header>

          <div className="calibration-matrix-layout__subgroups">
            {group.subgroups.map((subgroup) => (
              <article key={subgroup.key} className="calibration-matrix-layout__subgroup">
                <div className="calibration-matrix-layout__subgroup-header">
                  <strong>{subgroup.label || "Campos gerais"}</strong>
                  <span>{subgroup.fields.length} campos</span>
                </div>

                <div className="calibration-matrix-layout__table-wrap">
                  <table className="calibration-matrix-layout__table">
                    <thead>
                      <tr>
                        {subgroup.fields.map((field) => (
                          <th key={field.id}>
                            <span className="calibration-matrix-layout__th-name">
                              {field.fieldName}
                            </span>
                            {field.measurementName ? (
                              <span className="calibration-matrix-layout__th-unit">
                                {" "}{field.measurementName}
                              </span>
                            ) : null}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {subgroup.fields.map((field) => (
                          <td key={field.id} className="calibration-matrix-layout__cell">
                            {editable && !field.autoCalculated ? (
                              <div className="calibration-matrix-layout__cell-edit">
                                <input
                                  className="calibration-matrix-layout__input"
                                  type="text"
                                  value={field.value}
                                  placeholder="—"
                                  onChange={(event) =>
                                    onValueChange?.(field.id, event.target.value)
                                  }
                                />
                                {renderConfidenceBadge(
                                  field.confidence,
                                  field.value,
                                  showConfidenceIndicators
                                )}
                              </div>
                            ) : (
                              <div className="calibration-matrix-layout__cell-static">
                                <strong>
                                  {field.value ||
                                    (field.autoCalculated
                                      ? "Auto"
                                      : "—")}
                                </strong>
                                {field.autoCalculated ? (
                                  <span className="calibration-matrix-layout__cell-auto">
                                    auto
                                  </span>
                                ) : null}
                                {renderConfidenceBadge(
                                  field.confidence,
                                  field.value,
                                  showConfidenceIndicators && !field.autoCalculated
                                )}
                              </div>
                            )}
                          </td>
                        ))}
                      </tr>
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
