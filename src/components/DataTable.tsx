import { useState, useMemo } from "react";
import { Search, X, ArrowUpDown, ChevronLeft, ChevronRight, Filter, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DataTableProps<Row> {
  data: Row[];
  onRowClick?: (row: Row) => void;
  title?: string;
  description?: string;
}

const DataTable = <Row extends Record<string, any>>({
  data,
  onRowClick,
  title = "Data Table",
  description,
}: DataTableProps<Row>) => {
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Derive columns from data
  const columns = useMemo(() => {
    return data.length > 0 ? Object.keys(data[0]) : [];
  }, [data]);

  // Initialize visible columns
  useMemo(() => {
    if (visibleColumns.length === 0 && columns.length > 0) {
      // On mobile, start with fewer columns visible by default
      const isMobile = window.innerWidth < 640;
      setVisibleColumns(isMobile ? columns.slice(0, 3) : columns);
    }
  }, [columns, visibleColumns]);

  // Global search filter
  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return data;
    return data.filter((row) =>
      columns.some((col) => {
        const cell = row[col];
        return (
          cell != null &&
          String(cell).toLowerCase().includes(term)
        );
      })
    );
  }, [data, search, columns]);

  // Sorting logic
  const sorted = useMemo(() => {
    if (!sortConfig) return filtered;
    const { key, direction } = sortConfig;
    return [...filtered].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return direction === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filtered, sortConfig]);

  // Handle sort requests
  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig?.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  // Pagination calculations
  const totalPages = Math.max(Math.ceil(sorted.length / itemsPerPage), 1);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sorted.slice(start, start + itemsPerPage);
  }, [sorted, currentPage, itemsPerPage]);

  // Column toggle
  const toggleColumn = (col: string) => {
    if (visibleColumns.includes(col)) {
      if (visibleColumns.length > 1) {
        setVisibleColumns(visibleColumns.filter((c) => c !== col));
      }
    } else {
      setVisibleColumns([...visibleColumns, col]);
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearch("");
    setCurrentPage(1);
  };

  // Format column display name
  const formatColumnName = (col: string) => {
    return col.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  };

  // Export table data as CSV
  const exportToCSV = () => {
    const visibleData = sorted.map(row => {
      const newRow: Record<string, any> = {};
      visibleColumns.forEach(col => {
        newRow[col] = row[col];
      });
      return newRow;
    });
    
    const headers = visibleColumns.map(col => formatColumnName(col));
    const csvContent = [
      headers.join(','),
      ...visibleData.map(row => visibleColumns.map(col => {
        const value = row[col];
        return value !== null && value !== undefined ? 
          `"${String(value).replace(/"/g, '""')}"` : '';
      }).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title.toLowerCase().replace(/\s+/g, '-')}-data.csv`;
    link.click();
  };

  // responsive column visibility
  const getResponsiveVisibleColumns = () => {
    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
    
    if (windowWidth < 640) { 
      return visibleColumns.slice(0, 2);
    } else if (windowWidth < 768) { 
      return visibleColumns.slice(0, 4);
    } else {
      return visibleColumns;
    }
  };

  const responsiveVisibleColumns = useMemo(getResponsiveVisibleColumns, [visibleColumns]);

  return (
    <Card className="w-full shadow-lg border-opacity-50 overflow-hidden">
      <CardHeader className="pb-3 bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col space-y-1.5">
          <CardTitle className="text-xl font-bold">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-2 py-1">
              {sorted.length} {sorted.length === 1 ? 'record' : 'records'}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1 cursor-pointer">
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Columns</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {columns.map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col}
                    checked={visibleColumns.includes(col)}
                    onCheckedChange={() => toggleColumn(col)}
                  >
                    {formatColumnName(col)}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 gap-1 cursor-pointer" 
              onClick={exportToCSV}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 pr-8 h-9 w-full md:w-64 lg:w-80"
            />
            {search && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 rounded-full"
                onClick={clearSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border-t">
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800">
                  {columns
                    .filter((col) => responsiveVisibleColumns.includes(col))
                    .map((col) => (
                      <TableHead key={col} className="whitespace-nowrap font-medium">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 py-1 font-semibold"
                          onClick={() => requestSort(col)}
                        >
                          <span>{formatColumnName(col)}</span>
                          <ArrowUpDown className="ml-1 h-3 w-3 opacity-70" />
                          {sortConfig?.key === col && (
                            <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
                              {sortConfig.direction === "asc" ? "↑" : "↓"}
                            </Badge>
                          )}
                        </Button>
                      </TableHead>
                    ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((row, idx) => (
                    <TableRow
                      key={idx}
                      onClick={() => onRowClick?.(row)}
                      className={`${
                        idx % 2 === 0 ? "bg-white dark:bg-gray-950" : "bg-gray-50 dark:bg-gray-900/50"
                      } ${onRowClick ? "cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20" : ""}`}
                    >
                      {columns
                        .filter((col) => responsiveVisibleColumns.includes(col))
                        .map((col) => {
                          const cellValue = row[col] ?? '';
                          let displayValue = cellValue;
                          
                          if (typeof cellValue === 'boolean') {
                            displayValue = cellValue ? 'Yes' : 'No';
                          } else if (cellValue instanceof Date) {
                            displayValue = cellValue.toLocaleDateString();
                          }
                          
                          return (
                            <TableCell key={col} className="py-3">
                              {displayValue}
                            </TableCell>
                          );
                        })}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={responsiveVisibleColumns.length}
                      className="h-32 text-center"
                    >
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <p>No results found</p>
                        {search && (
                          <Button 
                            variant="link" 
                            onClick={clearSearch} 
                            className="mt-2"
                          >
                            Clear search
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t p-4 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              Rows per page:
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 w-16 cursor-pointer">
                  {itemsPerPage}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {[5, 10, 25, 50, 100].map((size) => (
                  <DropdownMenuCheckboxItem
                    key={size}
                    checked={itemsPerPage === size}
                    onCheckedChange={() => {
                      setItemsPerPage(size);
                      setCurrentPage(1);
                    }}
                  >
                    {size}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="text-sm text-muted-foreground hidden sm:block">
              Showing {sorted.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{" "}
              {Math.min(currentPage * itemsPerPage, sorted.length)} of{" "}
              {sorted.length}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              className="h-8 w-8 p-0 cursor-pointer"
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <span className="sr-only">First Page</span>
              <ChevronLeft className="h-4 w-4" />
              <ChevronLeft className="h-4 w-4 -ml-2" />
            </Button>
            <Button
              className="h-8 w-8 p-0 cursor-pointer"
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
            >
              <span className="sr-only">Previous Page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8 p-0 cursor-pointer"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <div className="sm:hidden">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 cursor-pointer" 
                disabled
              >
                {currentPage} / {totalPages}
              </Button>
            </div>
            
            <Button
              className="h-8 w-8 p-0 cursor-pointer"
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <span className="sr-only">Next Page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              className="h-8 w-8 p-0 cursor-pointer"
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <span className="sr-only">Last Page</span>
              <ChevronRight className="h-4 w-4" />
              <ChevronRight className="h-4 w-4 -ml-2" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataTable;