import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import { FilterBar } from "../components/FilterBar";
import DataTable from "../components/DataTable";
import Footer from "../components/Footer";
import logo from "../assets/segwise-logo.png";
import csvText from "../data/creatives.csv?raw";
import { FilterItem } from "../components/FilterBar";

export interface CreativeRow {
  [key: string]: string | number;
}

const Home: React.FC = () => {
  const [tableData, setTableData] = useState<CreativeRow[]>([]);
  const [filteredData, setFilteredData] = useState<CreativeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewRow, setPreviewRow] = useState<CreativeRow | null>(null);
  const [activeFilters, setActiveFilters] = useState<FilterItem[]>([]);
  const [filterLogic, setFilterLogic] = useState<"AND" | "OR">("AND"); void(setFilterLogic);

  // R for reloading the page
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if((e.key === 'r' || e.key === 'R') && !(e.target instanceof HTMLInputElement)) {
        window.location.reload();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
    }
  }, []);

  // Parse the CSV data
  useEffect(() => {
    try {
      const result = Papa.parse<CreativeRow>(csvText, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true, // Automatically convert numeric values
      });
      setTableData(result.data);
      setFilteredData(result.data);
    } catch (err: any) {
      setError(err.message || "Parsing error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Apply filters when they change
  useEffect(() => {
    if (tableData.length === 0 || activeFilters.length === 0) {
      setFilteredData(tableData);
      return;
    }

    const filtered = tableData.filter(row => {
      // Group filters by category
      const filtersByCategory = activeFilters.reduce((acc, filter) => {
        const key = filter.category.name;
        if (!acc[key]) acc[key] = [];
        acc[key].push(filter);
        return acc;
      }, {} as Record<string, FilterItem[]>);

      // Apply filters for each category (AND between categories)
      return Object.values(filtersByCategory).every(categoryFilters => {
        // For filters of the same category, use OR logic
        return categoryFilters.some(filter => {
          const rowValue = row[filter.category.name];
          const filterValue = filter.value;
          
          if (filter.isNumeric) {
            const numRowValue = Number(rowValue);
            const numFilterValue = Number(filterValue);
            
            switch (filter.operator) {
              case "equals":
                return numRowValue === numFilterValue;
              case "lesser than":
                return numRowValue < numFilterValue;
              case "greater than":
                return numRowValue > numFilterValue;
              case "is":
                return numRowValue === numFilterValue;
              case "is not":
                return numRowValue !== numFilterValue;
              default:
                return true;
            }
          } else {
            // String comparison
            const strRowValue = String(rowValue).toLowerCase();
            const strFilterValue = String(filterValue).toLowerCase();
            
            switch (filter.operator) {
              case "equals":
                return strRowValue === strFilterValue;
              case "contains":
                return strRowValue.includes(strFilterValue);
              case "does not contain":
                return !strRowValue.includes(strFilterValue);
              case "is":
                return strRowValue === strFilterValue;
              case "is not":
                return strRowValue !== strFilterValue;
              default:
                return true;
            }
          }
        });
      });
    });

    setFilteredData(filtered);
  }, [tableData, activeFilters, filterLogic]);

  const handleFiltersChange = (filters: FilterItem[]) => {
    setActiveFilters(filters);
  };

  return (
    <div className="min-h-screen bg-white relative">
      {/* Header */}
      <header className="px-4 md:px-12 lg:px-24 py-6 flex items-center space-x-3">
        <img src={logo} alt="Segwise Logo" className="h-10 w-auto" />
        <div className="flex flex-col leading-tight">
          <span className="text-xl font-semibold text-gray-700">
            Segwise
          </span>
          <span className="text-sm text-gray-500">
            Front End Test
          </span>
        </div>
      </header>

      {/* Filters */}
      <div className="px-4 md:px-12 lg:px-24">
        <div className="border-2 border-dashed border-gray-300 rounded-md py-6">
          <FilterBar onFiltersChange={handleFiltersChange} />
        </div>
      </div>

      {/* DataTable */}
      <div className="px-4 md:px-12 lg:px-24 mt-8">
        {loading && <p className="text-gray-600">Loading data…</p>}
        {error && (
          <p className="text-red-500">Error loading data: {error}</p>
        )}
        {!loading && !error && (
          <>
            <div className="mb-4 text-sm text-gray-600">
              {filteredData.length === tableData.length 
                ? `Showing all ${tableData.length} rows`
                : `Showing ${filteredData.length} of ${tableData.length} rows`}
            </div>
            <DataTable data={filteredData} onRowClick={setPreviewRow} />
          </>
        )}
      </div>

      {/* Row Preview */}
      {previewRow && (
        <div className="fixed bottom-6 right-6 w-[320px] max-h-[60vh] bg-white shadow-xl border rounded-xl p-4 overflow-auto z-50">
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
                <span className="font-medium capitalize">{key.replace(/_/g, " ")}:</span>
                <span className="ml-2 text-right">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-10 px-4 md:px-12 lg:px-24">
        <h2 className="font-semibold text-md text-gray-800 mb-2">
          Instructions
        </h2>
        <p className="text-gray-600">
          Click{" "}
          <kbd className="px-2 py-1 border rounded bg-gray-100">
            R
          </kbd>{" "}
          to restart prototype
        </p>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;