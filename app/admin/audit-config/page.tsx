'use client';

import React, { useEffect, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Skeleton,
  Snackbar,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TableChartIcon from '@mui/icons-material/TableChart';
import SaveIcon from '@mui/icons-material/Save';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuditFieldConfig {
  fieldName: string;
  displayName: string;
  isEnabled: boolean;
}

interface AuditTableConfig {
  tableName: string;
  fields: AuditFieldConfig[];
}

// ── API helpers ───────────────────────────────────────────────────────────────

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

// ── Field row (controlled, no own mutation) ───────────────────────────────────

function FieldRow({
  field,
  onToggle,
  onDisplayNameChange,
}: {
  field: AuditFieldConfig;
  onToggle: (isEnabled: boolean) => void;
  onDisplayNameChange: (name: string) => void;
}) {
  return (
    <TableRow hover>
      <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary', fontSize: 13 }}>
        {field.fieldName}
      </TableCell>
      <TableCell>
        <TextField
          size="small"
          value={field.displayName}
          onChange={e => onDisplayNameChange(e.target.value)}
          variant="outlined"
          sx={{ width: 220 }}
        />
      </TableCell>
      <TableCell align="center">
        <Switch
          checked={field.isEnabled}
          onChange={e => onToggle(e.target.checked)}
          color="primary"
        />
      </TableCell>
    </TableRow>
  );
}

// ── Table section (owns local state + save button) ────────────────────────────

function TableSection({
  table,
  onSaved,
}: {
  table: AuditTableConfig;
  onSaved: (msg: string) => void;
}) {
  const queryClient = useQueryClient();
  const [localFields, setLocalFields] = useState<AuditFieldConfig[]>(table.fields);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Sync when server data refreshes after a successful save
  useEffect(() => {
    setLocalFields(table.fields);
  }, [table.fields]);

  const changedFields = localFields.filter((lf) => {
    const server = table.fields.find(f => f.fieldName === lf.fieldName);
    return server && (lf.isEnabled !== server.isEnabled || lf.displayName !== server.displayName);
  });
  const isDirty = changedFields.length > 0;

  const handleToggle = (fieldName: string, isEnabled: boolean) =>
    setLocalFields(prev => prev.map(f => f.fieldName === fieldName ? { ...f, isEnabled } : f));

  const handleDisplayNameChange = (fieldName: string, displayName: string) =>
    setLocalFields(prev => prev.map(f => f.fieldName === fieldName ? { ...f, displayName } : f));

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await batchUpdateFields(table.tableName, changedFields);
      await queryClient.invalidateQueries({ queryKey: ['audit-config'] });
      onSaved(
        `${table.tableName} saved — ${changedFields.length} field${changedFields.length > 1 ? 's' : ''} updated`
      );
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const enabledCount = localFields.filter(f => f.isEnabled).length;

  return (
    <Accordion key={table.tableName} defaultExpanded={false} disableGutters>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TableChartIcon fontSize="small" color="action" />
          <Typography fontWeight={500}>{table.tableName}</Typography>
          <Typography variant="caption" color="text.secondary">
            ({enabledCount}/{localFields.length} fields enabled)
          </Typography>
          {isDirty && (
            <Chip
              label={`${changedFields.length} unsaved`}
              color="warning"
              size="small"
              sx={{ ml: 1 }}
            />
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 600, width: 180 }}>Field</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Display Name</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 100 }} align="center">
                Enabled
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {localFields.map(field => (
              <FieldRow
                key={field.fieldName}
                field={field}
                onToggle={isEnabled => handleToggle(field.fieldName, isEnabled)}
                onDisplayNameChange={name => handleDisplayNameChange(field.fieldName, name)}
              />
            ))}
          </TableBody>
        </Table>

        {saveError && (
          <Alert severity="error" sx={{ m: 1 }}>
            {saveError}
          </Alert>
        )}

        {isDirty && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button
              variant="contained"
              size="small"
              startIcon={isSaving ? <CircularProgress size={14} color="inherit" /> : <SaveIcon />}
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving…' : 'Save Changes'}
            </Button>
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AuditConfigPage() {
  const [toast, setToast] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['audit-config'],
    queryFn: fetchConfig,
  });

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Skeleton variant="text" width={300} height={40} />
        <Skeleton variant="text" width={500} height={24} sx={{ mb: 3 }} />
        {[1, 2].map(i => (
          <Skeleton key={i} variant="rounded" height={56} sx={{ mb: 1 }} />
        ))}
      </Container>
    );
  }

  if (isError) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">Failed to load audit configuration.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Audit Configuration
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Choose which fields are tracked in audit history. Tables and fields are auto-discovered from
        the data model — no setup required. Nothing is audited until you enable a field.
      </Typography>

      {data?.map(table => (
        <TableSection key={table.tableName} table={table} onSaved={msg => setToast(msg)} />
      ))}

      <Snackbar
        open={!!toast}
        autoHideDuration={2500}
        onClose={() => setToast(null)}
        message={toast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Container>
  );
}
