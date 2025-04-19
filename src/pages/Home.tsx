// src/pages/Home.tsx
import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import { FilterBar, FilterItem } from "../components/FilterBar";
import DataTable from "../components/DataTable";
import ChartView from "../components/ChartView";
import Footer from "../components/Footer";
import logo from "../assets/segwise-logo.png";
import csvText from "../data/creatives.csv?raw";
import { BarChart2, Table as TableIcon, ExternalLink } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export interface CreativeRow {
  [key: string]: string | number;
  id: number; // Added id field for row identification
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [tableData, setTableData] = useState<CreativeRow[]>([]);
  const [filteredData, setFilteredData] = useState<CreativeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewRow, setPreviewRow] = useState<CreativeRow | null>(null);
  const [activeFilters, setActiveFilters] = useState<FilterItem[]>([]); void(activeFilters);
  const [viewMode, setViewMode] = useState<"summary" | "table">("summary");
  
  // Reload on 'R'
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.key === "r" || e.key === "R") && !(e.target instanceof HTMLInputElement)) {
        window.location.reload();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Parse CSV
  useEffect(() => {
    try {
      const res = Papa.parse<CreativeRow>(csvText, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        transformHeader: (h) => h.trim(),
      });
      const data = res.data.map((row, index) => {
        const cleaned: any = { id: index }; // Add an ID for each row
        Object.entries(row).forEach(([k, v]) => {
          cleaned[k.trim()] = typeof v === "string" ? v.trim() : v;
        });
        return cleaned;
      });
      setTableData(data);
      setFilteredData(data);
    } catch (err: any) {
      setError(err.message || "Parsing error");
    } finally {
      setLoading(false);
    }
  }, []);

  // When filters change, update filteredData
  const handleFiltersChange = (filters: FilterItem[]) => {
    setActiveFilters(filters);
    if (filters.length === 0) {
      setFilteredData(tableData);
      return;
    }

    const result = tableData.filter((row) =>
      filters.every((f) => {
        const raw = row[f.category.name];
        // Numeric?
        if (f.isNumeric && f.operator) {
          const val = Number(raw);
          const cmp = Number(f.value);
          switch (f.operator) {
            case "equals":
              return val === cmp;
            case "lesser than":
              return val < cmp;
            case "greater than":
              return val > cmp;
            default:
              return true;
          }
        }

        // String comparison
        const str = String(raw).toLowerCase();
        const tgt = String(f.value).toLowerCase();
        switch (f.operator) {
          case "contains":
            return str.includes(tgt);
          case "does not contain":
            return !str.includes(tgt);
          case "is":
            return str === tgt;
          case "is not":
            return str !== tgt;
          default:
            // default to equals
            return str === tgt;
        }
      })
    );

    setFilteredData(result);
  };

  // Handle navigation to row detail page
  const handleViewRowDetail = (row: CreativeRow) => {
    if (row.id !== undefined) {
      navigate(`/row/${row.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-white relative">
      {/* Header */}
      <header className="px-4 md:px-12 lg:px-24 py-6 flex items-center space-x-3">
        <Link to="/">
          <img src={logo} alt="Segwise Logo" className="h-13 w-auto cursor-pointer" />
        </Link>
        <div className="flex flex-col leading-tight">
          <span className="text-xl font-semibold text-gray-700">Segwise</span>
          <span className="text-2xl text-gray-500">Front End Test</span>
        </div>
      </header>

      {/* Filters */}
      <div className="px-4 md:px-12 lg:px-24 mb-4">
        <div className="border-2 border-dashed border-gray-300 rounded-md py-6 px-4">
          <FilterBar onFiltersChange={handleFiltersChange} />
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="px-4 md:px-12 lg:px-24 flex items-center gap-4 mb-4">
        <button
          onClick={() => setViewMode("summary")}
          className={`p-2 rounded-md ${
            viewMode === "summary" ? "bg-gray-200" : "hover:bg-gray-100"
          }`}
        >
          <BarChart2 className="w-5 h-5" />
        </button>
        <button
          onClick={() => setViewMode("table")}
          className={`p-2 rounded-md ${
            viewMode === "table" ? "bg-gray-200" : "hover:bg-gray-100"
          }`}
        >
          <TableIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 md:px-12 lg:px-24">
        {loading && <p className="text-gray-600">Loading data…</p>}
        {error && <p className="text-red-500">Error: {error}</p>}
        {!loading && !error && (
          viewMode === "table" ? (
            <>
              <div className="mb-4 text-sm text-gray-600">
                {filteredData.length === tableData.length
                  ? `Showing all ${tableData.length} rows`
                  : `Showing ${filteredData.length} of ${tableData.length} rows`}
              </div>
              <DataTable data={filteredData} onRowClick={setPreviewRow} />
            </>
          ) : (
            <ChartView
              data={filteredData}
              viewMode={viewMode === "summary" ? "summary" : "trend"}
            />
          )
        )}
      </div>

      {/* Row Preview */}
      {previewRow && (
        <div className="fixed bottom-6 right-6 w-80 max-h-[60vh] bg-white shadow-xl border rounded-xl p-4 overflow-auto z-50">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-800">Row Preview</h3>
            <button
              onClick={() => setPreviewRow(null)}
              className="text-gray-400 hover:text-red-500 text-sm"
            >
              ✕
            </button>
          </div>
          <div className="space-y-2 text-sm text-gray-700">
            {Object.entries(previewRow).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="font-medium capitalize">
                  {key.replace(/_/g, " ")}:
                </span>
                <span className="ml-2 text-right">{String(value)}</span>
              </div>
            ))}
          </div>
          
          {/* View Full Details Button */}
          <button 
            onClick={() => handleViewRowDetail(previewRow)}
            className="w-full mt-4 py-2 bg-blue-500 text-white rounded-md flex items-center justify-center hover:bg-blue-600 transition-colors"
          >
            <span>View Full Details</span>
            <ExternalLink className="ml-2 w-4 h-4" />
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-10 px-4 md:px-12 lg:px-24">
        <h2 className="font-semibold text-md text-gray-800 mb-2">Instructions</h2>
        <p className="text-gray-600">
          Click <kbd className="px-2 py-1 border rounded bg-gray-100">R</kbd> to restart prototype
        </p>
      </div>

      <Footer />
    </div>
  );
};

export default Home;