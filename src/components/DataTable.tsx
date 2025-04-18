import { useState, useMemo } from "react";

interface DataTableProps<Row> {
  data: Row[];
}

const DataTable = <Row extends Record<string, any>>({
  data,
}: DataTableProps<Row>) => {
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  // Derive column list from first row
  const columns = useMemo(() => {
    return data.length > 0 ? Object.keys(data[0]) : [];
  }, [data]);

  // 1) Global search filter
  const filtered = useMemo(() => {
    const term = search.toLowerCase();
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

  return (
    <div className="mt-6 px-4 md:px-12 lg:px-24">
      {/* Search Input */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search…"
        className="mb-4 px-3 py-2 border border-gray-200 rounded w-full md:w-1/2 focus:outline-none focus:ring-2 focus:ring-lime-300"
      />

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  onClick={() => requestSort(col)}
                  className="px-4 py-2 border-b text-left cursor-pointer select-none"
                >
                  <div className="flex items-center">
                    <span className="capitalize">{col.replace(/_/g, " ")}</span>
                    {sortConfig?.key === col && (
                      <span className="ml-1 text-sm">
                        {sortConfig.direction === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                {columns.map((col) => (
                  <td
                    key={col}
                    className="px-4 py-2 border-b whitespace-nowrap"
                  >
                    {row[col] ?? ""}
                  </td>
                ))}
              </tr>
            ))}

            {sorted.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-2 text-center text-gray-500"
                >
                  No matching records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
