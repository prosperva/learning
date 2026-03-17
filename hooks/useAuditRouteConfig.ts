'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface AuditRouteConfig {
  id: number;
  route: string;
  tableName: string;
}

const KEY = ['audit-route-config'];

async function fetchAll(): Promise<AuditRouteConfig[]> {
  const res = await fetch('/api/audit/route-config');
  if (!res.ok) throw new Error('Failed to load audit route config');
  return res.json();
}

export function useAuditRouteConfigs() {
  return useQuery({ queryKey: KEY, queryFn: fetchAll });
}

export function useCreateAuditRouteConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<AuditRouteConfig, 'id'>) =>
      fetch('/api/audit/route-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(r => { if (!r.ok) throw new Error('Failed to create'); return r.json(); }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateAuditRouteConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AuditRouteConfig) =>
      fetch(`/api/audit/route-config/${body.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(r => { if (!r.ok) throw new Error('Failed to update'); return r.json(); }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteAuditRouteConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/audit/route-config/${id}`, { method: 'DELETE' })
        .then(r => { if (!r.ok) throw new Error('Failed to delete'); }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
