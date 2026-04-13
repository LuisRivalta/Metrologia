"use client";

import type { CalibrationFieldReviewStatus } from "@/lib/calibration-records";

type CalibrationFieldReviewTableRow = {
  id: string | number;
  fieldName: string;
  measurementName: string;
  value: string;
  unit?: string;
  confidence: number | null;
  evidence: string;
  status: CalibrationFieldReviewStatus;
};

type CalibrationFieldReviewTableProps = {
  rows: CalibrationFieldReviewTableRow[];
  emptyMessage: string;
  editable?: boolean;
  onValueChange?: (rowId: string | number, value: string) => void;
  onStatusChange?: (rowId: string | number, status: CalibrationFieldReviewStatus) => void;
};

function formatConfidence(confidence: number | null) {
  if (confidence === null) {
    return "Sem confianca";
  }

  return `${Math.round(confidence * 100)}% de confianca`;
}

function getStatusLabel(status: CalibrationFieldReviewStatus) {
  if (status === "conforming") return "Conforme";
  if (status === "non_conforming") return "Nao conforme";
  return "Nao identificado";
}

export function CalibrationFieldReviewTable({
  rows,
  emptyMessage,
  editable = false,
  onValueChange,
  onStatusChange
}: CalibrationFieldReviewTableProps) {
  if (rows.length === 0) {
    return <div className="calibration-field-table__empty">{emptyMessage}</div>;
  }

  return (
    <div className="calibration-field-table__wrap">
      <table className="calibration-field-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Campo</th>
            <th>Medida</th>
            <th>Valor</th>
            <th>Apoio</th>
            <th>Conforme</th>
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
                {editable ? (
                  <input
                    type="text"
                    value={row.value}
                    placeholder="Ex: 0,005"
                    onChange={(event) => onValueChange?.(row.id, event.target.value)}
                  />
                ) : (
                  <strong>{row.value || "Nao informado"}</strong>
                )}
              </td>
              <td className="calibration-field-table__support">
                <span>{formatConfidence(row.confidence)}</span>
                <p>{row.evidence || "Sem evidencia destacada."}</p>
              </td>
              <td className="calibration-field-table__status">
                {editable ? (
                  <label className="calibration-field-table__check">
                    <input
                      type="checkbox"
                      checked={row.status === "conforming"}
                      onChange={(event) =>
                        onStatusChange?.(
                          row.id,
                          event.target.checked ? "conforming" : "unknown"
                        )
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
