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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItemButton,
  ListItemText,
  InputAdornment,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Save as SaveIcon, OpenInNew as OpenInNewIcon, Search as SearchIcon } from '@mui/icons-material';
import { useGridManagement } from '@/hooks/useGridManagement';
import { useProduct, useUpdateProduct, type UpdateProductInput } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useDropdownOptions';
import AttachmentsSection from '@/components/AttachmentsSection';
// import { LockService } from '@/lib/lockService';

// Form validation schema
const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(100, 'Name too long'),
  category: z.string().min(1, 'Category is required'),
  status: z.enum(['active', 'inactive', 'discontinued']),
  price: z.number().min(0, 'Price must be positive'),
  stock: z.number().int().min(0, 'Stock must be non-negative'),
  description: z.string().max(500, 'Description too long').optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

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
  const { data: categories = [] } = useCategories();

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
      returnToGrid();
    } catch (error) {
      // Error is handled by mutation state
      console.error('Failed to update product:', error);
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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
          <Box sx={{ maxWidth: { xs: '100%', sm: '80%', md: '60%', lg: '45%' }, display: 'flex', flexDirection: 'column', gap: 3 }}>
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

            {/* Attachments */}
            <AttachmentsSection productId={id} />

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
            {categories
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
              })}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryModalOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
