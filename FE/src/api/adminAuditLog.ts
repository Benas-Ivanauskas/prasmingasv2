const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export interface AuditLogEntry {
  id: string;
  adminId: string;
  admin: { email: string };
  action: string;
  entityType: string;
  entityId: string;
  payload: unknown;
  createdAt: string;
}

export async function adminListAuditLog(): Promise<AuditLogEntry[]> {
  const res = await fetch(`${API_URL}/api/admin/audit-log`, { credentials: "include" });
  if (!res.ok) throw new Error("Nepavyko gauti audit log įrašų");
  return res.json();
}
