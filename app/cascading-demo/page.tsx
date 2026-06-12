'use client';

import { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  Divider,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import {
  Save as SaveIcon,
  SearchOff as SearchOffIcon,
} from '@mui/icons-material';
import CascadingDropdowns from '@/components/CascadingDropdowns/CascadingDropdowns';
import CodesSection, { CodeEntry } from '@/components/CodesSection/CodesSection';
import { useSaveForm } from '@/hooks/useSaveForm';

interface Item {
  id: string | number;
  name: string;
  parentId?: string | number | null;
}

const FAKE_CATEGORIES: Item[] = [
  { id: 1, name: 'Electronics', parentId: null },
  { id: 2, name: 'Clothing', parentId: null },
  { id: 3, name: 'Home & Garden', parentId: null },
  { id: 4, name: 'Sports', parentId: null },
  { id: 10, name: 'Laptops', parentId: 1 },
  { id: 11, name: 'Smartphones', parentId: 1 },
  { id: 12, name: 'Tablets', parentId: 1 },
  { id: 13, name: 'Accessories', parentId: 1 },
  { id: 20, name: "Men's", parentId: 2 },
  { id: 21, name: "Women's", parentId: 2 },
  { id: 22, name: "Kids'", parentId: 2 },
  { id: 30, name: 'Furniture', parentId: 3 },
  { id: 31, name: 'Kitchen', parentId: 3 },
  { id: 32, name: 'Garden Tools', parentId: 3 },
  { id: 40, name: 'Outdoor', parentId: 4 },
  { id: 41, name: 'Fitness', parentId: 4 },
  { id: 42, name: 'Team Sports', parentId: 4 },
];

const fieldSx = { '& .MuiOutlinedInput-root fieldset': { borderColor: '#1976d2' } };

export default function CascadingDemoPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<{ parent: Item; child: Item | null } | null>(null);
  const [codes, setCodes] = useState<CodeEntry[]>([]);
  const [toast, setToast] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

  const hasValidating = codes.some((c) => c.status === 'validating');

  const saveForm = useSaveForm();

  function handleSave() {
    saveForm.mutate(
      {
        name,
        description,
        category: category?.parent?.name,
        subCategory: category?.child?.name ?? null,
        codes: codes
          .filter((c) => c.status === 'valid' || c.status === 'saved')
          .map((c) => ({ code: c.code, type: c.type, priority: c.priority })),
      },
      {
        onSuccess: (data) => setToast({ message: `Saved! Reference: ${data.referenceNumber}`, severity: 'success' }),
        onError: () => setToast({ message: 'Failed to save. Please try again.', severity: 'error' }),
      }
    );
  }

  return (
    <Container maxWidth={false} disableGutters sx={{ py: 4, px: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Typography sx={{ mb: 2, fontFamily: 'Arial, sans-serif', fontSize: '1.5rem', lineHeight: 1.334, fontWeight: 400 }}>
        New Submission
      </Typography>

      <Paper elevation={2} sx={{ p: 3, borderRadius: '8px' }}>

        {/* General Information */}
        <Typography sx={{ mb: 2, fontFamily: 'Arial, sans-serif', fontSize: '0.875rem', fontWeight: 700 }}>
          General Information
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 3 }}>
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            size="medium"
            slotProps={{ inputLabel: { shrink: true } }}
            sx={fieldSx}
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            size="medium"
            slotProps={{ inputLabel: { shrink: true } }}
            sx={fieldSx}
          />
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Category */}
        <Typography sx={{ mb: 2, fontFamily: 'Arial, sans-serif', fontSize: '0.875rem', fontWeight: 700 }}>
          Category
        </Typography>
        <Box sx={{ maxWidth: 500, mb: 3 }}>
          <CascadingDropdowns
            mockData={FAKE_CATEGORIES}
            parentLabel="Category"
            childLabel="Sub-category"
            onSelect={(parent, child) => setCategory({ parent, child })}
          />
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Codes */}
        <Typography sx={{ mb: 0.5, fontFamily: 'Arial, sans-serif', fontSize: '0.875rem', fontWeight: 700 }}>
          Codes
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          Enter codes in the format <strong>X.X.X.X</strong> or <strong>X.X.X.X (Y)</strong>. Each code will be validated before being added.
        </Typography>
        <CodesSection codes={codes} onChange={setCodes} />

        <Divider sx={{ mt: 3, mb: 3 }} />

        {/* Save */}
        {saveForm.data && (
          <Alert severity="success" sx={{ mb: 2 }}>
            <strong>Saved!</strong> Reference: <strong>{saveForm.data.referenceNumber}</strong>
            {saveForm.data.link && (
              <> &nbsp;·&nbsp; <Box component="a" href={saveForm.data.link} target="_blank" rel="noopener noreferrer" sx={{ color: 'inherit' }}>{saveForm.data.link}</Box></>
            )}
          </Alert>
        )}
        <Box display="flex" gap={2} justifyContent="flex-start">
          <Button
            variant="outlined"
            size="large"
            startIcon={<SearchOffIcon />}
            onClick={() => { setName(''); setDescription(''); setCategory(null); setCodes([]); saveForm.reset(); }}
            sx={{ textTransform: 'none', borderRadius: '6px', borderColor: '#90caf9', color: '#1976d2', bgcolor: '#fff', width: '250px', '&:hover': { borderColor: '#1976d2', bgcolor: '#f5f9ff' } }}
          >
            Reset
          </Button>
          <Button
            variant="contained"
            size="large"
            startIcon={saveForm.isPending ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
            onClick={handleSave}
            disabled={saveForm.isPending || !name || hasValidating}
            sx={{ textTransform: 'none', borderRadius: '6px', bgcolor: '#1a2744', width: '250px', '&:hover': { bgcolor: '#1976d2' } }}
          >
            {saveForm.isPending ? 'Saving...' : 'Save'}
          </Button>
        </Box>
        {!name && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            A name is required to save.
          </Typography>
        )}
      </Paper>

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={toast?.severity} onClose={() => setToast(null)} sx={{ width: '100%' }}>
          {toast?.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
