export interface AuditChange {
  Old: string | null;
  New: string | null;
}

export interface AuditLog {
  id: number;
  tableName: string;
  recordId: string;
  operation: string;
  modifiedBy: string;
  modifiedDate: string;
  changes: Record<string, AuditChange>;
}

export interface AuditLogPagedResult {
  data: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AuditLogsParams {
  tableName: string;
  recordId: string | number;
  page?: number;
  pageSize?: number;
}

export async function fetchAuditLogs(params: AuditLogsParams): Promise<AuditLogPagedResult> {
  const { tableName, recordId, page = 0, pageSize = 500 } = params;

  const response = await fetch(
    `/api/audit/${tableName}/${recordId}?page=${page}&pageSize=${pageSize}`,
    { credentials: 'include' }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Failed to fetch audit logs: ${response.statusText}`);
  }

  return response.json();
}
