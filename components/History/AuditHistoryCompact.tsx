// components/AuditHistoryCompact.tsx
"use client";
import { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  CircularProgress,
  Box,
  Chip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TablePagination,
  TableSortLabel,
  Divider,
  Collapse,
  Avatar,
  Tooltip,
  IconButton,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

// ---------- Interfaces ----------
interface AuditChange {
  Old: string | null;
  New: string | null;
}

interface AuditLog {
  id: number;
  tableName: string;
  recordId: string;
  operation: string;
  changedBy: string;
  changedAt: string;
  changes: Record<string, AuditChange>;
}

interface Props {
  tableName: string;
  recordId: string | number;
}

type SortField = "changedAt" | "changedBy" | "operation";
type SortDir = "asc" | "desc";

// ---------- Mock Data ----------
const mockAuditData: AuditLog[] = [
  {
    id: 1,
    tableName: "Product",
    recordId: "1",
    operation: "Added",
    changedBy: "admin@domain.com",
    changedAt: "2025-12-01T09:15:00Z",
    changes: {
      Name: { Old: null, New: "Product 1" },
      Category: { Old: null, New: "electronics" },
      Status: { Old: null, New: "active" },
      Price: { Old: null, New: "299.99" },
      Stock: { Old: null, New: "150" },
      Description: { Old: null, New: "Description for product 1. This is a sample product with detailed information." },
    },
  },
  {
    id: 2,
    tableName: "Customer",
    recordId: "1",
    operation: "Modified",
    changedBy: "admin@domain.com",
    changedAt: "2025-12-05T10:30:00Z",
    changes: {
      Email: { Old: "john@example.com", New: "john.doe@example.com" },
    },
  },
  {
    id: 3,
    tableName: "Customer",
    recordId: "1",
    operation: "Modified",
    changedBy: "jane@domain.com",
    changedAt: "2025-12-08T14:00:00Z",
    changes: {
      Status: { Old: "Active", New: "Inactive" },
    },
  },
  {
    id: 4,
    tableName: "Customer",
    recordId: "1",
    operation: "Modified",
    changedBy: "jane@domain.com",
    changedAt: "2025-12-10T11:20:00Z",
    changes: {
      Status: { Old: "Inactive", New: "Active" },
    },
  },
  {
    id: 5,
    tableName: "Customer",
    recordId: "1",
    operation: "Modified",
    changedBy: "prosper@domain.com",
    changedAt: "2025-12-12T09:45:00Z",
    changes: {
      Name: { Old: "John Doe", New: "John A. Doe" },
    },
  },
  {
    id: 6,
    tableName: "Customer",
    recordId: "1",
    operation: "Modified",
    changedBy: "admin@domain.com",
    changedAt: "2025-12-15T16:00:00Z",
    changes: {
      Phone: { Old: null, New: "555-1234" },
      Address: { Old: null, New: "123 Main St" },
    },
  },
  {
    id: 7,
    tableName: "Customer",
    recordId: "1",
    operation: "Modified",
    changedBy: "prosper@domain.com",
    changedAt: "2025-12-18T13:30:00Z",
    changes: {
      Address: { Old: "123 Main St", New: "456 Elm Ave" },
    },
  },
  {
    id: 8,
    tableName: "Customer",
    recordId: "1",
    operation: "Modified",
    changedBy: "jane@domain.com",
    changedAt: "2025-12-20T08:15:00Z",
    changes: {
      Phone: { Old: "555-1234", New: "555-5678" },
    },
  },
  {
    id: 9,
    tableName: "Customer",
    recordId: "1",
    operation: "Modified",
    changedBy: "admin@domain.com",
    changedAt: "2025-12-22T10:00:00Z",
    changes: {
      Status: { Old: "Active", New: "Suspended" },
    },
  },
  {
    id: 10,
    tableName: "Customer",
    recordId: "1",
    operation: "Modified",
    changedBy: "prosper@domain.com",
    changedAt: "2025-12-24T15:45:00Z",
    changes: {
      Status: { Old: "Suspended", New: "Active" },
    },
  },
  {
    id: 11,
    tableName: "Customer",
    recordId: "1",
    operation: "Modified",
    changedBy: "admin@domain.com",
    changedAt: "2025-12-26T09:00:00Z",
    changes: {
      Name: { Old: "John A. Doe", New: "John Doe" },
      Email: { Old: "john.doe@example.com", New: "jdoe@example.com" },
    },
  },
  {
    id: 20,
    tableName: "Customer",
    recordId: "1",
    operation: "Deleted",
    changedBy: "prosper@domain.com",
    changedAt: "2025-12-30T11:45:00Z",
    changes: {
      Status: { Old: "Active", New: null },
    },
  },
];

// ---------- Helpers ----------
const operationColor = (op: string): "success" | "warning" | "error" | "default" => {
  if (op === "Added") return "success";
  if (op === "Deleted") return "error";
  if (op === "Modified") return "warning";
  return "default";
};

const getInitials = (email: string): string => {
  const name = email.split("@")[0];
  const parts = name.split(/[._-]/);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
};

const avatarColor = (email: string): string => {
  const colors = ["#1976d2", "#388e3c", "#f57c00", "#7b1fa2", "#c62828", "#00796b"];
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const relativeTime = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return `${months}mo ago`;
};

// ---------- Empty Badge ----------
function EmptyBadge() {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-block",
        px: 0.75,
        py: 0.1,
        borderRadius: 1,
        bgcolor: "grey.200",
        color: "text.disabled",
        fontSize: 11,
        fontStyle: "italic",
      }}
    >
      empty
    </Box>
  );
}

