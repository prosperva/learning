"use client";
import { useEffect, useMemo, useRef, useState } from "react";
// import {
//   PublicReviewCommentsResponse,
//   searchPublicReviewComments,
// } from "@/utils/utilPublicReviewComments";
// import { useSearchParams } from "next/navigation";
import {
  GridColDef,
  GridPaginationModel,
  GridRenderCellParams,
} from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import React from "react";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container,
  Box,
  Typography,
  Paper,
  Chip,
  Link,
  Button,
  Tooltip,
  CircularProgress,
  TableCell,
  TableRow,
  TableBody,
  Table,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  TableContainer,
  TableHead,
  Alert,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  IconButton,
  Snackbar
} from "@mui/material";
import { PublicReviewSearchRequest } from "@/app/api/publicreviewcomments/all-publicreviewcomments/PublicReviewCommentsResponse";
import { fetchPublicReviews } from "@/utils/utilPublicReviews";
// import { SearchParams } from "./components/sharedSearchTypes";
import { fetchCommentSupportStatuses } from "@/utils/utilPublicCommentSupportStatus";
import { GridSortModel, GridRowSelectionModel } from "@mui/x-data-grid";
import dayjs from "dayjs";
import {useSearchFields} from './config/search-fields';
import {
  DynamicSearch,
  // FieldConfig,
  SavedSearch,
  ViewMode,
  ReportFormat,
  ReportOption,
} from "./components/DynamicSearch";
import { useGridManagement } from "./hooks/useGridManagement";
import { usePublicReviewComments, usePrefetchPublicReviewComment } from "./hooks/usePublicReviewComments";
import {
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Description as CsvIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Lock as LockIcon,
} from "@mui/icons-material";

import {
  useResponsiveColumnVisibility,
  type ResponsiveColumnConfig,
  type Breakpoint
} from './hooks/userColumnVisibility';

import { useSession } from 'next-auth/react';

import { 
  useSavedSearches,
  useCreateSavedSearch,
  useUpdateSavedSearch,
} from "@/hooks/useSavedSearches";
import { visibility } from "html2canvas/dist/types/css/property-descriptors/visibility";

