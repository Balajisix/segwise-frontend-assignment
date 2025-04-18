// src/components/FilterBar.tsx
import React, { useState, useEffect, useMemo } from "react";
import Papa from "papaparse";
import csvText from "../data/creatives.csv?raw";
import { ChevronDown, Trash2, Filter as FilterIcon } from "lucide-react";

type Tab = "Dimensions" | "Tags" | "Metrics";
interface ColDef { name: string; type: Tab; }

export const FilterBar: React.FC = () => {
  const [cols, setCols] = useState<ColDef[]>([]);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("Dimensions");
  const [search, setSearch] = useState("");

  // parse CSV from the imported string
  useEffect(() => {
    const result = Papa.parse<Record<string, any>>(csvText, {
      header: true,
      skipEmptyLines: true
    });
    const headers = result.meta.fields || [];

    const metricKeys = [
      "ipm","ctr","spend","impressions","clicks",
      "cpm","cost_per_click","cost_per_install","installs"
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
  }, []);

  const tabs: Tab[] = ["Dimensions", "Tags", "Metrics"];
  const visible = useMemo(
    () =>
      cols
        .filter((c) => c.type === activeTab)
        .filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    [cols, activeTab, search]
  );

  return (
    <div className="relative inline-block text-left w-full md:w-auto">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 bg-white shadow-md rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:shadow-lg transition"
      >
        <FilterIcon className="w-4 h-4 text-gray-600" />
        Filters
        <span className="bg-lime-300 text-gray-800 font-bold text-xs px-2 py-0.5 rounded-full">
          {visible.length}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-600" />
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-[24rem] bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Tabs */}
          <div className="grid grid-cols-3 border-b">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setActiveTab(t);
                  setSearch("");
                }}
                className={`py-2 text-sm ${
                  activeTab === t
                    ? "text-gray-800 font-semibold"
                    : "text-gray-500"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Search + List */}
          <div className="p-4 space-y-2">
            <input
              type="text"
              placeholder="Search"
              className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-lime-300"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <ul className="max-h-40 overflow-auto">
              {visible.map((col) => (
                <li
                  key={col.name}
                  className="flex justify-between items-center px-3 py-2 hover:bg-gray-50 rounded-md cursor-pointer text-sm text-gray-700"
                >
                  {col.name}
                  <Trash2 className="w-4 h-4 text-gray-300 hover:text-red-500 transition" />
                </li>
              ))}
              {visible.length === 0 && (
                <li className="px-3 py-2 text-sm text-gray-400">
                  No fields found.
                </li>
              )}
            </ul>
          </div>

          <button className="w-full bg-gray-800 text-white py-2 text-sm font-medium hover:bg-gray-900 transition">
            Apply
          </button>
        </div>
      )}
    </div>
  );
};
