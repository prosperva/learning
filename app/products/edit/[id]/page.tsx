'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Container,
  Typography,
  TextField,
  MenuItem,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Divider,
  Skeleton,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItemButton,
  ListItemText,
  InputAdornment,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Save as SaveIcon, OpenInNew as OpenInNewIcon, Search as SearchIcon } from '@mui/icons-material';
import { useGridManagement } from '@/hooks/useGridManagement';
import { useProduct, useUpdateProduct, type UpdateProductInput } from '@/hooks/useProducts';
import { useCategories, useDropdownOptions } from '@/hooks/useDropdownOptions';
import AttachmentsSection, { type Attachment } from '@/components/Attachments';
import AuditHistoryCompact from '@/components/History/AuditHistoryCompact';
// import { LockService } from '@/lib/lockService';

// Form validation schema
const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(100, 'Name too long'),
  category: z.string().min(1, 'Category is required'),
  status: z.enum(['active', 'inactive', 'discontinued']),
  price: z.number().min(0, 'Price must be positive'),
  stock: z.number().int().min(0, 'Stock must be non-negative'),
  description: z.string().max(500, 'Description too long').optional(),
  featured: z.boolean().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

// Description templates (demo data — in production, use useDropdownOptions with extraFields)
const descriptionTemplates = [
  { label: 'Warranty Info', value: 'warranty', extra: { content: 'This product includes a 1-year manufacturer warranty.' } },
  { label: 'Return Policy', value: 'returns', extra: { content: 'Eligible for return within 30 days of purchase.' } },
  { label: 'Shipping Note', value: 'shipping', extra: { content: 'Free shipping on orders over $50. Delivery in 3-5 business days.' } },
];

// Status options
const statuses = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'discontinued', label: 'Discontinued' },
];

