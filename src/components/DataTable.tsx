import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Search, XCircle } from "lucide-react";

interface DataTableProps<Row> {
  data: Row[];
  onRowClick?: (row: Row) => void;
  title?: string;
}

const DataTable = <Row extends Record<string, any>>({
  data,
  onRowClick,
  title = "Data Table"
}: DataTableProps<Row>) => {
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  // Derive column list from first row
  const columns = useMemo(() => {
    return data.length > 0 ? Object.keys(data[0]) : [];
  }, [data]);

  // Initialize visible columns if not set
  useMemo(() => {
    if (visibleColumns.length === 0 && columns.length > 0) {
      setVisibleColumns(columns);
    }
  }, [columns, visibleColumns]);

  // 1) Global search filter
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

  // 2) Sorting
  const sorted = useMemo(() => {
    if (!sortConfig) return filtered;
    const { key, direction } = sortConfig;
    return [...filtered].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      // handle null/undefined
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      // numeric vs string
      if (typeof aVal === "number" && typeof bVal === "number") {
        return direction === "asc" ? aVal - bVal : bVal - aVal;
      }
      return direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filtered, sortConfig]);

  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig?.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const toggleColumn = (col: string) => {
    if (visibleColumns.includes(col)) {
      if (visibleColumns.length > 1) { // Prevent hiding all columns
        setVisibleColumns(visibleColumns.filter(c => c !== col));
      }
    } else {
      setVisibleColumns([...visibleColumns, col]);
    }
  };

  const clearSearch = () => {
    setSearch("");
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 max-w-full">
      {/* Header with Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-0">{title}</h2>
        
        <div className="flex flex-col md:flex-row gap-3">
          {/* Column Selector Button */}
          <button
            onClick={() => setShowColumnSelector(!showColumnSelector)}
            className="px-3 py-2 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 transition-colors text-sm font-medium"
          >
            Columns
          </button>
          
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search in table..."
              className="pl-10 pr-10 py-2 border border-gray-200 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
            />
            {search && (
              <button 
                onClick={clearSearch}
                className="absolute right-3 top-2.5"
              >
                <XCircle className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Column Selector Dropdown */}
      {showColumnSelector && (
        <div className="mb-4 p-4 bg-gray-50 rounded-md border border-gray-200">
          <h3 className="font-medium mb-2 text-gray-700">Toggle Columns</h3>
          <div className="flex flex-wrap gap-2">
            {columns.map(col => (
              <label key={col} className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={visibleColumns.includes(col)}
                  onChange={() => toggleColumn(col)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 mr-1"
                />
                <span className="text-sm text-gray-700 capitalize">{col.replace(/_/g, " ")}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns
                .filter(col => visibleColumns.includes(col))
                .map((col) => (
                <th
                  key={col}
                  onClick={() => requestSort(col)}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                >
                  <div className="flex items-center">
                    <span className="capitalize">{col.replace(/_/g, " ")}</span>
                    <span className="ml-1 flex flex-col">
                      <ChevronUp 
                        className={`h-3 w-3 ${sortConfig?.key === col && sortConfig.direction === 'asc' ? 'text-indigo-500' : 'text-gray-300'}`} 
                      />
                      <ChevronDown 
                        className={`h-3 w-3 mt-0.5 ${sortConfig?.key === col && sortConfig.direction === 'desc' ? 'text-indigo-500' : 'text-gray-300'}`} 
                      />
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sorted.map((row, idx) => (
              <tr 
                key={idx} 
                onClick={() => onRowClick?.(row)} 
                className="transition-colors hover:bg-indigo-50 cursor-pointer"
              >
                {columns
                  .filter(col => visibleColumns.includes(col))
                  .map((col) => {
                  const cellValue = row[col] ?? "";
                  
                  // Handle different data types for better display
                  let displayValue = cellValue;
                  if (typeof cellValue === 'boolean') {
                    displayValue = cellValue ? 'Yes' : 'No';
                  } else if (cellValue instanceof Date) {
                    displayValue = cellValue.toLocaleDateString();
                  }
                  
                  return (
                    <td
                      key={col}
                      className="px-4 py-3 whitespace-nowrap text-sm text-gray-700"
                    >
                      {displayValue}
                    </td>
                  );
                })}
              </tr>
            ))}

            {sorted.length === 0 && (
              <tr>
                <td
                  colSpan={visibleColumns.length}
                  className="px-4 py-6 text-center text-gray-500 text-sm"
                >
                  No matching records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Table Footer/Summary */}
      <div className="mt-4 text-sm text-gray-600 flex justify-between items-center">
        <span>
          Showing {sorted.length} of {data.length} records
        </span>
        
        {search && (
          <span className="text-indigo-600">
            Filtered by: "{search}"
          </span>
        )}
      </div>
    </div>
  );
};

export default DataTable;