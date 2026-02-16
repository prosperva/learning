'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAttachments,
  uploadAttachment,
  deleteAttachment,
  type Attachment,
  type AttachmentsResponse,
} from '@/lib/api/products';

// Query keys factory
export const attachmentKeys = {
  all: ['attachments'] as const,
  lists: () => [...attachmentKeys.all, 'list'] as const,
  list: (productId: number) => [...attachmentKeys.lists(), productId] as const,
};

export function useAttachments(productId: number, options?: { enabled?: boolean }) {
  return useQuery<AttachmentsResponse, Error>({
    queryKey: attachmentKeys.list(productId),
    queryFn: () => fetchAttachments(productId),
    enabled: (options?.enabled ?? true) && !isNaN(productId),
    staleTime: 1 * 60 * 1000,
  });
}

export function useUploadAttachment() {
  const queryClient = useQueryClient();

  return useMutation<
    { attachment: Attachment },
    Error,
    { productId: number; file: File }
  >({
    mutationFn: ({ productId, file }) => uploadAttachment(productId, file),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: attachmentKeys.list(productId) });
    },
  });
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    { productId: number; attachmentId: string }
  >({
    mutationFn: ({ productId, attachmentId }) => deleteAttachment(productId, attachmentId),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: attachmentKeys.list(productId) });
    },
  });
}

export type { Attachment, AttachmentsResponse };
