import React, { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import csvText from "../data/creatives.csv?raw";
import {
  ChevronDown,
  ChevronRight,
  X,
  Plus,
  Search,
} from "lucide-react";

type Tab = "Dimensions" | "Tags" | "Metrics";
type ComparisonOperator = "equals" | "lesser than" | "greater than" | "contains" | "does not contain" | "is" | "is not";

interface ColDef {
  name: string;
  type: Tab;
}

export interface FilterItem {
  category: ColDef;
  value: string;
  operator?: ComparisonOperator;
  isNumeric?: boolean;
}

export interface FilterBarProps {
  onFiltersChange?: (filters: FilterItem[]) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ onFiltersChange }) => {
  const [cols, setCols] = useState<ColDef[]>([]);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("Dimensions");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ColDef | null>(null);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<FilterItem[]>([]);
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [uniqueValues, setUniqueValues] = useState<string[]>([]);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [filterValue, setFilterValue] = useState<string>("");
  const [selectedOperator, setSelectedOperator] = useState<ComparisonOperator>("equals");
  const [operatorMenuOpen, setOperatorMenuOpen] = useState(false);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [filterLogic, setFilterLogic] = useState<"AND" | "OR">("AND");

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

  // When filters change, notify parent component
  useEffect(() => {
    onFiltersChange?.(appliedFilters);
  }, [appliedFilters, onFiltersChange]);

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

      const unique = Array.from(new Set(values)).sort();
      setUniqueValues(unique);
    }
  }, [selectedCategory, data]);

  const isNumericField = (category: ColDef): boolean => {
    if (!category) return false;
    // Check if the field is likely numeric based on the first few values
    const values = data
      .slice(0, 10)
      .map((row) => row[category.name])
      .filter(Boolean);
    
    return values.length > 0 && values.every(value => !isNaN(Number(value)));
  };

  const handleApply = () => {
    if (selectedCategory) {
      if (selectedCategory.type === "Metrics" || isNumericField(selectedCategory)) {
        // For metrics, add a single filter with operator and value
        setAppliedFilters((prev) => [
          ...prev,
          {
            category: selectedCategory,
            value: filterValue,
            operator: selectedOperator,
            isNumeric: true,
          },
        ]);
      } else if (selectedValues.length > 0) {
        // For dimensions and tags, add multiple filters based on selected values
        const newFilters = selectedValues.map((val) => ({
          category: selectedCategory,
          value: val,
          operator: "equals" as ComparisonOperator,
          isNumeric: false,
        }));
        setAppliedFilters((prev) => [...prev, ...newFilters]);
      }
    }
    
    // Reset everything
    setSelectedCategory(null);
    setSelectedValues([]);
    setFilterValue("");
    setStep(1);
    setSearch("");
    setOpen(false);
  };

  const handleRemoveFilter = (index: number) => {
    setAppliedFilters((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSelectValue = (value: string) => {
    if (multiSelectMode) {
      setSelectedValues((prev) =>
        prev.includes(value)
          ? prev.filter((v) => v !== value)
          : [...prev, value]
      );
    } else {
      setSelectedValues([value]);
      if (selectedCategory?.type !== "Metrics") {
        setStep(3);
      }
    }
  };

  const handleSelectAll = () => {
    if (selectedValues.length === uniqueValues.length) {
      setSelectedValues([]);
    } else {
      setSelectedValues([...uniqueValues]);
    }
  };

  const renderStepOne = () => (
    <>
      <div className="grid grid-cols-3 border-b">
        {(["Dimensions", "Tags", "Metrics"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setSearch("");
            }}
            className={`py-2 text-sm ${
              activeTab === tab
                ? "text-gray-800 font-semibold border-b-2 border-blue-400"
                : "text-gray-500"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="p-4 space-y-2">
        <div className="relative">
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-300"
          />
          <Search className="absolute left-2 top-1.5 w-4 h-4 text-gray-400" />
        </div>
        <ul className="max-h-40 overflow-auto space-y-1">
          {filteredCols.map((col) => (
            <li
              key={col.name}
              onClick={() => {
                setSelectedCategory(col);
                setStep(2);
                setMultiSelectMode(col.type !== "Metrics");
              }}
              className="flex justify-between items-center px-3 py-2 hover:bg-gray-100 rounded-md cursor-pointer text-sm text-gray-700"
            >
              {col.name}
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </li>
          ))}
        </ul>
      </div>
    </>
  );

  const renderStepTwo = () => {
    const isMetric = selectedCategory?.type === "Metrics" || isNumericField(selectedCategory!);

    if (isMetric) {
      return (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700">
              {selectedCategory?.name}
            </div>
            <button
              onClick={() => {
                setSelectedCategory(null);
                setStep(1);
              }}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              ← Back
            </button>
          </div>
          
          <div className="relative">
            <div className="flex space-x-2">
              {/* Operator dropdown */}
              <div className="relative w-1/2">
                <button
                  onClick={() => setOperatorMenuOpen(!operatorMenuOpen)}
                  className="w-full flex items-center justify-between border border-gray-200 rounded-md px-3 py-1.5 text-sm text-gray-700"
                >
                  <span className="capitalize">{selectedOperator.replace(/([A-Z])/g, ' $1')}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                
                {operatorMenuOpen && (
                  <ul className="absolute z-30 w-full mt-1 bg-white border rounded-md shadow-lg py-1">
                    {["equals", "lesser than", "greater than", "is", "is not"].map((op) => (
                      <li
                        key={op}
                        onClick={() => {
                          setSelectedOperator(op as ComparisonOperator);
                          setOperatorMenuOpen(false);
                        }}
                        className="px-3 py-1.5 text-sm hover:bg-gray-100 cursor-pointer capitalize"
                      >
                        {op}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              {/* Value input */}
              <input
                type="text"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                placeholder="Enter value"
                className="w-1/2 px-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-300"
              />
            </div>
          </div>
          
          <button 
            onClick={handleApply}
            disabled={!filterValue}
            className={`w-full py-2 rounded-md text-sm font-medium transition ${
              filterValue 
                ? "bg-blue-600 text-white hover:bg-blue-700" 
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            Apply Filter
          </button>
        </div>
      );
    }
    
    return (
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-gray-700 flex items-center space-x-2">
            <span>{selectedCategory?.type}</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="font-semibold">{selectedCategory?.name}</span>
          </div>
          <button
            onClick={() => {
              setSelectedCategory(null);
              setStep(1);
            }}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            ← Back
          </button>
        </div>
        
        <div className="relative">
          <input
            type="text"
            placeholder="Search values"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-300"
          />
          <Search className="absolute left-2 top-1.5 w-4 h-4 text-gray-400" />
        </div>
        
        <div className="flex items-center justify-between text-xs mb-2">
          <label className="flex items-center space-x-1 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedValues.length === uniqueValues.length && uniqueValues.length > 0}
              onChange={handleSelectAll}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-300"
            />
            <span>Select all</span>
          </label>
          <span className="text-gray-500">
            {selectedValues.length} selected
          </span>
        </div>
        
        <ul className="max-h-40 overflow-auto space-y-1">
          {uniqueValues
            .filter(val => val.toLowerCase().includes(search.toLowerCase()))
            .map((val) => (
              <li
                key={val}
                onClick={() => handleSelectValue(val)}
                className={`px-3 py-2 rounded-md text-sm cursor-pointer flex items-center ${
                  selectedValues.includes(val)
                    ? "bg-blue-50 text-blue-700"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(val)}
                  onChange={() => {}}
                  className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-300"
                />
                {val}
              </li>
            ))}
        </ul>
        
        <button 
          onClick={handleApply}
          disabled={selectedValues.length === 0}
          className={`w-full py-2 rounded-md text-sm font-medium transition mt-4 ${
            selectedValues.length > 0
              ? "bg-blue-600 text-white hover:bg-blue-700" 
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          Apply Filter{selectedValues.length > 1 ? `s (${selectedValues.length})` : ""}
        </button>
      </div>
    );
  };

  const renderStepThree = () => (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-700">
          Apply filter options
        </div>
        <button
          onClick={() => setStep(2)}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          ← Back
        </button>
      </div>
      
      <div className="space-y-4">
        <div className="text-xs font-medium text-gray-500">Filter options</div>
        <div className="grid grid-cols-2 gap-2">
          {["equals", "contains", "is", "is not", "does not contain"].map((op) => (
            <button
              key={op}
              onClick={() => setSelectedOperator(op as ComparisonOperator)}
              className={`py-2 px-3 text-sm border rounded-md ${
                selectedOperator === op
                  ? "bg-blue-50 border-blue-300 text-blue-700"
                  : "border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {op}
            </button>
          ))}
        </div>
      </div>
      
      <button
        onClick={handleApply}
        className="w-full bg-blue-600 text-white py-2 text-sm font-medium hover:bg-blue-700 rounded-md transition"
      >
        Apply Filters
      </button>
    </div>
  );

  const renderActiveStep = () => {
    switch (step) {
      case 1:
        return renderStepOne();
      case 2:
        return renderStepTwo();
      case 3:
        return renderStepThree();
    }
  };

  return (
    <div className="relative w-full px-4 sm:px-6 md:px-8 lg:px-12">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => {
            setOpen(true);
            setStep(1);
          }}
          className="flex items-center gap-2 bg-white shadow-sm border border-gray-200 rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          <Plus className="w-4 h-4 text-gray-500" />
          Add Filter
        </button>
        
        {appliedFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            {appliedFilters.map((filter, index) => (
              <div
                key={index}
                className="bg-blue-50 border border-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
              >
                <span className="font-medium">{filter.category.name}</span>
                {filter.isNumeric && (
                  <span>{filter.operator}</span>
                )}
                <span>{filter.value}</span>
                <button
                  onClick={() => handleRemoveFilter(index)}
                  className="text-blue-400 hover:text-blue-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            
            {appliedFilters.length > 1 && (
              <div className="flex items-center border border-gray-200 rounded-md p-1 bg-white">
                <button
                  onClick={() => setFilterLogic("AND")}
                  className={`px-2 py-0.5 text-xs rounded ${
                    filterLogic === "AND"
                      ? "bg-gray-100 text-gray-800 font-medium"
                      : "text-gray-500"
                  }`}
                >
                  AND
                </button>
                <button
                  onClick={() => setFilterLogic("OR")}
                  className={`px-2 py-0.5 text-xs rounded ${
                    filterLogic === "OR"
                      ? "bg-gray-100 text-gray-800 font-medium"
                      : "text-gray-500"
                  }`}
                >
                  OR
                </button>
              </div>
            )}
            
            {appliedFilters.length > 0 && (
              <button
                onClick={() => setAppliedFilters([])}
                className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700"
              >
                Clear all
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filter Dialog */}
      {open && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-30 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute z-20 mt-2 w-full sm:w-[28rem] bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <h3 className="font-medium text-gray-700">Add Filter</h3>
              <button 
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {renderActiveStep()}
          </div>
        </>
      )}
    </div>
  );
};