import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { fetchAuditLogs, AuditLogsParams, AuditLogPagedResult } from '@/lib/api/auditLogs';

export const auditLogKeys = {
  all: ['auditLogs'] as const,
  lists: () => [...auditLogKeys.all, 'list'] as const,
  list: (params: AuditLogsParams) => [...auditLogKeys.lists(), params] as const,
};

export function useAuditLogs(
  params: AuditLogsParams,
  options?: { enabled?: boolean }
) {
  return useQuery<AuditLogPagedResult, Error>({
    queryKey: auditLogKeys.list(params),
    queryFn: () => fetchAuditLogs(params),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? (!!params.entityKey && !!params.recordId),
  });
}
