'use client';

import { useRef, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Skeleton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  AttachFile as AttachFileIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';
import { useAttachments, useUploadAttachment, useDeleteAttachment } from '@/hooks/useAttachments';
import type { Attachment } from '@/hooks/useAttachments';

interface AttachmentsSectionProps {
  productId: number;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function AttachmentsSection({ productId }: AttachmentsSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const {
    data: attachmentsData,
    isLoading,
    isError,
    error: fetchError,
  } = useAttachments(productId);

  const uploadMutation = useUploadAttachment();
  const deleteMutation = useDeleteAttachment();

  const attachments = attachmentsData?.attachments ?? [];

  const handleAddClick = () => {
    setUploadError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await uploadMutation.mutateAsync({ productId, file });
      setUploadError(null);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    }

    // Reset so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (attachmentId: string) => {
    await deleteMutation.mutateAsync({ productId, attachmentId });
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AttachFileIcon color="action" />
          <Typography variant="h6" component="h2">
            Attachments
          </Typography>
          {!isLoading && (
            <Typography variant="body2" color="text.secondary">
              ({attachments.length})
            </Typography>
          )}
        </Box>
        <Button
          variant="outlined"
          startIcon={
            uploadMutation.isPending ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <AddIcon />
            )
          }
          onClick={handleAddClick}
          disabled={uploadMutation.isPending}
          size="small"
        >
          {uploadMutation.isPending ? 'Uploading...' : 'Add'}
        </Button>
      </Box>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Errors */}
      {uploadError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setUploadError(null)}>
          {uploadError}
        </Alert>
      )}
      {deleteMutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to delete: {deleteMutation.error?.message || 'Unknown error'}
        </Alert>
      )}
      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load attachments: {(fetchError as Error)?.message || 'Unknown error'}
        </Alert>
      )}

      {/* Loading */}
      {isLoading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Skeleton variant="rounded" height={40} />
          <Skeleton variant="rounded" height={40} />
        </Box>
      )}

      {/* Empty state */}
      {!isLoading && attachments.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
          No attachments yet. Click &quot;Add&quot; to upload a file.
        </Typography>
      )}

      {/* Attachments table */}
      {!isLoading && attachments.length > 0 && (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>File</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Uploaded</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attachments.map((attachment: Attachment) => (
                <TableRow key={attachment.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FileIcon fontSize="small" color="action" />
                      <Typography variant="body2" noWrap sx={{ maxWidth: 250 }}>
                        {attachment.fileName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatFileSize(attachment.fileSize)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {attachment.mimeType}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(attachment.uploadedAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Download attachment">
                      <IconButton
                        size="small"
                        component="a"
                        href={attachment.url}
                        download={attachment.fileName}
                      >
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete attachment">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(attachment.id)}
                        disabled
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}
