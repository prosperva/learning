'use client';

import { useMutation } from '@tanstack/react-query';

export interface SaveFormPayload {
  name: string;
  description?: string;
  category?: string | null;
  subCategory?: string | null;
  codes: { code: string; type?: string; priority?: string }[];
}

export interface SaveFormResult {
  referenceNumber: string;
  submittedAt: string;
  link?: string;
}

async function saveForm(payload: SaveFormPayload): Promise<SaveFormResult> {
  const res = await fetch('/api/mock/save-form', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Save failed: ${res.statusText}`);
  return res.json();
}

export function useSaveForm() {
  return useMutation<SaveFormResult, Error, SaveFormPayload>({
    mutationFn: saveForm,
  });
}
