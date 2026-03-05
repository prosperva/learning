// components/AuditHistoryCompact.tsx
"use client";
import { useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchAuditLogs } from "@/lib/api/auditLogs";
import type { AuditLog } from "@/lib/api/auditLogs";

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

// ---------- Types ----------
interface Props {
  recordId: string | number;
  entityKey?: string;  // override when URL segment doesn't match the table name
  title?: string;
}

type SortField = "modifiedDate" | "modifiedBy" | "operation";
type SortDir = "asc" | "desc";

interface AuditFieldConfig { fieldName: string; displayName: string; isEnabled: boolean; }
interface AuditTableConfig { tableName: string; fields: AuditFieldConfig[]; }

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
function AuditRow({
  row,
  displayNameMap,
}: {
  row: AuditLog;
  displayNameMap: Map<string, string>;
}) {
  const [open, setOpen] = useState(false);
  const fieldCount = Object.keys(row.changes).length;

  return (
    <>
      <TableRow
        hover
        onClick={() => setOpen((p) => !p)}
        sx={{ cursor: "pointer", "& > *": { borderBottom: open ? "none" : undefined } }}
      >
        <TableCell padding="checkbox">
          <IconButton size="small">
            {open ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}
          </IconButton>
        </TableCell>

        <TableCell>
          <Tooltip title={new Date(row.modifiedDate).toLocaleString()} arrow placement="top">
            <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
              {relativeTime(row.modifiedDate)}
            </Typography>
          </Tooltip>
        </TableCell>

        <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar sx={{ width: 28, height: 28, fontSize: 11, bgcolor: avatarColor(row.modifiedBy) }}>
              {getInitials(row.modifiedBy)}
            </Avatar>
            <Typography variant="body2" noWrap>{row.modifiedBy}</Typography>
          </Box>
        </TableCell>

        <TableCell>
          <Chip label={row.operation} color={operationColor(row.operation)} size="small" />
        </TableCell>

        <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
          <Chip
            label={`${fieldCount} field${fieldCount !== 1 ? "s" : ""}`}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 500 }}
          />
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell colSpan={5} sx={{ py: 0, bgcolor: "grey.50" }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ px: { xs: 1, sm: 4 }, py: 1.5 }}>
              <Box
                display="flex"
                alignItems="center"
                gap={1}
                sx={{ display: { xs: "flex", sm: "none" }, mb: 1.5 }}
              >
                <Avatar sx={{ width: 24, height: 24, fontSize: 10, bgcolor: avatarColor(row.modifiedBy) }}>
                  {getInitials(row.modifiedBy)}
                </Avatar>
                <Typography variant="caption" color="text.secondary">{row.modifiedBy}</Typography>
              </Box>

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold", width: "30%", color: "text.secondary", fontSize: 12 }}>
                      FIELD
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", color: "error.main", fontSize: 12, display: { xs: "none", sm: "table-cell" } }}>
                      BEFORE
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", color: "success.main", fontSize: 12, display: { xs: "none", sm: "table-cell" } }}>
                      AFTER
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", fontSize: 12, color: "text.secondary", display: { xs: "table-cell", sm: "none" } }}>
                      CHANGE
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(row.changes).map(([fieldName, diff]) => (
                    <TableRow key={fieldName} sx={{ "&:last-child td": { border: 0 } }}>
                      <TableCell>
                        <Tooltip title={fieldName} placement="top" arrow>
                          <Typography variant="body2" fontWeight="medium">
                            {displayNameMap.get(fieldName) ?? fieldName}
                          </Typography>
                        </Tooltip>
                      </TableCell>

                      <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                        {diff.old === null ? (
                          <EmptyBadge />
                        ) : (
                          <Typography variant="body2" sx={{ color: "error.main", textDecoration: "line-through" }}>
                            {diff.old}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                        {diff.new === null ? (
                          <EmptyBadge />
                        ) : (
                          <Typography variant="body2" sx={{ color: "success.main" }}>
                            {diff.new}
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell sx={{ display: { xs: "table-cell", sm: "none" } }}>
                        <Box display="flex" flexDirection="column" gap={0.25}>
                          {diff.old === null ? (
                            <EmptyBadge />
                          ) : (
                            <Typography variant="caption" sx={{ color: "error.main", textDecoration: "line-through" }}>
                              {diff.old}
                            </Typography>
                          )}
                          <Typography variant="caption" color="text.disabled" lineHeight={1}>↓</Typography>
                          {diff.new === null ? (
                            <EmptyBadge />
                          ) : (
                            <Typography variant="caption" sx={{ color: "success.main" }}>
                              {diff.new}
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
export default function AuditHistoryCompact({ recordId, entityKey: entityKeyProp, title = "Change History" }: Props) {
  const pathname = usePathname();
  const entityKey = entityKeyProp ?? pathname.split('/')[1];

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [sortField, setSortField] = useState<SortField>("modifiedDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [quickFilter, setQuickFilter] = useState("");
  const [operationFilter, setOperationFilter] = useState("all");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["audit", entityKey, String(recordId)],
    queryFn: () => fetchAuditLogs({ entityKey, recordId }),
    enabled: !!entityKey && recordId !== "",
  });

  // Audit config — for display name resolution
  const { data: configData } = useQuery<AuditTableConfig[]>({
    queryKey: ["audit-config"],
    queryFn: () => fetch("/api/audit/config").then(r => r.json()),
    staleTime: 60_000,
  });

  const displayNameMap = useMemo<Map<string, string>>(() => {
    const table = configData?.find(t => t.tableName.toLowerCase() === entityKey.toLowerCase());
    if (!table) return new Map();
    return new Map(table.fields.map(f => [f.fieldName, f.displayName]));
  }, [configData, entityKey]);

  const rows: AuditLog[] = data?.data ?? [];

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

    if (operationFilter !== "all") {
      filtered = filtered.filter((r) => r.operation === operationFilter);
    }

    if (quickFilter.trim()) {
      const q = quickFilter.trim().toLowerCase();
      filtered = filtered.filter((r) => {
        if (r.modifiedBy.toLowerCase().includes(q)) return true;
        if (r.operation.toLowerCase().includes(q)) return true;
        return Object.entries(r.changes).some(
          ([field, diff]) =>
            field.toLowerCase().includes(q) ||
            (displayNameMap.get(field) ?? "").toLowerCase().includes(q) ||
            diff.old?.toLowerCase().includes(q) ||
            diff.new?.toLowerCase().includes(q)
        );
      });
    }

    filtered = [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortField === "modifiedDate") {
        cmp = new Date(a.modifiedDate).getTime() - new Date(b.modifiedDate).getTime();
      } else if (sortField === "modifiedBy") {
        cmp = a.modifiedBy.localeCompare(b.modifiedBy);
      } else if (sortField === "operation") {
        cmp = a.operation.localeCompare(b.operation);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return filtered;
  }, [rows, quickFilter, operationFilter, sortField, sortDir, displayNameMap]);

  const paginated = processedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const hasActiveFilters = quickFilter.trim() !== "" || operationFilter !== "all";

  return (
    <Card variant="outlined" sx={{ mt: 4 }}>
      <CardHeader
        title={title}
        subheader="Click a row to see field-level changes"
        slotProps={{ title: { variant: "h6", fontWeight: "bold" }, subheader: { variant: "caption" } }}
      />
      <Divider />
      <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
        {isLoading ? (
          <Box display="flex" alignItems="center" gap={1} p={2}>
            <CircularProgress size={20} />
            <Typography variant="body2">Loading history...</Typography>
          </Box>
        ) : isError ? (
          <Typography variant="body2" color="error" p={2}>
            Failed to load history.
          </Typography>
        ) : rows.length === 0 ? (
          <Typography variant="body2" color="text.secondary" p={2}>
            No history available.
          </Typography>
        ) : (
          <>
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
                        active={sortField === "modifiedDate"}
                        direction={sortField === "modifiedDate" ? sortDir : "asc"}
                        onClick={() => handleSort("modifiedDate")}
                      >
                        Date
                      </TableSortLabel>
                    </TableCell>

                    <TableCell sx={{ fontWeight: "bold", display: { xs: "none", sm: "table-cell" } }}>
                      <TableSortLabel
                        active={sortField === "modifiedBy"}
                        direction={sortField === "modifiedBy" ? sortDir : "asc"}
                        onClick={() => handleSort("modifiedBy")}
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
                    paginated.map((row) => (
                      <AuditRow key={row.id} row={row} displayNameMap={displayNameMap} />
                    ))
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
