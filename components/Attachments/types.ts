export interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  url: string;
}

export interface AttachmentsSectionProps {
  attachments: Attachment[];
  onAdd: (file: File) => void;
  onDelete: (id: string) => void;
}
