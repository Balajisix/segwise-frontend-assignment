import React, { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import csvText from "../data/creatives.csv?raw";
import {
  ChevronDown,
  Trash2,
  Filter as FilterIcon,
  ChevronRight,
} from "lucide-react";

type Tab = "Dimensions" | "Tags" | "Metrics";
interface ColDef {
  name: string;
  type: Tab;
}
interface FilterItem {
  category: ColDef;
  value: string;
}

export const FilterBar: React.FC = () => {
  const [cols, setCols] = useState<ColDef[]>([]);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("Dimensions");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ColDef | null>(null);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<FilterItem[]>([]);
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [uniqueValues, setUniqueValues] = useState<string[]>([]);

  useEffect(() => {
    const result = Papa.parse<Record<string, any>>(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    const parsedData = result.data as Record<string, any>[];
    const headers = result.meta.fields || [];

    const metricKeys = [
      "ipm",
      "ctr",
      "spend",
      "impressions",
      "clicks",
      "cpm",
      "cost_per_click",
      "cost_per_install",
      "installs",
    ];

    const mapped: ColDef[] = headers.map((h) => {
      const key = h.trim().toLowerCase();
      let tab: Tab;

      if (key.includes("tag")) {
        tab = "Tags";
      } else if (metricKeys.includes(key)) {
        tab = "Metrics";
      } else {
        tab = "Dimensions";
      }

      return { name: h, type: tab };
    });

    setCols(mapped);
    setData(parsedData);
  }, []);

  const filteredCols = useMemo(
    () =>
      cols
        .filter((c) => c.type === activeTab)
        .filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    [cols, activeTab, search]
  );

  // When a category is selected, find its unique values from the data
  useEffect(() => {
    if (selectedCategory) {
      const values = data
        .map((row) => row[selectedCategory.name])
        .filter(Boolean)
        .map(String);

      const unique = Array.from(new Set(values));
      setUniqueValues(unique);
    }
  }, [selectedCategory, data]);

  const handleApply = () => {
    if (selectedCategory && selectedValues.length > 0) {
      const newFilters = selectedValues.map((val) => ({
        category: selectedCategory,
        value: val,
      }));
      setAppliedFilters((prev) => [...prev, ...newFilters]);
      setSelectedCategory(null);
      setSelectedValues([]);
      setSearch("");
    }
  };

  const handleRemoveFilter = (index: number) => {
    setAppliedFilters((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="relative inline-block w-full md:w-auto text-left">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 bg-white shadow-md rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:shadow-lg transition"
      >
        <FilterIcon className="w-4 h-4 text-gray-600" />
        Filters
        <span className="bg-lime-300 text-gray-800 font-bold text-xs px-2 py-0.5 rounded-full">
          {appliedFilters.length}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-600" />
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-[28rem] bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Step 1: Select Category */}
          {!selectedCategory && (
            <>
              <div className="grid grid-cols-3 border-b">
                {["Dimensions", "Tags", "Metrics"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab as Tab);
                      setSearch("");
                    }}
                    className={`py-2 text-sm ${
                      activeTab === tab
                        ? "text-gray-800 font-semibold border-b-2 border-lime-400"
                        : "text-gray-500"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="p-4 space-y-2">
                <input
                  type="text"
                  placeholder="Search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-lime-300"
                />
                <ul className="max-h-40 overflow-auto space-y-1">
                  {filteredCols.map((col) => (
                    <li
                      key={col.name}
                      onClick={() => setSelectedCategory(col)}
                      className="flex justify-between items-center px-3 py-2 hover:bg-gray-100 rounded-md cursor-pointer text-sm text-gray-700"
                    >
                      {col.name}
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {/* Step 2: Select Value */}
          {selectedCategory && (
            <div className="p-4 space-y-2">
              <div className="text-sm font-medium text-gray-700">
                {selectedCategory.name}
              </div>
              <ul className="max-h-40 overflow-auto space-y-1">
                {uniqueValues.map((val) => (
                  <li
                    key={val}
                    onClick={() =>
                      setSelectedValues((prev) =>
                        prev.includes(val)
                          ? prev.filter((v) => v !== val)
                          : [...prev, val]
                      )
                    }
                    className={`px-3 py-2 rounded-md text-sm cursor-pointer flex items-center justify-between ${
                      selectedValues.includes(val)
                        ? "bg-lime-100 text-gray-800 font-medium"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    {val}
                    {selectedValues.includes(val) && (
                      <span className="text-xs text-lime-600 font-semibold">
                        ✓
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setSelectedValues([]);
                  }}
                  className="w-1/2 bg-gray-200 text-gray-800 py-2 text-sm rounded-md hover:bg-gray-300 transition"
                >
                  Back
                </button>
                <button
                  onClick={handleApply}
                  className="w-1/2 bg-gray-800 text-white py-2 text-sm font-medium hover:bg-gray-900 rounded-md transition"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Applied Filters */}
      {appliedFilters.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {appliedFilters.map((filter, index) => (
            <div
              key={index}
              className="bg-lime-100 text-gray-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
            >
              {filter.category.name}: {filter.value}
              <button
                onClick={() => handleRemoveFilter(index)}
                className="hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