export default function ProductEditPage() {
  const params = useParams();
  const id = Number(params.id);
  // const currentUser = 'demo_user@example.com'; // In production, get from auth context
  // const lockReleasedRef = useRef(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [toast, setToast] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);
  // Only fetch categories when the picker modal is opened — avoids an unnecessary
  // network request on every page load since categories are rarely needed.
  const { data: categories = [], isLoading: categoriesLoading } = useCategories({ enabled: categoryModalOpen });

  // Use grid management hook for navigation
  const { returnToGrid } = useGridManagement({
    gridId: 'products-grid',
  });

  // // Release lock helper
  // const releaseLock = useCallback(async () => {
  //   if (!lockReleasedRef.current && id) {
  //     lockReleasedRef.current = true;
  //     await LockService.releaseLock('products', id.toString(), currentUser);
  //   }
  // }, [id, currentUser]);

  // // Release lock on unmount
  // useEffect(() => {
  //   return () => {
  //     releaseLock();
  //   };
  // }, [releaseLock]);

  // // Heartbeat to keep lock alive while editing
  // useEffect(() => {
  //   if (!id) return;
  //   const heartbeat = setInterval(async () => {
  //     await LockService.refreshLock('products', id.toString(), currentUser);
  //   }, 30000);
  //   return () => clearInterval(heartbeat);
  // }, [id, currentUser]);

  // // Handle browser close/refresh - release lock
  // useEffect(() => {
  //   const handleBeforeUnload = () => {
  //     navigator.sendBeacon('/api/locks/release', JSON.stringify({
  //       tableName: 'products',
  //       rowId: id.toString(),
  //       userId: currentUser
  //     }));
  //   };
  //   window.addEventListener('beforeunload', handleBeforeUnload);
  //   return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  // }, [id, currentUser]);

  // Fetch product data using React Query
  const {
    data: product,
    isLoading,
    isError,
    error,
  } = useProduct(id);

  // Defer secondary sections (attachments, audit) until after the form has painted.
  // This lets the critical form render first without competing API requests.
  const [showSecondary, setShowSecondary] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([
    { id: '1', fileName: 'product-spec.pdf', fileSize: 204800, mimeType: 'application/pdf', uploadedAt: '2025-01-15T10:00:00Z', url: '#' },
  ]);
  useEffect(() => {
    if (!isLoading) {
      const t = setTimeout(() => setShowSecondary(true), 0);
      return () => clearTimeout(t);
    }
  }, [isLoading]);

  // Update mutation
  const updateMutation = useUpdateProduct();

  // Form setup
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      category: '',
      status: 'active',
      price: 0,
      stock: 0,
      description: '',
      featured: false,
    },
  });

  // Reset form when product data loads
  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        category: product.category,
        status: product.status,
        price: product.price,
        stock: product.stock,
        description: product.description,
        featured: (product as any).featured ?? false,
      });
    }
  }, [product, reset]);

  // Form submit handler
  const onSubmit = async (data: ProductFormData) => {
    try {
      await updateMutation.mutateAsync({
        id,
        data: data as UpdateProductInput,
      });
      setToast({ message: 'Changes saved successfully', severity: 'success' });
    } catch (error) {
      console.error('Failed to update product:', error);
      setToast({ message: 'Failed to save changes', severity: 'error' });
    }
  };

  // Handle back navigation
  const handleBack = () => {
    returnToGrid();
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <Container maxWidth={false} sx={{ py: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 3 }}>
          Back to Products
        </Button>
        <Skeleton variant="text" width={300} height={40} sx={{ mb: 1 }} />
        <Skeleton variant="text" width={200} height={24} sx={{ mb: 3 }} />
        <Paper elevation={2} sx={{ p: 3 }}>
          <Box sx={{ maxWidth: { xs: '100%', sm: '80%', md: '65%', lg: '45%' }, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Skeleton variant="rounded" height={56} />
            <Skeleton variant="rounded" height={56} />
            <Skeleton variant="rounded" height={56} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Skeleton variant="rounded" height={56} sx={{ flex: 1 }} />
              <Skeleton variant="rounded" height={56} sx={{ flex: 1 }} />
            </Box>
            <Skeleton variant="rounded" height={120} />
          </Box>
        </Paper>
      </Container>
    );
  }

  // Error state
  if (isError) {
    return (
      <Container maxWidth={false} sx={{ py: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
          Back to Products
        </Button>
        <Alert severity="error">
          Failed to load product: {(error as Error)?.message || 'Unknown error'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} sx={{ py: 4 }}>
      {/* Back Button */}
      <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 3 }}>
        Back to Products
      </Button>

      {/* Header */}
      <Typography variant="h4" component="h1" gutterBottom>
        Edit Product
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Editing: {product?.name} (ID: {id})
      </Typography>

      {/* Mutation Error */}
      {updateMutation.isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to save: {updateMutation.error?.message || 'Unknown error'}
        </Alert>
      )}

      {/* Edit Form */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Box sx={{ maxWidth: { xs: '100%', sm: '80%', md: '65%', lg: '45%' }, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Product Name */}
            {/* <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Product Name"
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  fullWidth
                  required
                />
              )}
            /> */}

            {/* Category */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Category"
                    error={!!errors.category}
                    helperText={errors.category?.message}
                    fullWidth
                    required
                    disabled
                  />
                )}
              />
              <Button
                variant="outlined"
                onClick={() => { setCategoryModalOpen(true); setCategoryFilter(''); }}
                startIcon={<OpenInNewIcon />}
                sx={{ whiteSpace: 'nowrap', height: '56px' }}
              >
                Move to
              </Button>
            </Box>

            {/* Status */}
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Status"
                  error={!!errors.status}
                  helperText={errors.status?.message}
                  fullWidth
                  required
                >
                  {statuses.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            {/* Price */}
            <Controller
              name="price"
              control={control}
              render={({ field: { onChange, ...field } }) => (
                <TextField
                  {...field}
                  label="Price ($)"
                  type="number"
                  error={!!errors.price}
                  helperText={errors.price?.message}
                  fullWidth
                  required
                  slotProps={{
                    htmlInput: { min: 0, step: 0.01 },
                  }}
                  onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                />
              )}
            />

            {/* Stock */}
            <Controller
              name="stock"
              control={control}
              render={({ field: { onChange, ...field } }) => (
                <TextField
                  {...field}
                  label="Stock"
                  type="number"
                  error={!!errors.stock}
                  helperText={errors.stock?.message}
                  fullWidth
                  required
                  slotProps={{
                    htmlInput: { min: 0, step: 1 },
                  }}
                  onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
                />
              )}
            />

            {/* Description Template Lookup (not part of schema) */}
            {/* In production, use: useDropdownOptions({ url: '/api/templates', labelField: 'name', valueField: 'id', extraFields: ['content'] }) */}
            <TextField
              select
              label="Append Template"
              value=""
              onChange={(e) => {
                const template = descriptionTemplates.find((t) => t.value === e.target.value);
                if (template?.extra?.content) {
                  const current = getValues('description') || '';
                  const separator = current ? '\n\n' : '';
                  setValue('description', template.extra.content + separator + current, { shouldDirty: true });
                }
              }}
              fullWidth
              helperText="Select a template to append to the description"
            >
              {descriptionTemplates.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>

            {/* Description */}
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Description"
                  error={!!errors.description}
                  helperText={errors.description?.message}
                  fullWidth
                  multiline
                  rows={4}
                />
              )}
            />

            {/* Featured */}
            <Controller
              name="featured"
              control={control}
              render={({ field: { value, onChange, ...field } }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      {...field}
                      checked={!!value}
                      onChange={(e) => onChange(e.target.checked)}
                    />
                  }
                  label="Featured Product"
                />
              )}
            />

            {/* Attachments — deferred until after form paints */}
            {showSecondary && (
              <AttachmentsSection
                attachments={attachments}
                onAdd={file => setAttachments(prev => [...prev, {
                  id: crypto.randomUUID(),
                  fileName: file.name,
                  fileSize: file.size,
                  mimeType: file.type || 'application/octet-stream',
                  uploadedAt: new Date().toISOString(),
                  url: URL.createObjectURL(file),
                }])}
                onDelete={id => setAttachments(prev => prev.filter(a => a.id !== id))}
              />
            )}

            <Divider />

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={handleBack}
                disabled={isSubmitting || updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={
                  isSubmitting || updateMutation.isPending ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <SaveIcon />
                  )
                }
                disabled={isSubmitting || updateMutation.isPending || !isDirty}
              >
                {isSubmitting || updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>

      {/* Secondary sections — deferred until after the form has painted */}
      {showSecondary && (
        <>
          {/* Product Info */}
          {product && (
            <Paper elevation={1} sx={{ p: 2, mt: 3, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" color="text.secondary">
                Created: {new Date(product.createdAt).toLocaleString()}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Last Updated: {new Date(product.updatedAt).toLocaleString()}
              </Typography>
            </Paper>
          )}
          {/* Audit History */}
          <AuditHistoryCompact recordId={id} />
        </>
      )}

      {/* Category Picker Modal */}
      <Dialog open={categoryModalOpen} onClose={() => setCategoryModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Move to Category</DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ px: 2, pt: 2, pb: 1 }}>
            <TextField
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              placeholder="Filter categories..."
              fullWidth
              size="small"
              autoFocus
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>
          <List sx={{ maxHeight: 300, overflow: 'auto' }}>
            {categoriesLoading ? (
              <Box display="flex" justifyContent="center" py={3}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              categories
                .filter((c) => c.label.toLowerCase().includes(categoryFilter.toLowerCase()))
                .map((cat) => {
                  const catValue = String(cat.value ?? '');
                  return (
                    <ListItemButton
                      key={catValue}
                      selected={getValues('category') === catValue}
                      onClick={() => {
                        setValue('category', catValue, { shouldDirty: true });
                        setCategoryModalOpen(false);
                      }}
                    >
                      <ListItemText primary={cat.label} secondary={catValue} />
                    </ListItemButton>
                  );
                })
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryModalOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={toast?.severity} onClose={() => setToast(null)} sx={{ width: '100%' }}>
          {toast?.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
