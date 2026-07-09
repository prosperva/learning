'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSubmissions, useDeleteSubmission } from '@/hooks/useSubmissions';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  OpenInNew as OpenInNewIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';

export default function SubmissionsListPage() {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const { data: rows = [], isLoading: loading, isError } = useSubmissions();
  const deleteSubmission = useDeleteSubmission();

  return (
    <Container maxWidth={false} disableGutters sx={{ py: 4, px: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography sx={{ fontFamily: 'Arial, sans-serif', fontSize: '1.5rem', lineHeight: 1.334, fontWeight: 400 }}>
          Submissions
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push('/cascading-demo')}
          sx={{ textTransform: 'none', borderRadius: '6px', bgcolor: '#1a2744', '&:hover': { bgcolor: '#1976d2' } }}
        >
          New Submission
        </Button>
      </Box>

      {isError && <Alert severity="error" sx={{ mb: 2 }}>Failed to load submissions.</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" pt={8}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper elevation={2} sx={{ borderRadius: '8px', overflow: 'hidden' }}>
          {/* Header row */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '2fr 2fr 2fr 1fr 1fr 1.5fr',
              px: 2,
              py: 1.5,
              bgcolor: '#f5f5f5',
              borderBottom: '1px solid #e0e0e0',
            }}
          >
            {['Reference', 'Name', 'Description', 'Category', 'Codes', 'Link'].map((h) => (
              <Typography key={h} variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {h}
              </Typography>
            ))}
          </Box>

          {rows.map((row, idx) => (
            <Accordion
              key={row.id}
              expanded={expanded === row.id}
              onChange={(_, isExpanded) => setExpanded(isExpanded ? row.id : null)}
              disableGutters
              elevation={0}
              sx={{
                '&:before': { display: 'none' },
                borderBottom: idx < rows.length - 1 ? '1px solid #f0f0f0' : 'none',
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  px: 2,
                  '& .MuiAccordionSummary-content': { margin: '12px 0' },
                  '&:hover': { bgcolor: '#fafafa' },
                }}
              >
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 2fr 2fr 1fr 1fr 1.5fr',
                    alignItems: 'center',
                    width: '100%',
                    pr: 1,
                  }}
                >
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                    {row.referenceNumber}
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>{row.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{row.description}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {row.category}{row.subCategory ? ` › ${row.subCategory}` : ''}
                  </Typography>
                  <Chip
                    label={`${row.codes.length} code${row.codes.length !== 1 ? 's' : ''}`}
                    size="small"
                    variant="outlined"
                    sx={{ width: 'fit-content' }}
                  />
                  {row.link ? (
                    <Box
                      component="a"
                      href={row.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                        color: '#1976d2',
                        textDecoration: 'none',
                        fontSize: '0.8125rem',
                        '&:hover': { textDecoration: 'underline' },
                      }}
                    >
                      <OpenInNewIcon sx={{ fontSize: '0.95rem' }} />
                      View in app
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">—</Typography>
                  )}
                </Box>
              </AccordionSummary>

              <AccordionDetails sx={{ px: 3, py: 2, bgcolor: '#fafafa', borderTop: '1px solid #f0f0f0' }}>
                {/* Codes */}
                <Typography variant="caption" sx={{ display: 'block', mb: 1.5, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Codes
                </Typography>
                {row.codes.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No codes added.</Typography>
                ) : (
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {row.codes.map((c) => (
                      <Chip
                        key={c.id}
                        icon={<CheckCircleIcon />}
                        label={<Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{c.code}</Typography>}
                        color="success"
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Box>
                )}

                {row.link && (
                  <Box sx={{ mt: 1.5 }}>
                    <Box
                      component="a"
                      href={row.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                        color: '#1976d2',
                        textDecoration: 'none',
                        fontSize: '0.8125rem',
                        '&:hover': { textDecoration: 'underline' },
                      }}
                    >
                      <OpenInNewIcon sx={{ fontSize: '0.95rem' }} />
                      {row.link}
                    </Box>
                  </Box>
                )}

                <Divider sx={{ my: 2 }} />

                {/* Action buttons */}
                <Box display="flex" gap={1}>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={() => router.push(`/cascading-demo/${row.id}/edit`)}
                    sx={{ textTransform: 'none', borderRadius: '6px', bgcolor: '#1a2744', '&:hover': { bgcolor: '#1976d2' } }}
                  >
                    Edit
                  </Button>
                  {row.link && (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ViewIcon />}
                      onClick={() => window.open(row.link, '_blank')}
                      sx={{ textTransform: 'none', borderRadius: '6px', borderColor: '#90caf9', color: '#1976d2', bgcolor: '#fff', '&:hover': { borderColor: '#1976d2', bgcolor: '#f5f9ff' } }}
                    >
                      View in app
                    </Button>
                  )}
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<DeleteIcon />}
                    color="error"
                    onClick={() => {
                      deleteSubmission.mutate(row.id);
                      setExpanded(null);
                    }}
                    sx={{ textTransform: 'none', borderRadius: '6px' }}
                  >
                    Delete
                  </Button>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}

          {rows.length === 0 && !loading && (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography color="text.secondary">No submissions yet.</Typography>
            </Box>
          )}
        </Paper>
      )}
    </Container>
  );
}
