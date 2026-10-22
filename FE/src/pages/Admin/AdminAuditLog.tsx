import { useEffect, useState } from "react";
import { adminListAuditLog, type AuditLogEntry } from "../../api/adminAuditLog";

const VERB_LABELS: Record<string, string> = {
  create: "Sukurta",
  update: "Koreguota",
  delete: "Ištrinta",
  cancel: "Atšaukta",
};

const ENTITY_LABELS: Record<string, string> = {
  Trip: "Kelionė",
  Discount: "Nuolaidos kodas",
  Order: "Užsakymas",
};

function formatAction(action: string): string {
  const verb = action.split(".")[1];
  return (verb && VERB_LABELS[verb]) ?? action;
}

function formatEntity(entityType: string): string {
  return ENTITY_LABELS[entityType] ?? entityType;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("lt-LT", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPayload(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  return Object.entries(payload as Record<string, unknown>)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
}

export default function AdminAuditLog() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    adminListAuditLog()
      .then((list) => {
        if (!cancelled) setEntries(list);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>Veiksmų žurnalas</h1>
          <p>Kas ir kada sukūrė/redagavo/ištrynė keliones ir nuolaidų kodus.</p>
        </div>
      </div>

      <div className="admin-card admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Laikas</th>
              <th>Adminas</th>
              <th>Veiksmas</th>
              <th>Objektas</th>
              <th>Detalės</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>{formatDateTime(entry.createdAt)}</td>
                <td>{entry.admin.email}</td>
                <td>{formatAction(entry.action)}</td>
                <td>{formatEntity(entry.entityType)}</td>
                <td className="admin-muted">{formatPayload(entry.payload)}</td>
              </tr>
            ))}
            {!loading && entries.length === 0 && (
              <tr>
                <td colSpan={5} className="admin-empty">
                  Įrašų dar nėra.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
