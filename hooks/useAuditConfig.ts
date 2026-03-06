'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface AuditFieldConfig {
  fieldName: string;
  displayName: string;
  isEnabled: boolean;
}

export interface AuditTableConfig {
  tableName: string;
  fields: AuditFieldConfig[];
}

async function fetchConfig(): Promise<AuditTableConfig[]> {
  const res = await fetch('/api/audit/config');
  if (!res.ok) throw new Error('Failed to load audit config');
  return res.json();
}

async function batchUpdateFields(
  tableName: string,
  fields: AuditFieldConfig[]
): Promise<AuditFieldConfig[]> {
  const res = await fetch(`/api/audit/config/${tableName}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields.map(f => ({
      fieldName: f.fieldName,
      isEnabled: f.isEnabled,
      displayName: f.displayName,
    }))),
  });
  if (!res.ok) throw new Error('Failed to update field config');
  return res.json();
}

export function useAuditConfig() {
  return useQuery({
    queryKey: ['audit-config'],
    queryFn: fetchConfig,
    staleTime: 60_000,
  });
}

export function useBatchUpdateAuditFields() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tableName, fields }: { tableName: string; fields: AuditFieldConfig[] }) =>
      batchUpdateFields(tableName, fields),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-config'] });
    },
  });
}
