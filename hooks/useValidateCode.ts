'use client';

import { useMutation } from '@tanstack/react-query';

export interface ValidateCodePayload {
  code: string;
  codeType?: string;
  priority?: string;
}

export interface ValidateCodeResult {
  valid: boolean;
  message?: string;
}

async function validateCode(payload: ValidateCodePayload, url: string): Promise<ValidateCodeResult> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Validation failed: ${res.statusText}`);
  const data = await res.json();
  return { valid: true, message: data.message };
}

export function useValidateCode(url: string) {
  return useMutation<ValidateCodeResult, Error, ValidateCodePayload>({
    mutationFn: (payload) => validateCode(payload, url),
  });
}
