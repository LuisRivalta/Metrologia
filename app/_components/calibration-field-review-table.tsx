"use client";

import type { CalibrationFieldReviewStatus } from "@/lib/calibration-records";

type CalibrationFieldReviewTableRow = {
  id: string | number;
  fieldName: string;
  measurementName: string;
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
                    <strong>{row.value || (row.autoCalculated ? "Calculado automaticamente" : "Nao informado")}</strong>
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
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
