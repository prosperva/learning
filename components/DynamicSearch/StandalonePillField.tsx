'use client';

import React, { useState } from 'react';
import {
  TextField,
  Box,
  Chip,
  Button,
  Stack,
  Typography,
  Collapse,
  Tooltip,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon, HelpOutline as HelpIcon } from '@mui/icons-material';

export interface StandalonePillFieldProps {
  label: string;
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  pillType?: 'number' | 'text';
  allowRanges?: boolean; // Only works with pillType='number'
  tooltip?: string;
  compactDisplayLimit?: number; // Number of chips to show before collapsing (default: 20)
  showClearButton?: boolean; // Show "Clear All" button (default: true)
}

/**
 * StandalonePillField - A multi-value input field with chip display
 *
 * Features:
 * - Enter comma-separated values (e.g., "apple, banana, orange")
 * - Number mode with optional range expansion (e.g., "1-5, 10" becomes [1,2,3,4,5,10])
 * - Displays values as removable chips
 * - Collapsible display for large number of values
 * - Clear all functionality
 * - Tooltip support
 *
 * @example
 * // Text mode
 * <StandalonePillField
 *   label="Tags"
 *   value={tags}
 *   onChange={setTags}
 *   pillType="text"
 * />
 *
 * @example
 * // Number mode with ranges
 * <StandalonePillField
 *   label="SKU Numbers"
 *   value={skus}
 *   onChange={setSkus}
 *   pillType="number"
 *   allowRanges={true}
 *   helperText="Enter numbers or ranges (e.g., 100-105, 200). Press Enter to expand."
 * />
 */
export const StandalonePillField: React.FC<StandalonePillFieldProps> = ({
  label,
  value = [],
  onChange,
  placeholder,
  helperText,
  error,
  required = false,
  disabled = false,
  pillType = 'text',
  allowRanges = false,
  tooltip,
  compactDisplayLimit = 20,
  showClearButton = true,
}) => {
  // Track the textarea input separately from the processed values
  const [inputText, setInputText] = useState(value.join(', '));
  const [internalError, setInternalError] = useState('');
  const [expanded, setExpanded] = useState(false);

  // Expand numeric range (e.g., "1-5" => [1,2,3,4,5])
  const expandRange = (rangeStr: string): number[] => {
    const [start, end] = rangeStr.split('-').map(num => parseInt(num.trim(), 10));

    if (isNaN(start) || isNaN(end)) {
      throw new Error('Invalid range format');
    }

    const [low, high] = start > end ? [end, start] : [start, end];

    const result: number[] = [];
    for (let i = low; i <= high; i++) {
      result.push(i);
    }
    return result;
  };

  // Process input text into array of values
  const processInput = (input: string): string[] => {
    const trimmed = input.trim();
    if (!trimmed) return [];

    if (pillType === 'number' && allowRanges) {
      const parts = trimmed.split(',').map(p => p.trim()).filter(p => p);
      const expanded: string[] = [];

      for (const part of parts) {
        if (part.includes('-')) {
          try {
            const rangeNumbers = expandRange(part);
            expanded.push(...rangeNumbers.map(String));
          } catch (err) {
            setInternalError((err as Error).message);
            return [];
          }
        } else {
          if (pillType === 'number' && isNaN(Number(part))) {
            setInternalError('Invalid number format');
            return [];
          }
          expanded.push(part);
        }
      }

      return expanded;
    } else if (pillType === 'number') {
      const parts = trimmed.split(',').map(p => p.trim()).filter(p => p);
      for (const part of parts) {
        if (isNaN(Number(part))) {
          setInternalError('Invalid number format');
          return [];
        }
      }
      return parts;
    } else {
      return trimmed.split(',').map(p => p.trim()).filter(p => p);
    }
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newInputText = event.target.value;
    setInputText(newInputText);
    setInternalError('');

    // For textarea, just split by comma without expanding ranges
    // Ranges will be expanded only when user presses Enter
    if (newInputText.trim() === '') {
      onChange([]);
    } else {
      const parts = newInputText.split(',').map(p => p.trim()).filter(p => p);
      onChange(parts);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      setInternalError('');

      // Expand ranges when user presses Enter
      const newValues = processInput(inputText);
      if (newValues.length > 0) {
        onChange(newValues);
        // Keep the original input text (with ranges) in the textarea
      }
    }
  };

  const handleDelete = (valueToDelete: string) => {
    const newValues = value.filter(v => v !== valueToDelete);
    onChange(newValues);
    // Update inputText to reflect the deletion
    setInputText(newValues.join(', '));
  };

  const handleClearAll = () => {
    onChange([]);
    setInputText('');
  };

  const labelWithTooltip = tooltip ? (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
      {label}
      <Tooltip title={tooltip} arrow placement="top" enterDelay={200} leaveDelay={200}>
        <Box
          component="span"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            ml: 0.5,
            cursor: 'help',
            color: 'action.active',
          }}
        >
          <HelpIcon fontSize="small" sx={{ fontSize: '1rem' }} />
        </Box>
      </Tooltip>
    </Box>
  ) : label;

  const defaultPlaceholder = allowRanges
    ? 'Enter comma-separated values or ranges (e.g., 100-150, 178). Press Enter to expand ranges.'
    : 'Enter comma-separated values';

  return (
    <Box>
      <TextField
        fullWidth
        multiline
        rows={3}
        label={labelWithTooltip}
        value={inputText}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || defaultPlaceholder}
        variant="outlined"
        error={!!error || !!internalError}
        required={required}
        disabled={disabled}
        helperText={error || internalError || helperText}
      />

      {value.length > 0 && (
        <>
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              backgroundColor: 'background.paper',
            }}
          >
            {/* Compact view - show first N chips */}
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 0.75,
                alignItems: 'flex-start',
              }}
            >
              {value.slice(0, compactDisplayLimit).map((val, index) => (
                <Chip
                  key={`${val}-${index}`}
                  label={val}
                  onDelete={disabled ? undefined : () => handleDelete(val)}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>

            {/* Collapsible section for remaining chips */}
            {value.length > compactDisplayLimit && (
              <>
                <Collapse in={expanded}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 0.75,
                      mt: 0.75,
                      alignItems: 'flex-start',
                    }}
                  >
                    {value.slice(compactDisplayLimit).map((val, index) => (
                      <Chip
                        key={`${val}-${index + compactDisplayLimit}`}
                        label={val}
                        onDelete={disabled ? undefined : () => handleDelete(val)}
                        color="primary"
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Box>
                </Collapse>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mt: 1,
                    pt: 1,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Button
                    size="small"
                    onClick={() => setExpanded(!expanded)}
                    endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    disabled={disabled}
                  >
                    {expanded
                      ? 'Show Less'
                      : `Show ${value.length - compactDisplayLimit} More`
                    }
                  </Button>
                </Box>
              </>
            )}
          </Box>

          <Stack direction="row" spacing={1} sx={{ mt: 1 }} alignItems="center">
            {showClearButton && (
              <Button
                size="small"
                onClick={handleClearAll}
                variant="outlined"
                disabled={disabled}
              >
                Clear All
              </Button>
            )}
            <Typography variant="caption" color="text.secondary">
              {value.length} {value.length === 1 ? 'item' : 'items'} selected
            </Typography>
          </Stack>
        </>
      )}
    </Box>
  );
};
