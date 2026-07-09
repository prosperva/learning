'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Code {
  id: string;
  code: string;
  status: string;
}

export interface Submission {
  id: string;
  name: string;
  description: string;
  category: string;
  subCategory: string | null;
  codes: Code[];
  createdAt: string;
  referenceNumber: string;
  link?: string;
}

export const submissionKeys = {
  all: ['submissions'] as const,
  pcfs: ['submissions', 'pcfs'] as const,
};

async function fetchSubmissions(): Promise<Submission[]> {
  const res = await fetch('/api/mock/submissions');
  if (!res.ok) throw new Error('Failed to load submissions.');
  return res.json();
}

export function useSubmissions() {
  return useQuery<Submission[], Error>({
    queryKey: submissionKeys.all,
    queryFn: fetchSubmissions,
  });
}

export function useDeleteSubmission() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      // optimistic — remove from cache immediately
      queryClient.setQueryData<Submission[]>(submissionKeys.all, (prev) =>
        prev ? prev.filter((r) => r.id !== id) : []
      );
    },
  });
}