// ---------- Expandable Row ----------
function AuditRow({ row }: { row: AuditLog }) {
  const [open, setOpen] = useState(false);
  const fieldCount = Object.keys(row.changes).length;

  return (
    <>
      <TableRow
        hover
        onClick={() => setOpen((p) => !p)}
        sx={{ cursor: "pointer", "& > *": { borderBottom: open ? "none" : undefined } }}
      >
        {/* Expand toggle */}
        <TableCell padding="checkbox">
          <IconButton size="small">
            {open ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}
          </IconButton>
        </TableCell>

        {/* Date / Time */}
        <TableCell>
          <Tooltip title={new Date(row.changedAt).toLocaleString()} arrow placement="top">
            <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
              {relativeTime(row.changedAt)}
            </Typography>
          </Tooltip>
        </TableCell>

        {/* Changed By — hidden on mobile, shown in detail row instead */}
        <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar
              sx={{ width: 28, height: 28, fontSize: 11, bgcolor: avatarColor(row.changedBy) }}
            >
              {getInitials(row.changedBy)}
            </Avatar>
            <Typography variant="body2" noWrap>{row.changedBy}</Typography>
          </Box>
        </TableCell>

        {/* Operation */}
        <TableCell>
          <Chip
            label={row.operation}
            color={operationColor(row.operation)}
            size="small"
          />
        </TableCell>

        {/* Fields count — hidden on mobile */}
        <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
          <Chip
            label={`${fieldCount} field${fieldCount !== 1 ? "s" : ""}`}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 500 }}
          />
        </TableCell>
      </TableRow>

      {/* Inline detail row */}
      <TableRow>
        <TableCell colSpan={5} sx={{ py: 0, bgcolor: "grey.50" }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ px: { xs: 1, sm: 4 }, py: 1.5 }}>

              {/* Changed By — only visible on mobile since column is hidden */}
              <Box
                display="flex"
                alignItems="center"
                gap={1}
                sx={{ display: { xs: "flex", sm: "none" }, mb: 1.5 }}
              >
                <Avatar
                  sx={{ width: 24, height: 24, fontSize: 10, bgcolor: avatarColor(row.changedBy) }}
                >
                  {getInitials(row.changedBy)}
                </Avatar>
                <Typography variant="caption" color="text.secondary">{row.changedBy}</Typography>
              </Box>

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold", width: "30%", color: "text.secondary", fontSize: 12 }}>
                      FIELD
                    </TableCell>
                    {/* On mobile: show Before/After stacked in one column */}
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        color: "error.main",
                        fontSize: 12,
                        display: { xs: "none", sm: "table-cell" },
                      }}
                    >
                      BEFORE
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        color: "success.main",
                        fontSize: 12,
                        display: { xs: "none", sm: "table-cell" },
                      }}
                    >
                      AFTER
                    </TableCell>
                    {/* Mobile-only combined column */}
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        fontSize: 12,
                        color: "text.secondary",
                        display: { xs: "table-cell", sm: "none" },
                      }}
                    >
                      CHANGE
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(row.changes).map(([field, diff]) => (
                    <TableRow key={field} sx={{ "&:last-child td": { border: 0 } }}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">{field}</Typography>
                      </TableCell>

                      {/* Desktop: separate Before / After cells */}
                      <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                        {diff.Old === null ? (
                          <EmptyBadge />
                        ) : (
                          <Typography variant="body2" sx={{ color: "error.main", textDecoration: "line-through" }}>
                            {diff.Old}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                        {diff.New === null ? (
                          <EmptyBadge />
                        ) : (
                          <Typography variant="body2" sx={{ color: "success.main" }}>
                            {diff.New}
                          </Typography>
                        )}
                      </TableCell>

                      {/* Mobile: stacked Before → After in one cell */}
                      <TableCell sx={{ display: { xs: "table-cell", sm: "none" } }}>
                        <Box display="flex" flexDirection="column" gap={0.25}>
                          {diff.Old === null ? (
                            <EmptyBadge />
                          ) : (
                            <Typography variant="caption" sx={{ color: "error.main", textDecoration: "line-through" }}>
                              {diff.Old}
                            </Typography>
                          )}
                          <Typography variant="caption" color="text.disabled" lineHeight={1}>↓</Typography>
                          {diff.New === null ? (
                            <EmptyBadge />
                          ) : (
                            <Typography variant="caption" sx={{ color: "success.main" }}>
                              {diff.New}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

// ---------- Component ----------
export default function AuditHistoryCompact({ tableName, recordId }: Props) {
  const [rows, setRows] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Sorting
  const [sortField, setSortField] = useState<SortField>("changedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Filters
  const [quickFilter, setQuickFilter] = useState("");
  const [operationFilter, setOperationFilter] = useState("all");

  useEffect(() => {
    setTimeout(() => {
      setRows(mockAuditData);
      setLoading(false);
    }, 800);
  }, [tableName, recordId]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
    setPage(0);
  };

  const handleQuickFilterChange = (value: string) => {
    setQuickFilter(value);
    setPage(0);
  };

  const handleOperationFilterChange = (value: string) => {
    setOperationFilter(value);
    setPage(0);
  };

  const processedRows = useMemo(() => {
    let filtered = rows;

    // Operation filter
    if (operationFilter !== "all") {
      filtered = filtered.filter((r) => r.operation === operationFilter);
    }

    // Quick filter — matches changedBy, operation, or any changed field name/value
    if (quickFilter.trim()) {
      const q = quickFilter.trim().toLowerCase();
      filtered = filtered.filter((r) => {
        if (r.changedBy.toLowerCase().includes(q)) return true;
        if (r.operation.toLowerCase().includes(q)) return true;
        return Object.entries(r.changes).some(
          ([field, diff]) =>
            field.toLowerCase().includes(q) ||
            diff.Old?.toLowerCase().includes(q) ||
            diff.New?.toLowerCase().includes(q)
        );
      });
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortField === "changedAt") {
        cmp = new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime();
      } else if (sortField === "changedBy") {
        cmp = a.changedBy.localeCompare(b.changedBy);
      } else if (sortField === "operation") {
        cmp = a.operation.localeCompare(b.operation);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return filtered;
  }, [rows, quickFilter, operationFilter, sortField, sortDir]);

  const paginated = processedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const hasActiveFilters = quickFilter.trim() !== "" || operationFilter !== "all";

  return (
    <Card variant="outlined" sx={{ mt: 4 }}>
      <CardHeader
        title="Change History"
        subheader="Click a row to see field-level changes"
        titleTypographyProps={{ variant: "h6", fontWeight: "bold" }}
        slotProps={{ subheader: { variant: "caption" } }}
      />
      <Divider />
      <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
        {loading ? (
          <Box display="flex" alignItems="center" gap={1} p={2}>
            <CircularProgress size={20} />
            <Typography variant="body2">Loading history...</Typography>
          </Box>
        ) : rows.length === 0 ? (
          <Typography variant="body2" color="text.secondary" p={2}>
            No history available.
          </Typography>
        ) : (
          <>
            {/* Toolbar */}
            <Box
              sx={{
                px: 2,
                py: 1.5,
                display: "flex",
                gap: 1.5,
                flexWrap: "wrap",
                alignItems: "center",
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              {/* Quick search */}
              <TextField
                size="small"
                placeholder="Search user, field, value…"
                value={quickFilter}
                onChange={(e) => handleQuickFilterChange(e.target.value)}
                sx={{ minWidth: 220, flex: 1 }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                    endAdornment: quickFilter ? (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => handleQuickFilterChange("")}>
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  },
                }}
              />

              {/* Operation filter */}
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Operation</InputLabel>
                <Select
                  label="Operation"
                  value={operationFilter}
                  onChange={(e) => handleOperationFilterChange(e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="Added">Added</MenuItem>
                  <MenuItem value="Modified">Modified</MenuItem>
                  <MenuItem value="Deleted">Deleted</MenuItem>
                </Select>
              </FormControl>

              {/* Result count */}
              <Typography variant="caption" color="text.secondary" sx={{ ml: "auto", whiteSpace: "nowrap" }}>
                {hasActiveFilters
                  ? `${processedRows.length} of ${rows.length} records`
                  : `${rows.length} records`}
              </Typography>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "grey.50" }}>
                    <TableCell padding="checkbox" />

                    <TableCell sx={{ fontWeight: "bold" }}>
                      <TableSortLabel
                        active={sortField === "changedAt"}
                        direction={sortField === "changedAt" ? sortDir : "asc"}
                        onClick={() => handleSort("changedAt")}
                      >
                        Date
                      </TableSortLabel>
                    </TableCell>

                    <TableCell sx={{ fontWeight: "bold", display: { xs: "none", sm: "table-cell" } }}>
                      <TableSortLabel
                        active={sortField === "changedBy"}
                        direction={sortField === "changedBy" ? sortDir : "asc"}
                        onClick={() => handleSort("changedBy")}
                      >
                        Changed By
                      </TableSortLabel>
                    </TableCell>

                    <TableCell sx={{ fontWeight: "bold" }}>
                      <TableSortLabel
                        active={sortField === "operation"}
                        direction={sortField === "operation" ? sortDir : "asc"}
                        onClick={() => handleSort("operation")}
                      >
                        Operation
                      </TableSortLabel>
                    </TableCell>

                    <TableCell sx={{ fontWeight: "bold", display: { xs: "none", sm: "table-cell" } }}>
                      Fields
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginated.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ py: 4, textAlign: "center" }}>
                        <Typography variant="body2" color="text.secondary">
                          No records match the current filters.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginated.map((row) => <AuditRow key={row.id} row={row} />)
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={processedRows.length}
              page={page}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[5, 10, 25]}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
