'use client';

import React, { useEffect, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Checkbox,
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
  Tooltip,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TableChartIcon from '@mui/icons-material/TableChart';
import SaveIcon from '@mui/icons-material/Save';
import SearchIcon from '@mui/icons-material/Search';
import {
  useAuditConfig,
  useBatchUpdateAuditFields,
  type AuditFieldConfig,
  type AuditTableConfig,
} from '@/hooks/useAuditConfig';

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
  const [localFields, setLocalFields] = useState<AuditFieldConfig[]>(table.fields);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fieldFilter, setFieldFilter] = useState('');

  const mutation = useBatchUpdateAuditFields();

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
    setSaveError(null);
    try {
      await mutation.mutateAsync({ tableName: table.tableName, fields: changedFields });
      onSaved(`${table.tableName} saved — ${changedFields.length} field${changedFields.length > 1 ? 's' : ''} updated`);
    } catch (e) {
      setSaveError((e as Error).message);
    }
  };

  const enabledCount = localFields.filter(f => f.isEnabled).length;
  const allEnabled = enabledCount === localFields.length;
  const someEnabled = enabledCount > 0 && !allEnabled;

  const handleToggleAll = () =>
    setLocalFields(prev => prev.map(f => ({ ...f, isEnabled: !allEnabled })));

  const sortedFields = [...localFields].sort((a, b) => Number(b.isEnabled) - Number(a.isEnabled));
  const visibleFields = fieldFilter.trim()
    ? sortedFields.filter(f =>
        f.fieldName.toLowerCase().includes(fieldFilter.toLowerCase()) ||
        f.displayName.toLowerCase().includes(fieldFilter.toLowerCase())
      )
    : sortedFields;

  return (
    <Accordion
      key={table.tableName}
      defaultExpanded={false}
      disableGutters
      sx={{ mb: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden', '&:before': { display: 'none' } }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
          <TableChartIcon fontSize="small" color="action" />
          <Typography fontWeight={500}>{table.tableName}</Typography>
          <Chip
            label={`${enabledCount} / ${localFields.length}`}
            size="small"
            variant="outlined"
            color={enabledCount > 0 ? 'primary' : 'default'}
          />
          {isDirty && (
            <Chip label={`${changedFields.length} unsaved`} color="warning" size="small" />
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        {localFields.length > 8 && (
          <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
            <TextField
              placeholder="Filter fields…"
              size="small"
              fullWidth
              value={fieldFilter}
              onChange={e => setFieldFilter(e.target.value)}
              slotProps={{ input: { startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.disabled' }} /> } }}
            />
          </Box>
        )}
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 600, width: 180, color: 'text.secondary', fontSize: 12 }}>FIELD</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: 12 }}>DISPLAY NAME</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 100, color: 'text.secondary', fontSize: 12 }} align="center">
                <Tooltip title={allEnabled ? 'Disable all' : 'Enable all'}>
                  <Checkbox
                    size="small"
                    checked={allEnabled}
                    indeterminate={someEnabled}
                    onChange={handleToggleAll}
                    sx={{ p: 0.5 }}
                  />
                </Tooltip>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleFields.map(field => (
              <FieldRow
                key={field.fieldName}
                field={field}
                onToggle={isEnabled => handleToggle(field.fieldName, isEnabled)}
                onDisplayNameChange={name => handleDisplayNameChange(field.fieldName, name)}
              />
            ))}
            {visibleFields.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ color: 'text.secondary', py: 2 }}>
                  No fields match &quot;{fieldFilter}&quot;.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {saveError && (
          <Alert severity="error" sx={{ m: 1 }}>
            {saveError}
          </Alert>
        )}

        {isDirty && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button
              size="small"
              onClick={() => setLocalFields(table.fields)}
              disabled={mutation.isPending}
            >
              Discard
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={mutation.isPending ? <CircularProgress size={14} color="inherit" /> : <SaveIcon />}
              onClick={handleSave}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Saving…' : 'Save Changes'}
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
  const [filter, setFilter] = useState('');

  const { data, isLoading, isError } = useAuditConfig();

  const filtered = filter.trim()
    ? data?.filter(t => t.tableName.toLowerCase().includes(filter.toLowerCase()))
    : data;

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

      <TextField
        placeholder="Filter tables…"
        size="small"
        fullWidth
        sx={{ mb: 2 }}
        value={filter}
        onChange={e => setFilter(e.target.value)}
        slotProps={{ input: { startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.disabled' }} /> } }}
      />

      {filtered?.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No tables match &quot;{filter}&quot;.
        </Typography>
      )}

      {filtered?.map(table => (
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
