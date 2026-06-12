'use client';

import { useRef, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import {
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Verified as VerifiedIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

export interface CodeEntry {
  id: string;
  code: string;
  status: 'saved' | 'validating' | 'valid' | 'invalid';
  message?: string;
  type?: string;
  priority?: string;
}

interface CodesSectionProps {
  codes: CodeEntry[];
  onChange: (codes: CodeEntry[]) => void;
  validateUrl?: string;
}

const CODE_REGEX = /^\d+(\.\d+)*( \(\d+\))?$/;

const CODE_TYPES = ['Standard', 'Override', 'Temporary', 'Legacy'];
const CODE_PRIORITIES = ['High', 'Medium', 'Low', 'Critical'];

const fieldSx = { '& .MuiOutlinedInput-root fieldset': { borderColor: '#1976d2' } };

export default function CodesSection({ codes, onChange, validateUrl = '/api/mock/validate-code' }: CodesSectionProps) {
  const [codeInput, setCodeInput] = useState('');
  const [codeType, setCodeType] = useState('');
  const [codePriority, setCodePriority] = useState('');
  const [codeError, setCodeError] = useState('');
  const [tableOpen, setTableOpen] = useState(true);
  const [summaryOpen, setSummaryOpen] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  function validateFormat(code: string): string {
    if (!code.trim()) return 'Please enter a code.';
    if (!CODE_REGEX.test(code.trim())) return 'Format must be X.X.X.X or X.X.X.X (Y) — e.g. 3.2.4.5 or 3.2.4.5 (0)';
    if (codes.some((c) => c.code === code.trim())) return 'This code has already been added.';
    return '';
  }

  async function handleAdd() {
    const trimmed = codeInput.trim();
    const err = validateFormat(trimmed);
    if (err) { setCodeError(err); return; }
    setCodeError('');

    const entry: CodeEntry = {
      id: crypto.randomUUID(),
      code: trimmed,
      status: 'validating',
      type: codeType || undefined,
      priority: codePriority || undefined,
    };

    onChange([...codes, entry]);
    setCodeInput('');
    inputRef.current?.focus();

    try {
      const res = await fetch(validateUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed, codeType: codeType || undefined, priority: codePriority || undefined }),
      });
      const data = await res.json();
      onChange(
        codes.concat({ ...entry, status: res.ok ? 'valid' : 'invalid', message: data.message })
      );
    } catch {
      onChange(
        codes.concat({ ...entry, status: 'invalid', message: 'Validation request failed.' })
      );
    }
  }

  function handleRemove(id: string) {
    onChange(codes.filter((c) => c.id !== id));
  }

  const columns: GridColDef[] = [
    {
      field: 'code',
      headerName: 'Code',
      flex: 1,
      renderCell: ({ value }) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{value}</Typography>
      ),
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 120,
      renderCell: ({ value }) => (
        <Typography variant="body2" color={value ? 'text.primary' : 'text.disabled'}>{value || '—'}</Typography>
      ),
    },
    {
      field: 'priority',
      headerName: 'Priority',
      width: 110,
      renderCell: ({ value }) => {
        if (!value) return <Typography variant="body2" color="text.disabled">—</Typography>;
        const color: Record<string, 'error' | 'warning' | 'default' | 'success'> = {
          Critical: 'error', High: 'warning', Medium: 'default', Low: 'success',
        };
        return <Chip label={value} size="small" color={color[value] ?? 'default'} />;
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      renderCell: ({ value, row }) => {
        if (value === 'validating') {
          return (
            <Box display="flex" alignItems="center" gap={1}>
              <CircularProgress size={14} />
              <Typography variant="caption" color="text.secondary">Validating...</Typography>
            </Box>
          );
        }
        if (value === 'saved') return <Chip icon={<CheckCircleIcon />} label="Saved" color="primary" size="small" />;
        if (value === 'valid') return <Chip icon={<CheckCircleIcon />} label="Valid" color="success" size="small" />;
        return <Chip icon={<CancelIcon />} label="Invalid" color="error" size="small" />;
      },
    },
    {
      field: 'message',
      headerName: 'Message',
      flex: 1.2,
      renderCell: ({ value, row }) => (
        <Typography variant="caption" color="text.secondary">
          {row.status === 'saved' ? 'Previously validated' : (value ?? '—')}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: '',
      width: 60,
      sortable: false,
      renderCell: ({ row }) => (
        <IconButton size="small" onClick={() => handleRemove(row.id)} disabled={row.status === 'validating'}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  return (
    <Box>
      {/* Two dropdowns + code input row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2 }}>
        <TextField
          select
          label="Code Type"
          value={codeType}
          onChange={(e) => setCodeType(e.target.value)}
          size="medium"
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
          sx={fieldSx}
        >
          <MenuItem value=""><em>Any</em></MenuItem>
          {CODE_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
        </TextField>
        <TextField
          select
          label="Priority"
          value={codePriority}
          onChange={(e) => setCodePriority(e.target.value)}
          size="medium"
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
          sx={fieldSx}
        >
          <MenuItem value=""><em>None</em></MenuItem>
          {CODE_PRIORITIES.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
        </TextField>
      </Box>

      {/* Code input + validate button */}
      <Box display="flex" gap={1} alignItems="flex-start" sx={{ mb: 2 }}>
        <TextField
          inputRef={inputRef}
          label="Code"
          placeholder="e.g. 3.2.4.5 (0)"
          value={codeInput}
          onChange={(e) => { setCodeInput(e.target.value); setCodeError(''); }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          error={!!codeError}
          helperText={codeError || 'Press Enter or click Validate & Add'}
          size="medium"
          sx={{ width: 300, ...fieldSx }}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <Button
          variant="contained"
          onClick={handleAdd}
          size="large"
          startIcon={<VerifiedIcon />}
          sx={{ height: '56px', textTransform: 'none', borderRadius: '6px', bgcolor: '#1a2744', '&:hover': { bgcolor: '#1976d2' } }}
        >
          Validate & Add
        </Button>
      </Box>

      {/* Two-column summary table */}
      <Box
        display="flex"
        alignItems="center"
        onClick={() => setSummaryOpen((p) => !p)}
        sx={{ cursor: 'pointer', mb: 0.5, userSelect: 'none', width: 'fit-content' }}
      >
        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Summary
        </Typography>
        <IconButton size="small" component="span" tabIndex={-1}>
          {summaryOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
      </Box>
      <Collapse in={summaryOpen}>
      <Box
        component="table"
        sx={{
          width: '100%',
          maxWidth: 500,
          mb: 3,
          borderCollapse: 'collapse',
          fontSize: '0.8125rem',
          '& th': {
            textAlign: 'left',
            fontWeight: 600,
            color: 'text.secondary',
            bgcolor: '#f5f5f5',
            px: 1.5,
            py: 1,
            borderBottom: '1px solid #e0e0e0',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontSize: '0.75rem',
          },
          '& td': {
            px: 1.5,
            py: 0.75,
            borderBottom: '1px solid #f5f5f5',
            color: 'text.primary',
          },
          '& tr:last-child td': { borderBottom: 'none' },
        }}
      >
        <thead>
          <tr>
            <Box component="th">Field</Box>
            <Box component="th">Value</Box>
          </tr>
        </thead>
        <tbody>
          <tr>
            <Box component="td" sx={{ color: 'text.secondary' }}>Code Type</Box>
            <Box component="td">{codeType || <Box component="span" sx={{ color: 'text.disabled' }}>Not set</Box>}</Box>
          </tr>
          <tr>
            <Box component="td" sx={{ color: 'text.secondary' }}>Priority</Box>
            <Box component="td">{codePriority || <Box component="span" sx={{ color: 'text.disabled' }}>Not set</Box>}</Box>
          </tr>
          <tr>
            <Box component="td" sx={{ color: 'text.secondary' }}>Codes added</Box>
            <Box component="td">{codes.length}</Box>
          </tr>
          <tr>
            <Box component="td" sx={{ color: 'text.secondary' }}>Valid</Box>
            <Box component="td">{codes.filter((c) => c.status === 'valid' || c.status === 'saved').length}</Box>
          </tr>
          <tr>
            <Box component="td" sx={{ color: 'text.secondary' }}>Pending validation</Box>
            <Box component="td">{codes.filter((c) => c.status === 'validating').length}</Box>
          </tr>
        </tbody>
      </Box>
      </Collapse>

      {/* Collapsible codes table */}
      {codes.length > 0 && (
        <Box>
          <Box
            display="flex"
            alignItems="center"
            onClick={() => setTableOpen((p) => !p)}
            sx={{ cursor: 'pointer', mb: 0.5, userSelect: 'none', width: 'fit-content' }}
          >
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {codes.length} code{codes.length !== 1 ? 's' : ''}
            </Typography>
            <IconButton size="small" component="span" tabIndex={-1}>
              {tableOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
          </Box>
          <Collapse in={tableOpen}>
            <Box sx={{ height: Math.min(56 + codes.length * 52, 320) }}>
              <DataGrid
                rows={codes}
                columns={columns}
                hideFooter
                disableColumnMenu
                disableRowSelectionOnClick
                sx={{
                  border: 'none',
                  '& .MuiDataGrid-columnHeaders': { bgcolor: '#f5f5f5' },
                  '& .MuiDataGrid-columnHeader': { bgcolor: '#f5f5f5' },
                  '& .MuiDataGrid-cell': { borderBottom: '1px solid #f0f0f0' },
                }}
              />
            </Box>
          </Collapse>
        </Box>
      )}
    </Box>
  );
}
