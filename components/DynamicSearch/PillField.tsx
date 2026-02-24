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

interface PillFieldProps {
  label: string;
  name: string;
  value: string[];
  onChange: (name: string, value: string[]) => void;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  pillType?: 'number' | 'text';
  allowRanges?: boolean;
  tooltip?: string;
  error?: string;
}

export const PillField: React.FC<PillFieldProps> = ({
  label,
  name,
  value = [],
  onChange,
  placeholder,
  helperText,
  required,
  disabled = false,
  pillType = 'text',
  allowRanges = false,
  tooltip,
  error,
}) => {
  // Track the textarea input separately from the processed values
  const [inputText, setInputText] = useState(value.join(', '));
  const [internalError, setInternalError] = useState('');
  const [expanded, setExpanded] = useState(false);

  const COMPACT_DISPLAY_LIMIT = 20;

  // No automatic sync - inputText stays as user typed it
  // It only updates when user types or when chips are deleted (handled in handleDelete)

  const expandRange = (rangeStr: string): number[] => {
    const [start, end] = rangeStr.split('-').map(num => parseInt(num.trim(), 10));

    if (isNaN(start) || isNaN(end)) {
      throw new Error('Invalid range format');
    }

    if (start > end) {
      throw new Error('Start must be less than or equal to end');
    }

    const result: number[] = [];
    for (let i = start; i <= end; i++) {
      result.push(i);
    }
    return result;
  };

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
      onChange(name, []);
    } else {
      const parts = newInputText.split(',').map(p => p.trim()).filter(p => p);
      onChange(name, parts);
    }
  };

  const expandAndApply = () => {
    setInternalError('');
    const newValues = processInput(inputText);
    if (newValues.length > 0) {
      onChange(name, newValues);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      expandAndApply();
    }
  };

  const handleBlur = () => {
    if (inputText.trim()) {
      expandAndApply();
    }
  };

  const handleDelete = (valueToDelete: string) => {
    const newValues = value.filter(v => v !== valueToDelete);
    onChange(name, newValues);
    // Update inputText to reflect the deletion
    setInputText(newValues.join(', '));
  };

  const handleClearAll = () => {
    onChange(name, []);
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

  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      <TextField
        fullWidth
        multiline
        size="small"
        rows={2}
        label={labelWithTooltip}
        value={inputText}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder || (allowRanges ? 'Enter comma-separated values or ranges (e.g., 100-150, 178). Press Enter to expand ranges.' : 'Enter comma-separated values')}
        variant="outlined"
        error={!!error}
        required={required}
        disabled={disabled}
        helperText={error || helperText}
        sx={{
          width: '100%',
          '& .MuiOutlinedInput-root': {
            minWidth: 'unset',
            width: '100%',
            padding: '8px 12px',
            alignItems: 'flex-start',
          },
          '& .MuiOutlinedInput-input': {
            padding: 0,
          },
          '& .MuiInputBase-inputMultiline': {
            padding: 0,
          },
        }}
      />

      {value.length > 0 && (
        <>
          <Box
            sx={{
              mt: 1,
              p: 1,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              backgroundColor: 'background.paper',
            }}
          >
            {/* Compact view - show first 20 chips */}
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 0.75,
                alignItems: 'flex-start',
              }}
            >
              {value.slice(0, COMPACT_DISPLAY_LIMIT).map((val, index) => (
                <Chip
                  key={`${val}-${index}`}
                  label={val}
                  onDelete={disabled ? undefined : () => handleDelete(val)}
                  color="primary"
                  variant="outlined"
                  size="small"
                  disabled={disabled}
                />
              ))}
            </Box>

            {/* Collapsible section for remaining chips */}
            {value.length > COMPACT_DISPLAY_LIMIT && (
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
                    {value.slice(COMPACT_DISPLAY_LIMIT).map((val, index) => (
                      <Chip
                        key={`${val}-${index + COMPACT_DISPLAY_LIMIT}`}
                        label={val}
                        onDelete={disabled ? undefined : () => handleDelete(val)}
                        color="primary"
                        variant="outlined"
                        size="small"
                        disabled={disabled}
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
                  >
                    {expanded
                      ? 'Show Less'
                      : `Show ${value.length - COMPACT_DISPLAY_LIMIT} More`
                    }
                  </Button>
                </Box>
              </>
            )}
          </Box>

          <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }} alignItems="center">
            <Button
              size="small"
              onClick={handleClearAll}
              variant="outlined"
              disabled={disabled}
            >
              Clear All
            </Button>
            <Typography variant="caption" color="text.secondary">
              {value.length} {value.length === 1 ? 'item' : 'items'} selected
            </Typography>
          </Stack>
        </>
      )}
    </Box>
  );
};
