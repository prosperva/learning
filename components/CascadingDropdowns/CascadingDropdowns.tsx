'use client';

import { useEffect, useState } from 'react';
import {
  Autocomplete,
  TextField,
  CircularProgress,
  Box,
} from '@mui/material';

interface FlatDataProps {
  mockData?: any[];
  apiUrl?: string;
  idField?: string;
  nameField?: string;
  parentIdField?: string;
}

interface TwoTableDataProps {
  parents: any[];
  children: any[];
  hasChildrenField?: string;
  idField?: string;
  nameField?: string;
}

type CascadingDropdownsProps = {
  parentLabel?: string;
  childLabel?: string;
  onSelect?: (parent: any, child: any | null) => void;
} & (FlatDataProps | TwoTableDataProps);

function isTwoTable(props: CascadingDropdownsProps): props is TwoTableDataProps & { parentLabel?: string; childLabel?: string; onSelect?: any } {
  return 'parents' in props && 'children' in props;
}

export default function CascadingDropdowns(props: CascadingDropdownsProps) {
  const { parentLabel = 'Category', childLabel = 'Sub-category', onSelect } = props;

  // Two-table mode state
  const [selectedParent, setSelectedParent] = useState<any | null>(null);
  const [selectedChild, setSelectedChild] = useState<any | null>(null);

  // Flat mode state
  const [items, setItems] = useState<any[]>(!isTwoTable(props) && props.mockData ? props.mockData : []);
  const [loading, setLoading] = useState(!isTwoTable(props) && !props.mockData);

  useEffect(() => {
    if (isTwoTable(props)) return;
    if (props.mockData) return;
    if (!props.apiUrl) return;
    async function fetchItems() {
      try {
        const res = await fetch((props as FlatDataProps).apiUrl!);
        const data = await res.json();
        setItems(data);
      } catch (err) {
        console.error('Failed to fetch items:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchItems();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleParentChange(_: any, value: any | null) {
    setSelectedParent(value);
    setSelectedChild(null);
    if (value) onSelect?.(value, null);
  }

  function handleChildChange(_: any, value: any | null) {
    setSelectedChild(value);
    if (selectedParent) onSelect?.(selectedParent, value);
  }

  if (loading) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <CircularProgress size={20} />
        <span>Loading...</span>
      </Box>
    );
  }

  // ---- Two-table mode ----
  if (isTwoTable(props)) {
    const { parents, children, hasChildrenField = 'hasChildren', idField = 'id', nameField = 'name' } = props;
    const showChildren = selectedParent && selectedParent[hasChildrenField];

    return (
      <Box display="flex" flexDirection="column" gap={2}>
        <Autocomplete
          options={parents}
          value={selectedParent}
          onChange={handleParentChange}
          getOptionLabel={(option) => String(option[nameField] ?? '')}
          isOptionEqualToValue={(option, val) => String(option[idField]) === String(val[idField])}
          renderInput={(params) => (
            <TextField {...params} label={parentLabel} variant="outlined" size="medium" slotProps={{ inputLabel: { shrink: true } }} />
          )}
          fullWidth
        />
        {showChildren && (
          <Autocomplete
            options={children}
            value={selectedChild}
            onChange={handleChildChange}
            getOptionLabel={(option) => String(option[nameField] ?? '')}
            isOptionEqualToValue={(option, val) => String(option[idField]) === String(val[idField])}
            renderInput={(params) => (
              <TextField {...params} label={childLabel} variant="outlined" size="medium" slotProps={{ inputLabel: { shrink: true } }} />
            )}
            fullWidth
          />
        )}
      </Box>
    );
  }

  // ---- Flat mode ----
  const { idField = 'id', nameField = 'name', parentIdField = 'parentId' } = props;
  const parents = items.filter((item) => !item[parentIdField]);
  const children = selectedParent
    ? items.filter((item) => String(item[parentIdField]) === String(selectedParent[idField]))
    : [];
  const hasChildren = children.length > 0;

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Autocomplete
        options={parents}
        value={selectedParent}
        onChange={handleParentChange}
        getOptionLabel={(option) => String(option[nameField] ?? '')}
        isOptionEqualToValue={(option, val) => String(option[idField]) === String(val[idField])}
        renderInput={(params) => (
          <TextField {...params} label={parentLabel} variant="outlined" size="medium" slotProps={{ inputLabel: { shrink: true } }} />
        )}
        fullWidth
      />
      {selectedParent && hasChildren && (
        <Autocomplete
          options={children}
          value={selectedChild}
          onChange={handleChildChange}
          getOptionLabel={(option) => String(option[nameField] ?? '')}
          isOptionEqualToValue={(option, val) => String(option[idField]) === String(val[idField])}
          renderInput={(params) => (
            <TextField {...params} label={childLabel} variant="outlined" size="medium" slotProps={{ inputLabel: { shrink: true } }} />
          )}
          fullWidth
        />
      )}
    </Box>
  );
}
