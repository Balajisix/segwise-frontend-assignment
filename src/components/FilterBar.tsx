import React, { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import csvText from "../data/creatives.csv?raw";
import {
  Funnel,
  ChevronDown,
  Search as SearchIcon,
  Trash2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Tab = "Dimensions" | "Tags" | "Metrics";
interface ColDef { name: string; type: Tab; }
export interface FilterItem {
  category: ColDef;
  operator: string;
  value: string | string[];
  isNumeric: boolean;
}
interface Props {
  onFiltersChange: (filters: FilterItem[], logic: "AND" | "OR") => void;
  onFilterOpenChange?: (isOpen: boolean) => void; // New prop
}

export const FilterBar: React.FC<Props> = ({ onFiltersChange, onFilterOpenChange }) => {
  // These are states for UI
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [activeTab, setActiveTab] = useState<Tab>("Tags");
  const [pending, setPending] = useState<FilterItem[]>([]);
  const [logic, setLogic] = useState<"AND" | "OR">("AND");

  // This is for Data and schema
  const [cols, setCols] = useState<ColDef[]>([]);
  const [rows, setRows] = useState<Record<string, any>[]>([]);

  const [searchCol, setSearchCol] = useState("");
  const [selectedCol, setSelectedCol] = useState<ColDef | null>(null);

  const [searchVal, setSearchVal] = useState("");
  const [operator, setOperator] = useState<string>("");
  const [radioVal, setRadioVal] = useState(""); // For tags (single selection)
  const [multiVals, setMultiVals] = useState<string[]>([]); // For dimensions (multi-select)
  const [textVal, setTextVal] = useState(""); // For dimensions (contains/does not contain)
  const [numVal, setNumVal] = useState(""); // For metrics
  const [valueOptions, setValueOptions] = useState<string[]>([]);

  useEffect(() => {
    if (onFilterOpenChange) {
      onFilterOpenChange(open);
    }
  }, [open, onFilterOpenChange]);

  // Operators
  const availableOperators = useMemo(() => {
    if (selectedCol?.type === "Metrics") {
      return ["equals", "greater than", "lesser than"];
    } else if (selectedCol?.type === "Dimensions") {
      return ["is", "is not", "contains", "does not contain"];
    } else {
      return ["is"]; // Tags use "is" for radio selection
    }
  }, [selectedCol]);

  // It helps to load CSV
  useEffect(() => {
    const parsed = Papa.parse<Record<string, any>>(csvText, {
      header: true,
      skipEmptyLines: true,
    });
    setRows(parsed.data);

    const metricKeys = [
      "ipm", "ctr", "spend", "impressions", "clicks",
      "cpm", "cost_per_click", "cost_per_install", "installs"
    ];
    const defs: ColDef[] = (parsed.meta.fields || []).map((h) => {
      const key = h.trim().toLowerCase();
      if (metricKeys.includes(key)) return { name: h, type: "Metrics" };
      if (key.includes("tag")) return { name: h, type: "Tags" };
      return { name: h, type: "Dimensions" };
    });
    setCols(defs);
  }, []);

  // Filtered Columns
  const filteredCols = useMemo(
    () =>
      cols
        .filter((c) => c.type === activeTab)
        .filter((c) => c.name.toLowerCase().includes(searchCol.toLowerCase())),
    [cols, activeTab, searchCol]
  );

  // Set Value Options and Operator for Step 2
  useEffect(() => {
    if (step === 2 && selectedCol) {
      const opts = Array.from(
        new Set(
          rows
            .map((r) => r[selectedCol.name])
            .filter((v) => v != null)
            .map(String)
        )
      ).sort();
      setValueOptions(opts);
      setOperator(availableOperators[0]);
      setSearchVal("");
      setRadioVal("");
      setMultiVals([]);
      setTextVal("");
      setNumVal("");
    }
  }, [step, selectedCol, rows, availableOperators]);

  // Handle Adding a Filter
  const handleAddFilter = () => {
    if (!selectedCol) return;
    const isNum = selectedCol.type === "Metrics";
    const val: string | string[] = isNum
      ? numVal
      : selectedCol.type === "Tags"
        ? radioVal
        : (operator === "is" || operator === "is not")
          ? multiVals
          : textVal;

    setPending((p) => [
      ...p,
      { category: selectedCol, operator, value: val, isNumeric: isNum },
    ]);

    if (selectedCol.type === "Tags") {
      setActiveTab("Dimensions");
      const creativeCol = cols.find((c) => c.name.toLowerCase() === "creative_name");
      if (creativeCol) {
        setSelectedCol(creativeCol);
        setStep(2);
        return;
      }
    }

    setStep(1);
    setSelectedCol(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (open && !target.closest('.filter-dropdown') && !target.closest('.filter-trigger')) {
        setOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  // Apply filters and close
  const applyFilters = () => {
    onFiltersChange(pending, logic);
    setOpen(false);
  };

  return (
    <div className="w-full max-w-screen-xl mx-auto bg-gray-100 rounded-lg p-3 sm:p-4 relative">
      {/* Trigger Button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="filter-trigger flex items-center gap-2 bg-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg shadow hover:bg-lime-50 cursor-pointer text-sm sm:text-base"
      >
        <Funnel className="w-4 h-4" />
        <span>Filters</span>
        <Badge className="bg-lime-300">{String(pending.length).padStart(2, "0")}</Badge>
        <ChevronDown className="w-4 h-4" />
      </button>

      {open && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 bg-black bg-opacity-20 z-10 md:hidden"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="filter-dropdown absolute z-20 mt-2 w-[calc(100%-2rem)] left-4 right-4 sm:w-96 md:w-80 bg-white rounded-xl shadow-lg border max-h-[80vh] overflow-auto">
            {/* Header */}
            <div className="sticky top-0 z-10 border-b px-3 py-2 sm:px-4 bg-white flex justify-between items-center">
              <button
                className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1 bg-green-50 border border-green-200 rounded-full text-green-700 font-medium text-xs sm:text-sm hover:bg-green-100"
                onClick={applyFilters}
              >
                <span className="mr-1 font-bold text-lg">+</span>
                Add Filter
              </button>
              
              <button 
                className="p-1 hover:bg-gray-100 rounded-full"
                onClick={() => setOpen(false)}
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Pending Filters */}
            {pending.length > 0 && (
              <div className="p-3 space-y-2 border-b">
                {pending.map((f, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center bg-green-50 px-2 py-1.5 sm:px-3 sm:py-2 rounded text-xs sm:text-sm"
                  >
                    <div className="flex-1 mr-2 truncate">
                      <strong className="truncate inline-block max-w-full">{f.category.name}</strong>{" "}
                      <span className="whitespace-nowrap">{f.operator}{" "}</span>
                      <em className="truncate inline-block max-w-full">
                        {Array.isArray(f.value) ? 
                          (f.value.length > 2 ? 
                            `${f.value[0]}, ${f.value[1]}, +${f.value.length - 2} more` : 
                            f.value.join(", ")) : 
                          f.value}
                      </em>
                    </div>
                    <button
                      onClick={() => setPending((p) => p.filter((_, idx) => idx !== i))}
                      className="flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 hover:text-red-600" />
                    </button>
                  </div>
                ))}

                {pending.length > 1 && (
                  <div className="flex justify-center gap-2">
                    {(["AND", "OR"] as const).map((L) => (
                      <button
                        key={L}
                        onClick={() => setLogic(L)}
                        className={`px-3 py-1 text-xs rounded ${
                          logic === L
                            ? "bg-gray-200 text-gray-800 font-semibold"
                            : "text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {L}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Category Selection */}
            {step === 1 && (
              <>
                <div className="grid grid-cols-3 text-center border-b cursor-pointer">
                  {(["Dimensions", "Tags", "Metrics"] as Tab[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setActiveTab(t);
                        setSearchCol("");
                      }}
                      className={`py-2 text-xs sm:text-sm ${
                        activeTab === t
                          ? "font-semibold border-b-2 border-green-500 text-gray-800"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="p-3 space-y-2">
                  <div className="relative w-full border rounded focus-within:ring-2 focus-within:ring-lime-400">
                    <SearchIcon className="absolute left-2 top-2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      className="w-full pl-8 pr-3 py-1.5 bg-transparent text-sm focus:outline-none"
                      placeholder="Search"
                      value={searchCol}
                      onChange={(e) => setSearchCol(e.target.value)}
                    />
                  </div>
                  <ul className="max-h-40 sm:max-h-60 overflow-auto space-y-1">
                    {filteredCols.length > 0 ? (
                      filteredCols.map((c) => (
                        <li
                          key={c.name}
                          onClick={() => {
                            setSelectedCol(c);
                            setStep(2);
                          }}
                          className="flex justify-between px-3 py-2 hover:bg-green-50 rounded cursor-pointer text-xs sm:text-sm"
                        >
                          <span className="truncate mr-2">{c.name}</span>
                          <ChevronDown className="w-4 h-4 text-gray-400 rotate-270 flex-shrink-0" />
                        </li>
                      ))
                    ) : (
                      <li className="px-3 py-4 text-center text-gray-500 text-xs sm:text-sm">
                        No {activeTab.toLowerCase()} found
                      </li>
                    )}
                  </ul>
                </div>
              </>
            )}

            {/* Value Selection */}
            {step === 2 && selectedCol && (
              <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                <div className="flex justify-between items-center">
                  <button
                    className="text-xs sm:text-sm text-gray-500 hover:underline"
                    onClick={() => {
                      setStep(1);
                      setSelectedCol(null);
                    }}
                  >
                    ← Back
                  </button>
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-700 truncate max-w-[70%]">
                    {selectedCol.name}
                  </h4>
                </div>

                {/* Operator Dropdown */}
                <select
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  className="w-full border rounded px-3 py-1.5 text-xs sm:text-sm focus:bg-lime-50"
                >
                  {availableOperators.map((op) => (
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ))}
                </select>

                {/* Tags */}
                {selectedCol.type === "Tags" && (
                  <>
                    <div className="relative">
                      <SearchIcon className="absolute left-2 top-2 w-4 h-4 text-gray-400" />
                      <input
                        className="w-full pl-8 pr-3 py-1.5 border rounded text-xs sm:text-sm focus:bg-yellow-50"
                        placeholder="Search"
                        value={searchVal}
                        onChange={(e) => setSearchVal(e.target.value)}
                      />
                    </div>
                    <div className="max-h-36 sm:max-h-48 overflow-auto space-y-1 border rounded p-2">
                      {valueOptions
                        .filter((v) => v.toLowerCase().includes(searchVal.toLowerCase()))
                        .length > 0 ? (
                          valueOptions
                            .filter((v) => v.toLowerCase().includes(searchVal.toLowerCase()))
                            .map((v) => (
                              <label
                                key={v}
                                className={`flex items-center px-2 py-1 rounded cursor-pointer text-xs sm:text-sm ${
                                  radioVal === v ? "bg-green-50 text-green-700" : "hover:bg-gray-50"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="tagRadio"
                                  className="mr-2"
                                  checked={radioVal === v}
                                  onChange={() => setRadioVal(v)}
                                />
                                <span className="truncate">{v}</span>
                              </label>
                            ))
                        ) : (
                          <div className="text-center py-3 text-gray-500 text-xs sm:text-sm">
                            No options match your search
                          </div>
                        )}
                    </div>
                  </>
                )}

                {/* Dimensions */}
                {selectedCol.type === "Dimensions" && (
                  operator === "is" || operator === "is not" ? (
                    <>
                      <div className="relative w-full border rounded focus-within:ring-2 focus-within:ring-lime-400">
                        <SearchIcon className="absolute left-2 top-2 w-4 h-4 text-gray-400" />
                        <input
                          className="w-full pl-8 pr-3 py-1.5 bg-transparent text-sm focus:outline-none"
                          placeholder="Search"
                          value={searchVal}
                          onChange={(e) => setSearchVal(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={multiVals.length === valueOptions.length}
                          onChange={(e) =>
                            setMultiVals(e.target.checked ? valueOptions : [])
                          }
                        />
                        <span className="text-xs sm:text-sm">Select all</span>
                      </div>
                      <div className="max-h-36 sm:max-h-48 overflow-auto space-y-1 border rounded p-2">
                        {valueOptions
                          .filter((v) => v.toLowerCase().includes(searchVal.toLowerCase()))
                          .length > 0 ? (
                            valueOptions
                              .filter((v) => v.toLowerCase().includes(searchVal.toLowerCase()))
                              .map((v) => (
                                <label
                                  key={v}
                                  className={`flex items-center px-2 py-1 rounded cursor-pointer text-xs sm:text-sm ${
                                    multiVals.includes(v)
                                      ? "bg-green-50 text-green-700"
                                      : "hover:bg-gray-50"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    className="mr-2"
                                    checked={multiVals.includes(v)}
                                    onChange={() =>
                                      setMultiVals((m) =>
                                        m.includes(v)
                                          ? m.filter((x) => x !== v)
                                          : [...m, v]
                                      )
                                    }
                                  />
                                  <span className="truncate">{v}</span>
                                </label>
                              ))
                          ) : (
                            <div className="text-center py-3 text-gray-500 text-xs sm:text-sm">
                              No options match your search
                            </div>
                          )}
                      </div>
                    </>
                  ) : (
                    <div className="w-full border rounded focus-within:ring-2 focus-within:ring-lime-400 mt-4">
                      <input
                        type="text"
                        className="w-full bg-transparent px-3 py-1.5 text-xs sm:text-sm focus:outline-none"
                        placeholder="Enter text"
                        value={textVal}
                        onChange={(e) => setTextVal(e.target.value)}
                      />
                    </div>
                  )
                )}

                {/* Metrics */}
                {selectedCol.type === "Metrics" && (
                  <div className="w-full border rounded 
                  focus-within:ring-2 focus-within:ring-lime-400">
                    <input
                      type="number"
                      className="w-full bg-transparent px-3 py-1.5 text-xs sm:text-sm focus:outline-none"
                      placeholder="Enter value"
                      value={numVal}
                      onChange={(e) => setNumVal(e.target.value)}
                    />
                  </div>
                )}

                {/* Apply Button */}
                <button
                  onClick={handleAddFilter}
                  disabled={
                    selectedCol.type === "Metrics"
                      ? numVal === ""
                      : selectedCol.type === "Tags"
                      ? radioVal === ""
                      : (operator === "is" || operator === "is not")
                      ? multiVals.length === 0
                      : textVal === ""
                  }
                  className={`w-full py-2 rounded text-xs sm:text-sm font-medium ${
                    (selectedCol.type === "Metrics"
                      ? numVal
                      : selectedCol.type === "Tags"
                      ? radioVal
                      : (operator === "is" || operator === "is not")
                      ? multiVals.length > 0
                      : textVal)
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};