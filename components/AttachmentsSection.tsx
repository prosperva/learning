'use client';

import { useRef } from 'react';
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
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  AttachFile as AttachFileIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';

export interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  url: string;
}

interface AttachmentsSectionProps {
  attachments: Attachment[];
  onAdd: (file: File) => void;
  onDelete: (id: string) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function AttachmentsSection({ attachments, onAdd, onDelete }: AttachmentsSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onAdd(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
          <Typography variant="body2" color="text.secondary">
            ({attachments.length})
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={() => fileInputRef.current?.click()} size="small">
          Add
        </Button>
      </Box>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" onChange={handleFileChange} style={{ display: 'none' }} />

      {/* Empty state */}
      {attachments.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
          No attachments yet. Click &quot;Add&quot; to upload a file.
        </Typography>
      )}

      {/* Attachments table */}
      {attachments.length > 0 && (
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
              {attachments.map(attachment => (
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
                    <Typography variant="body2">{formatFileSize(attachment.fileSize)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">{attachment.mimeType}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(attachment.uploadedAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Download attachment">
                      <IconButton size="small" component="a" href={attachment.url} download={attachment.fileName}>
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete attachment">
                      <IconButton size="small" color="error" onClick={() => onDelete(attachment.id)}>
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