export default function PublicReviewsPage() {
  const {data: session, status} = useSession();
  const userId:string | undefined = session?.user?.email ?? undefined;

  const enableExport = true;
  const enableEditView = true;
  const { searchFields } = useSearchFields();

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const reportOptions: ReportOption[] = [
    {
      id: "grid",
      label: "Search Results",
      icon: "grid",
      fetchAll: false,
      // No exports for grid view - use report views for exports
    },
    {
      id: "report",
      label: "Standard Report",
      icon: "report",
      fetchAll: true,
      exportFormats: [
        { format: "pdf", label: "Download PDF", icon: "pdf" },
        { format: "excel", label: "Download Excel", icon: "excel" },
        { format: "csv", label: "Download CSV", icon: "csv" },
      ],
    },
    {
      id: "test-data-report",
      label: "Test Data Report",
      icon: "detailed",
      fetchAll: true,
      description: "Report with test/sample data for validation",
      exportFormats: [
        { format: "csv", label: "Download CSV", icon: "csv" },
        { format: "json", label: "Download JSON", icon: "json" },
        { format: "html", label: "View as HTML", icon: "html" },
      ],
    },
  ];

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Grid management for state persistence
  const {
    state,
    updateState,
    navigateTo,
    setPage,
    setPageSize,
    setSortModel,
    setColumnVisibility,
    setSelectedRows,
  } = useGridManagement({
    gridId: "reviews-grid",
    scrollContainerRef,
  });

  interface PublicReview {
    value: string;
    label: string;
  }

  interface CommentSupportStatus {
    value: string;
    label: string;
  }

  // Local UI state
  // const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  // Use hasSearched from persisted grid state
  const hasSearched = state.hasSearched;  
  const [toast, setToast] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [downloadMenuAnchor, setDownloadMenuAnchor] =
    useState<null | HTMLElement>(null);
  const [columnSelectorOpen, setColumnSelectorOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedComment, setselectedComment] = useState<any>(null);
  // const [reviewComments, setReviewComments] = useState<
  //   PublicReviewCommentsResponse[] | null
  // >(null);
  // const [rowCount, setRowCount] = useState<number>(0);
  // const [loading, setLoading] = useState<boolean>(false);
  const [pcfLinkEnabled, setPCFLinkEnabled] = useState<boolean>(true);
  // const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
  //   page: 0,
  //   pageSize: 10,
  // });

  const [publicReviews, setPublicReviews] = useState<PublicReview[]>([]);
  const [commentSupportStatuses, setCommentSupportStatuses] = useState<
    CommentSupportStatus[]
  >([]);

  const reportQueryParams = useMemo(
    () => ({
      sortField: state.sortModel[0]?.field,
      sortOrder: state.sortModel[0]?.sort,
      search: state.filters.search,
      category: state.filters.category,
      status: state.filters.status,
      priceRange: state.filters.priceRange,
      dateFrom: state.filters.dateFrom,
      dateTo: state.filters.dateTo,
    }),
    [state.sortModel, state.filters],
  );

  const queryParams: PublicReviewSearchRequest =
    {
      page: state.page,
      pageSize: state.pageSize,
      pcfNumbers: state.filters.pcfNumbers,
      publicReviewId: state.filters.publicReviewId,
      commentIds: state.filters.commentIds,
      supportStatus: state.filters.supportStatus,
      subject: state.filters.subject,
      officialPTComment: state.filters.officialPTComment,
      commentText: state.filters.commentText,
      commenter: state.filters.commenter,
      province: state.filters.province,
      pcaCompleted: state.filters.pcaCompleted,
      pcaFullTextPhrase: state.filters.pcaFullTextPhrase,
      caCompleted: state.filters.caCompleted,
      caFullTextPhrase: state.filters.caFullTextPhrase,
      trRequired: state.filters.trRequired,
      trCompleted: state.filters.trCompleted,
      commentAppyingToFrenchVersionOnly: state.filters.commentAppyingToFrenchVersionOnly,
    };

  // const cookieHeader = document.cookie;
  const { data, isLoading, isError, error, refetch, isFetching } =
    usePublicReviewComments(
      queryParams,
      state.page,
      state.pageSize,
      { enabled: hasSearched },
    );

  const currentReportOption = reportOptions.find((opt) => opt.id === viewMode);
  const needsAllData = currentReportOption?.fetchAll === true;
  type ResponsiveGridColDef = GridColDef & { hideBelow?: Breakpoint };

  //saved search
  const {data: savedSearches = [], isLoading: isSavedSearchesLoading} = useSavedSearches({context: 'publicreviewcomments'});
  const updateSavedSearchMutation = useUpdateSavedSearch();
  const createSavedSearchMutation = useCreateSavedSearch();

  const fetchPcfComments = async (pcfId: number) => {
    // setLoading(true);
    // try {
    //   const cookieHeader = document.cookie;
    //   const request: PublicReviewSearchRequest = {
    //     page:0,
    //     pageSize:10,
    //     pcfNumbers: [pcfId],
    //     publicReviewId: 0,
    //     commentIds: []
    //     // isLegacyComment: false
    //   };
    //   const unbuiltreviews = await searchPublicReviewComments(request, 0, 10);

    //   setReviewComments(unbuiltreviews.items || []);
    //   setRowCount(unbuiltreviews.totalCount || 0);
    //   setPCFLinkEnabled(false);
    // } catch (error) {
    //   setReviewComments([]);
    //   setRowCount(0);
    // } finally {
    //   setLoading(false);
    // }
  };

  const fetchePRs = async () => {
    try {
      const cookieHeader = document.cookie;
      const prs = await fetchPublicReviews(cookieHeader);
      const mappedData = prs.map((item: any) => ({
        value: item.publicReviewId,
        label: item.publicReviewTitle,
      }));
      setPublicReviews(mappedData);
    } catch (error) {
      setPublicReviews([]);
    }
  };

  const fetchSupportStatuses = async () => {
    try {
      const cookieHeader = document.cookie;
      const statuses = await fetchCommentSupportStatuses(cookieHeader);
      const mappedData = statuses.map((item: any) => ({
        value: item.prCommentSupportStatusId,
        label: item.prCommentSupportStatusName,
      }));
      setCommentSupportStatuses(mappedData);
    } catch (error) {
      setCommentSupportStatuses([]);
    }
  };

  function renderPCFCell(params: GridRenderCellParams): React.ReactNode {
    if (!pcfLinkEnabled) {
      return params.value;
    }
    return (
      <Link
        href={`#${params.value}`}
        onClick={() => fetchPcfComments(params.value)}
      >
        {params.value}
      </Link>
    );
  }

  function renderLegacyCell(params: GridRenderCellParams): React.ReactNode {
    if (params.value) {
      return <span>Yes</span>;
    }
    return <span>No</span>;
  }

  const {
    data: reportData,
    isLoading: isReportLoading,
    isFetching: isReportFetching,
  } = usePublicReviewComments(
    queryParams,
    state.page,
    state.pageSize,
  );

  const prefetchComment = usePrefetchPublicReviewComment();

  const handleEditClick = async (row: any) => {
    prefetchComment(row.publicReviewCommentId);
    navigateTo(`/public-review-comments/edit/${row.publicReviewCommentId}`);
  };

  // const handleViewComment = (comment: any) => {
  //   setselectedComment(comment);
  //   setViewDialogOpen(true);
  // };


  const handleUpdateSearch = (searchId: string, updates: { name?: string; visibility?: 'user' | 'global' }) => {
    updateSavedSearchMutation.mutate({ id: searchId, ...updates });
  };

  const handleSaveSearch = (search: SavedSearch) => {
    createSavedSearchMutation.mutate({
      name: search.name,
      context: 'publicreviewcomments',
      visibility: search.visibility,
      createdBy: userId ?? "",
      params: search.params,
    }, {
      onSuccess: () => {
        setToast({ message: `"${search.name}" saved successfully`, severity: 'success' });
      },
      onError: (error) => {
        setToast({ message: 'Failed to save search. Please try again.', severity: 'error' });
      },
    });
  };

  const handleLoadSearch = (searchId: string) => {

  };

  const handleDeleteSearch = (searchId: string) => {
    // setSavedSearches((prev) => prev.filter((s) => s.id !== searchId));
    // console.log("Deleted Search ID:", searchId);
  };

  const handleRenameSearch = (searchId: string, newName: string) => {
    // setSavedSearches((prev) =>
    //   prev.map((s) => (s.id === searchId ? { ...s, name: newName } : s)),
    // );
    // console.log("Renamed Search ID:", searchId, "to:", newName);
  };

  const handleChangeVisibility = (
    searchId: string,
    visibility: "user" | "global",
  ) => {
    // setSavedSearches((prev) =>
    //   prev.map((s) => (s.id === searchId ? { ...s, visibility } : s)),
    // );
    // console.log("Changed Search ID:", searchId, "visibility to:", visibility);
  };

  const handleDownloadReport = async (format: ReportFormat) => {
    setDownloadMenuAnchor(null);

    // Use report data (all rows) for exports
    const searchResults = reportData?.items || [];
    const timestamp = new Date().toISOString().split("T")[0];
    const fileName = `comment-report-${timestamp}`;

    const activeColumns = selectedColumns.filter((col) => col.selected);

    if (activeColumns.length === 0) {
      alert("Please select at least one column to export");
      return;
    }

    try {
      switch (format) {
        case "pdf": {
          const jsPDFModule = await import("jspdf");
          const jsPDF = jsPDFModule.default;
          const autoTable = (await import("jspdf-autotable")).default;

          const doc = new jsPDF();
          doc.setFontSize(18);
          doc.text("PR Reviews Report", 14, 20);
          doc.setFontSize(10);
          doc.setTextColor(100);
          doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
          doc.text(`Total Results: ${searchResults.length}`, 14, 34);
          doc.setTextColor(0);

          const headers = activeColumns.map((col) => col.label);
          const body = searchResults.map((comment: any) =>
            activeColumns.map((col) => {
              const value = comment[col.id];
              if (col.id === "price") return `$${value?.toFixed(2) || "0.00"}`;
              if (col.id === "createdAt")
                return dayjs(value).format("MM/DD/YYYY");
              return value;
            }),
          );

          autoTable(doc, {
            startY: 42,
            head: [headers],
            body: body,
            styles: { fontSize: 10, cellPadding: 3 },
            headStyles: {
              fillColor: [63, 81, 181],
              textColor: 255,
              fontStyle: "bold",
            },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            margin: { top: 42 },
          });

          doc.save(`${fileName}.pdf`);
          break;
        }

        case "excel": {
          const XLSX = await import("xlsx");
          const worksheet = XLSX.utils.json_to_sheet(
            searchResults.map((comment: any) => {
              const row: any = {};
              activeColumns.forEach((col) => {
                const value = comment[col.id];
                let formattedValue = value;
                if (col.id === "price") formattedValue = value;
                else if (col.id === "createdAt")
                  formattedValue = dayjs(value).format("MM/DD/YYYY");
                row[col.label] = formattedValue;
              });
              return row;
            }),
          );

          const columnWidths = activeColumns.map(() => ({ wch: 20 }));
          worksheet["!cols"] = columnWidths;

          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, "comments");
          workbook.Props = {
            Title: "comment Report",
            Subject: "Search Results",
            Author: "Dynamic Search Component",
            CreatedDate: new Date(),
          };

          XLSX.writeFile(workbook, `${fileName}.xlsx`);
          break;
        }

        case "csv": {
          const headers = activeColumns.map((col) => col.label);
          const csvRows = [
            headers.join(","),
            ...searchResults.map((comment: any) =>
              activeColumns
                .map((col) => {
                  const value = comment[col.id];
                  let formattedValue = value;
                  if (col.id === "price") formattedValue = value;
                  else if (col.id === "name") formattedValue = `"${value}"`;
                  else if (col.id === "createdAt")
                    formattedValue = dayjs(value).format("MM/DD/YYYY");
                  return formattedValue;
                })
                .join(","),
            ),
          ];
          const csvContent = csvRows.join("\n");
          const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;",
          });
          const link = document.createElement("a");
          const url = URL.createObjectURL(blob);
          link.setAttribute("href", url);
          link.setAttribute("download", `${fileName}.csv`);
          link.style.visibility = "hidden";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          break;
        }
      }
    } catch (error) {
      console.error("Error downloading report:", error);
      alert(
        `Failed to download ${format.toUpperCase()} report. Please try again.`,
      );
    }
  };

  const handleExport = async (format: ReportFormat) => {
    console.log("Export requested:", format, "for report:", viewMode);

    // Handle standard formats
    if (format === "pdf" || format === "excel" || format === "csv") {
      await handleDownloadReport(format);
    } else if (format === "zip") {
      // Example: Handle ZIP export
      console.log("ZIP export requested - implement custom logic here");
      alert(
        "ZIP export not yet implemented. This would bundle all data into a ZIP archive.",
      );
    } else if (format === "json") {
      // Example: Handle JSON export
      const searchResults = reportData?.items || [];
      const jsonContent = JSON.stringify(searchResults, null, 2);
      const blob = new Blob([jsonContent], { type: "application/json" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `comment-report-${new Date().toISOString().split("T")[0]}.json`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === "html") {
      // Generate HTML preview and open in new window
      const searchResults = reportData?.items || [];
      const activeColumns = selectedColumns.filter((col) => col.selected);
      const timestamp = new Date().toLocaleString();

      // Helper function to format cell content
      const formatCellContent = (colId: string, value: any): string => {
        if (colId === "price") {
          return (
            '<span class="price">$' + (value?.toFixed(2) || "0.00") + "</span>"
          );
        } else if (colId === "createdAt") {
          return dayjs(value).format("MM/DD/YYYY");
        } else if (colId === "status") {
          const statusClass =
            value === "active"
              ? "chip-active"
              : value === "inactive"
                ? "chip-inactive"
                : "chip-discontinued";
          return '<span class="chip ' + statusClass + '">' + value + "</span>";
        } else if (colId === "category") {
          return '<span class="chip chip-category">' + value + "</span>";
        }
        return String(value ?? "");
      };

      // Pre-generate table headers
      const tableHeaders = activeColumns
        .map((col) => {
          const alignClass =
            col.id === "price" || col.id === "stock" ? "right" : "";
          return '<th class="' + alignClass + '">' + col.label + "</th>";
        })
        .join("");

      // Pre-generate table rows
      const tableRows = searchResults
        .map((comment: any) => {
          const cells = activeColumns
            .map((col) => {
              const value = comment[col.id];
              const alignClass =
                col.id === "price" || col.id === "stock" ? "right" : "";
              const cellContent = formatCellContent(col.id, value);
              return '<td class="' + alignClass + '">' + cellContent + "</td>";
            })
            .join("");
          return "<tr>" + cells + "</tr>";
        })
        .join("\n          ");

      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${currentReportOption?.label || "Report"} - Preview</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }
    .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header {
      background: linear-gradient(135deg, #3f51b5, #1a237e);
      color: white;
      padding: 24px;
      border-radius: 8px 8px 0 0;
    }
    .header h1 { font-size: 24px; margin-bottom: 8px; }
    .header .meta { font-size: 14px; opacity: 0.9; }
    .content { padding: 24px; }
    .stats {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .stat {
      background: #e3f2fd;
      padding: 12px 20px;
      border-radius: 6px;
      font-weight: 500;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    th {
      background: #3f51b5;
      color: white;
      padding: 12px 16px;
      text-align: left;
      font-weight: 600;
    }
    th.right { text-align: right; }
    td {
      padding: 12px 16px;
      border-bottom: 1px solid #e0e0e0;
    }
    td.right { text-align: right; }
    tr:nth-child(even) { background: #fafafa; }
    tr:hover { background: #e8f4fd; }
    .chip {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
    }
    .chip-active { background: #e8f5e9; color: #2e7d32; }
    .chip-inactive { background: #fff3e0; color: #e65100; }
    .chip-discontinued { background: #ffebee; color: #c62828; }
    .chip-category { background: #e3f2fd; color: #1565c0; border: 1px solid #90caf9; }
    .price { font-weight: 600; color: #1565c0; }
    .footer {
      padding: 16px 24px;
      background: #fafafa;
      border-top: 1px solid #e0e0e0;
      border-radius: 0 0 8px 8px;
      font-size: 12px;
      color: #666;
      display: flex;
      justify-content: space-between;
    }
    .actions {
      padding: 16px 24px;
      background: #fafafa;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      gap: 12px;
    }
    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    }
    .btn-primary { background: #3f51b5; color: white; }
    .btn-primary:hover { background: #303f9f; }
    .btn-secondary { background: #e0e0e0; color: #333; }
    .btn-secondary:hover { background: #bdbdbd; }
    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; }
      .actions { display: none; }
      .header { background: #3f51b5 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      th { background: #3f51b5 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${currentReportOption?.label || "comment Report"}</h1>
      <div class="meta">Generated: ${timestamp}</div>
      ${currentReportOption?.description ? '<div class="meta">' + currentReportOption.description + "</div>" : ""}
    </div>
    <div class="actions">
      <button class="btn btn-primary" onclick="window.print()">Print Report</button>
      <button class="btn btn-secondary" onclick="window.close()">Close Preview</button>
    </div>
    <div class="content">
      <div class="stats">
        <div class="stat">Total Results: ${searchResults.length}</div>
        <div class="stat">Columns: ${activeColumns.length}</div>
      </div>
      <table>
        <thead>
          <tr>
            ${tableHeaders}
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </div>
    <div class="footer">
      <span>comment Report</span>
      <span>Page 1 of 1</span>
    </div>
  </div>
</body>
</html>`;

      // Open in new window
      const previewWindow = window.open("", "_blank", "width=1200,height=800");
      if (previewWindow) {
        previewWindow.document.write(htmlContent);
        previewWindow.document.close();
      } else {
        alert(
          "Could not open preview window. Please allow popups for this site.",
        );
      }
    }
  };

  const baseColumns: ResponsiveGridColDef[] = [
    {
      field: "publicReviewCommentId",
      //field: 'id',
      headerName: "Comment ID",
      // flex: 1,
      type: "string",
      align: "left",
      editable: false,
      headerAlign: "left",
      width: 50,
    },
    {
      field: "isLegacyComment",
      //field: 'id',
      headerName: "Legacy Comment",
      // flex: 1,
      renderCell: (params) => renderLegacyCell(params),
      type: "boolean",
      align: "left",
      editable: false,
      headerAlign: "left",
      width: 50,
      hideBelow:"lg"
    },
    {
      field: "publicReviewTitle",
      headerName: "Public Review",
      // flex: 1,
      type: "string",
      align: "left",
      editable: false,
      headerAlign: "left",
      width: 150,
      hideBelow:"lg"
    },
    {
      field: "description",
      headerName: "PCF Cycle",
      // flex: 1,
      type: "string",
      align: "left",
      editable: false,
      headerAlign: "left",
      width: 150,
      hideBelow:"lg"
    },
    {
      field: "pcfId",
      renderCell: (params) => renderPCFCell(params),
      headerName: "PCF",
      type: "string",
      editable: false,
      align: "left",
      headerAlign: "left",
      width: 75,
      // flex: 1,
      hideBelow:"lg"
    },
    {
      field: "overallComments",
      headerName: "Overall Comments",
      flex: 1,
      type: "string",
      align: "left",
      editable: false,
      headerAlign: "left",
      width: 250,
      hideBelow:"lg"
    },
  ];

  const columns: GridColDef[] = enableEditView
    ? [
        ...baseColumns,
        {
          field: "actions",
          headerName: "Actions",
          width: 170,
          sortable: false,
          filterable: false,
          renderCell: (params) => {
            // const lock = lockedRows[params.row.id];
            // const isLockedByOther = lock && lock.lockedBy !== currentUser;
            // const isLockedByMe = lock && lock.lockedBy === currentUser;

            return (
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  alignItems: "center",
                  height: "100%",
                }}
              >
                {/* {isLockedByOther && (
                  <Chip
                    icon={<LockIcon />}
                    label={`Locked by ${lock.lockedBy.split("@")[0]}`}
                    size="small"
                    color="warning"
                  />
                )}
                {isLockedByMe && (
                  <Chip
                    icon={<LockIcon />}
                    label="Editing"
                    size="small"
                    color="info"
                  />
                )} */}
                {/* <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ViewIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    // handleViewcomment(params.row);
                  }}
                >
                  View
                </Button> */}
                 <Button
                      size="medium"
                      variant="contained"
                      startIcon={<EditIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(params.row);
                      }}
                      style={{flex:1}}
                      onMouseEnter={() =>
                        prefetchComment(params.row.publicReviewCommentId)
                      }
                      // disabled={isLockedByOther}
                    >
                      Edit
                    </Button>
                {/* <Tooltip
                  title={
                    isLockedByOther
                      ? `Locked by ${lock.lockedBy}`
                      : "Edit comment"
                  }
                >
                  <span>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<EditIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(params.row);
                      }}
                      // onMouseEnter={() => prefetchcomment(params.row.id)}
                      disabled={isLockedByOther}
                    >
                      Edit
                    </Button>
                  </span>
                </Tooltip> */}
              </Box>
            );
          },
        },
      ]
    : baseColumns;

  const responsiveColumnConfig: ResponsiveColumnConfig[] = [...baseColumns.map(({ field, hideBelow }) => ({ field, hideBelow })),
    { field: 'actions' },
  ];
  
  const {
    columnVisibilityModel,
    setColumnsVisible,
    resetToResponsiveDefaults,
    hasCustomVisibility,
  } = useResponsiveColumnVisibility({
    columns,
    responsiveConfig: responsiveColumnConfig,
    userVisibility: state.columnVisibility,
    onUserVisibilityChange: setColumnVisibility,
    userPreferencesPriority: true, // User can override responsive hiding
    minimumVisibleColumns: 1,
    excludeFromMinimum: ['actions', '__check__'],
  });

  const availableColumns = useMemo(
    () =>
      baseColumns
        .filter((col) => col.field !== "id" && col.field !== "actions")
        .map((col) => ({
          id: col.field,
          label: col.headerName || col.field,
          selected: true,
        })),
    [],
  );

  const [selectedColumns, setSelectedColumns] = useState(availableColumns);

  // Handlers
  const handleSearch = (
    params: Record<string, any>,
    selectedViewMode?: ViewMode,
  ) => {

    // Update filters in grid state, reset to page 0, and mark as searched
    updateState({
      filters: params,
      page: 0,
      hasSearched: true,
    });
  };

  const handleReset = () => {
    // Clear filters and reset hasSearched flag
    updateState({
      filters: {},
      page: 0,
      hasSearched: false,
    });
  };

  useEffect(() => {
    fetchePRs();
    fetchSupportStatuses();
  }, []);

  // Pagination handlers
  const handlePaginationChange = (model: GridPaginationModel) => {
    if (model.page == state.page && model.pageSize === state.pageSize) return;
    updateState({page: model.page, pageSize: model.pageSize});
  };

  const handleSortChange = (model: GridSortModel) => {
    setSortModel(model as Array<{ field: string; sort: "asc" | "desc" }>);
  };

  const handleRowSelectionChange = (model: GridRowSelectionModel) => {
    // if (model && typeof model === 'object' && 'ids' in model) {
    //   const ids = Array.from(model.ids) as (string | number)[];
    //   console.log('Selected IDs:', ids);
    //   setSelectedRows(ids);
    // }
  };

  const renderGridView = () => {
    if (!isMounted) {
      return (
        <Paper
          elevation={1}
          sx={{ height: 500, width: "100%" }}
          ref={scrollContainerRef}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <CircularProgress />
          </Box>
        </Paper>
      );
    }
    return (
      <Paper
        elevation={1}
        sx={{ height: 500, width: "100%" }}
        ref={scrollContainerRef}
      >
          {hasCustomVisibility && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 1, pt: 1 }}>
              <Button
                size="small"
                startIcon={<RefreshIcon />}
                onClick={resetToResponsiveDefaults}
              >
                Reset Columns
              </Button>
            </Box>
          )}
        <DataGrid
          rows={data?.items || []}
          columns={columns}
          rowCount={data?.totalCount || 0}
          loading={isLoading || isFetching}
          getRowId={(row) => row.publicReviewCommentId}
          pageSizeOptions={[10, 25, 50, 100]}
          paginationModel={{ page: state.page, pageSize: state.pageSize }}
          onPaginationModelChange={handlePaginationChange}
          paginationMode="server"
          sortModel={state.sortModel}
          onSortModelChange={handleSortChange}
          sortingMode="server"
          checkboxSelection
          onRowSelectionModelChange={handleRowSelectionChange}
          columnVisibilityModel={columnVisibilityModel}
          onColumnVisibilityModelChange={(model)=> setColumnsVisible(model)}
          slots={{
            loadingOverlay: () => (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                <CircularProgress />
              </Box>
            ),
          }}
        />
      </Paper>
    );
  };

  // Get icon component for export format
  const getExportIcon = (iconType?: string) => {
    switch (iconType) {
      case "pdf":
        return <PdfIcon fontSize="small" />;
      case "excel":
        return <ExcelIcon fontSize="small" />;
      case "csv":
        return <CsvIcon fontSize="small" />;
      default:
        return <DownloadIcon fontSize="small" />;
    }
  };

  // Render report view
  const renderReportView = () => {
    const activeColumns = selectedColumns.filter((col) => col.selected);
    // Use report data (all rows) for report view
    const searchResults = reportData?.items || [];

    // Get export formats for current report type
    const currentExportFormats = currentReportOption?.exportFormats || [];

    // Show loading state for report data
    if (isReportLoading || isReportFetching) {
      return (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            py: 4,
          }}
        >
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading all data for report...</Typography>
        </Box>
      );
    }

    return (
      <Box>
        {/* Report Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {currentReportOption?.label || "Report"} (
              {reportData?.totalCount || searchResults.length} results)
            </Typography>
            {currentReportOption?.description && (
              <Typography variant="body2" color="text.secondary">
                {currentReportOption.description}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              onClick={() => setColumnSelectorOpen(true)}
            >
              Select Columns
            </Button>
            {enableExport && currentExportFormats.length > 0 && (
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={(e) => setDownloadMenuAnchor(e.currentTarget)}
              >
                Export
              </Button>
            )}
          </Box>
        </Box>

        {/* Export Menu - dynamic based on report's export formats */}
        {enableExport && currentExportFormats.length > 0 && (
          <Menu
            anchorEl={downloadMenuAnchor}
            open={Boolean(downloadMenuAnchor)}
            onClose={() => setDownloadMenuAnchor(null)}
          >
            {currentExportFormats.map((exportOption) => (
              <MenuItem
                key={exportOption.format}
                onClick={() => {
                  setDownloadMenuAnchor(null);
                  handleExport(exportOption.format);
                }}
                disabled={exportOption.enabled === false}
              >
                <ListItemIcon>{getExportIcon(exportOption.icon)}</ListItemIcon>
                <ListItemText>
                  {exportOption.label ||
                    `Download as ${exportOption.format.toUpperCase()}`}
                </ListItemText>
              </MenuItem>
            ))}
          </Menu>
        )}
        <TableContainer component={Paper} variant="outlined">
          <Table sx={{ minWidth: 650 }} aria-label="comment report table">
            <TableHead>
              <TableRow sx={{ bgcolor: "primary.main" }}>
                {activeColumns.map((col) => (
                  <TableCell
                    key={col.id}
                    sx={{ color: "white", fontWeight: "bold" }}
                    align={
                      col.id === "price" || col.id === "stock"
                        ? "right"
                        : "left"
                    }
                  >
                    {col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {searchResults.map((comment: any) => (
                <TableRow
                  key={comment.publicReviewCommentId}
                  sx={{
                    "&:nth-of-type(odd)": { bgcolor: "action.hover" },
                    "&:hover": { bgcolor: "action.selected" },
                  }}
                >
                  {activeColumns.map((col) => {
                    const value = comment[col.id];
                    return (
                      <TableCell
                        key={col.id}
                        align={
                          col.id === "price" || col.id === "stock"
                            ? "right"
                            : "left"
                        }
                      >
                        {col.id === "category" ? (
                          <Chip
                            label={value}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ) : col.id === "status" ? (
                          <Chip
                            label={value}
                            size="small"
                            color={
                              value === "active"
                                ? "success"
                                : value === "inactive"
                                  ? "warning"
                                  : "error"
                            }
                          />
                        ) : col.id === "price" ? (
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            ${value?.toFixed(2) || "0.00"}
                          </Typography>
                        ) : col.id === "createdAt" ? (
                          dayjs(value).format("MM/DD/YYYY")
                        ) : (
                          value
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  const renderResults = () => {
    if (!hasSearched) {
      return (
        <Alert severity="info">
          Fill out the search form above and click "Search" to see results.
        </Alert>
      );
    }

    if (isError) {
      return (
        <Alert severity="error">
          Failed to load comments: {(error as Error)?.message || "Unknown error"}
        </Alert>
      );
    }

    // For views needing all data, check reportData; for grid view, check data
    const currentData = needsAllData ? reportData : data;
    if (currentData?.items.length === 0) {
      return (
        <Alert severity="warning">
          No comments found matching your search criteria. Try adjusting your
          filters.
        </Alert>
      );
    }

    // Render based on view mode - grid for 'grid', report view for any fetchAll view
    if (viewMode === "grid") {
      return renderGridView();
    } else if (needsAllData) {
      // All fetchAll view types use the report view renderer
      return renderReportView();
    }
    return renderGridView();
  };

  const handleToggleColumn = (columnId: string) => {
    setSelectedColumns((prev) =>
      prev.map((col) =>
        col.id === columnId ? { ...col, selected: !col.selected } : col,
      ),
    );
  };

  const handleSelectAllColumns = () => {
    setSelectedColumns((prev) =>
      prev.map((col) => ({ ...col, selected: true })),
    );
  };

  const handleDeselectAllColumns = () => {
    setSelectedColumns((prev) =>
      prev.map((col) => ({ ...col, selected: false })),
    );
  };

  return (
    <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h3" component="h1" gutterBottom>
            Public Review Comments
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" paragraph>
            Search public review comments, export options, and saved searches.
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Refresh data">
            <IconButton onClick={() => refetch()} disabled={isFetching}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          {/* <Button
            variant="contained"
            startIcon={<AddIcon />}
            // onClick={() => navigateTo('/comments/new')}
          >
            Add comment
          </Button> */}
        </Box>
      </Box>

      {/* <Alert severity="info" sx={{ mb: 2 }}>
        <strong>Features:</strong> Grid or Report view, export to PDF/Excel/CSV, saved searches, and filter persistence when editing.
      </Alert> */}

      {/* DynamicSearch Component */}
      <DynamicSearch
        key={JSON.stringify(state.filters)}
        fields={searchFields}
        onSearch={handleSearch}
        onReset={handleReset}
        onSave={handleSaveSearch}
        onLoad={handleLoadSearch}
        onDelete={handleDeleteSearch}
        onUpdate={handleUpdateSearch}
        savedSearches={savedSearches}
        enableSaveSearch={true}
        currentUser = {userId}
        searchContext="publicreviewcomments"
        allowCrossContext={false}
        isAdmin={false}
        columnLayout={3}
        enableViewMode={true}
        defaultViewMode={viewMode}
        onViewModeChange={setViewMode}
        reportOptions={reportOptions}
        initialValues={state.filters}
        searchTitle="Search"
        defaultExpanded={!hasSearched}
      />

      {/* Search Results */}
      <Box mt={4}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h5">
              Search Results
              {hasSearched && (needsAllData ? reportData : data) && (
                <Chip
                  label={`${(needsAllData ? reportData?.totalCount : data?.totalCount) || 0} ${((needsAllData ? reportData?.totalCount : data?.totalCount) || 0) === 1 ? "result" : "results"}`}
                  size="small"
                  color="primary"
                  sx={{ ml: 2 }}
                />
              )}
            </Typography>
            {hasSearched &&
              (needsAllData ? reportData : data) &&
              ((needsAllData ? reportData?.items : data?.items)?.length ?? 0) >
                0 && (
                <Chip
                  label={`View: ${currentReportOption?.label || viewMode}`}
                  color="secondary"
                  variant="outlined"
                />
              )}
          </Box>

          {/* Selection Info */}
          {state.selectedRowIds.length > 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {state.selectedRowIds.length} row(s) selected
            </Alert>
          )}

          {renderResults()}

          {/* Stats */}
          {/* {hasSearched &&
            data &&
            data.items.length > 0 &&
            viewMode === "grid" && (
              <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Page {data.pageNumber + 1} of {data.totalCount}
                </Typography>
              </Box>
            )} */}
        </Paper>
      </Box>

      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>View Public Review - {selectedComment?.name}</DialogTitle>
        <DialogContent>
          {selectedComment && (
            <Box sx={{ pt: 2 }}>
              <DynamicSearch
                fields={searchFields.map((f) => ({ ...f, disabled: true }))}
                onSearch={() => {}}
                initialValues={selectedComment}
                searchButtonText="Edit"
                resetButtonText="Close"
                enableSaveSearch={false}
                columnLayout={1}
                onReset={() => setViewDialogOpen(false)}
                searchTitle="Search"
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={columnSelectorOpen}
        onClose={() => setColumnSelectorOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Select Columns for Report</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormGroup>
              {selectedColumns.map((col) => (
                <FormControlLabel
                  key={col.id}
                  control={
                    <Checkbox
                      checked={col.selected}
                      onChange={() => handleToggleColumn(col.id)}
                    />
                  }
                  label={col.label}
                />
              ))}
            </FormGroup>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeselectAllColumns}>Deselect All</Button>
          <Button onClick={handleSelectAllColumns}>Select All</Button>
          <Button
            onClick={() => setColumnSelectorOpen(false)}
            variant="contained"
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
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
