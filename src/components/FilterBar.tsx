import React, { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import csvText from "../data/creatives.csv?raw";
import { ChevronDown, ChevronRight, Funnel, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Tab = "Dimensions" | "Tags" | "Metrics";
type ComparisonOperator =
  | "equals"
  | "lesser than"
  | "greater than"
  | "contains"
  | "does not contain"
  | "is"
  | "is not";

interface ColDef {
  name: string;
  type: Tab;
}

export interface FilterItem {
  category: ColDef;
  operator: ComparisonOperator;
  value: string | string[];
  isNumeric: boolean;
}

interface FilterBarProps {
  onFiltersChange: (filters: FilterItem[], logic: "AND" | "OR") => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ onFiltersChange }) => {
  const [cols, setCols] = useState<ColDef[]>([]);
  const [data, setData] = useState<Record<string, any>[]>([]);

  useEffect(() => {
    const { data: rows, meta } = Papa.parse<Record<string, any>>(csvText, {
      header: true,
      skipEmptyLines: true,
    });
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
    const fields = meta.fields || [];
    const defs = fields.map((h) => {
      const key = h.trim().toLowerCase();
      if (key.includes("tag")) return { name: h, type: "Tags" as Tab };
      if (metricKeys.includes(key)) return { name: h, type: "Metrics" as Tab };
      return { name: h, type: "Dimensions" as Tab };
    });
    setCols(defs);
    setData(rows);
  }, []);

  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<FilterItem[]>([]);
  const [logic, setLogic] = useState<"AND" | "OR">("AND");

  const [tab, setTab] = useState<Tab>("Tags");
  const [searchCol, setSearchCol] = useState("");
  const [col, setCol] = useState<ColDef | null>(null);

  const [op, setOp] = useState<ComparisonOperator>("is");
  const [opOpen, setOpOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [numVal, setNumVal] = useState("");
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  const countLabel = pending.length.toString().padStart(2, "0");

  const [vals, setVals] = useState<string[]>([]);

  const satisfiesFilter = (row: Record<string, any>, filter: FilterItem): boolean => {
    const columnValue = row[filter.category.name];
    if (filter.isNumeric) {
      const numColumnValue = Number(columnValue);
      const numFilterValue = Number(filter.value);
      switch (filter.operator) {
        case "equals":
          return numColumnValue === numFilterValue;
        case "lesser than":
          return numColumnValue < numFilterValue;
        case "greater than":
          return numColumnValue > numFilterValue;
        default:
          return false;
      }
    } else {
      const strColumnValue = String(columnValue);
      if (Array.isArray(filter.value)) {
        if (filter.operator === "is") {
          return filter.value.some(v => strColumnValue === v);
        } else if (filter.operator === "is not") {
          return !filter.value.some(v => strColumnValue === v);
        } else {
          return false;
        }
      } else {
        const strFilterValue = String(filter.value);
        switch (filter.operator) {
          case "is":
            return strColumnValue === strFilterValue;
          case "is not":
            return strColumnValue !== strFilterValue;
          case "contains":
            return strColumnValue.includes(strFilterValue);
          case "does not contain":
            return !strColumnValue.includes(strFilterValue);
          default:
            return false;
        }
      }
    }
  };

  useEffect(() => {
    if (!col) return;

    let filteredData = data;
    if (pending.length > 0) {
      filteredData = logic === "AND"
        ? data.filter(row => pending.every(filter => satisfiesFilter(row, filter)))
        : data.filter(row => pending.some(filter => satisfiesFilter(row, filter)));
    }

    const all = filteredData
      .map((r) => r[col.name])
      .filter((v) => v != null)
      .map(String);
    setVals(Array.from(new Set(all)).sort());

    setOp(col.type === "Metrics" ? "equals" : "is");
    setSearchVal("");
    setNumVal("");
    setSelectedValues([]);
  }, [col, data, pending, logic]);

  useEffect(() => {
    if (col && col.type !== "Metrics" && selectedValues.length > 1 && !["is", "is not"].includes(op)) {
      setOp("is");
    }
  }, [selectedValues, col, op]);

  const isNumericField = (c: ColDef) => {
    if (c.type === "Metrics") return true;
    if (c.name.toLowerCase().endsWith("id")) return true;
    const sample = data.slice(0, 10).map((r) => r[c.name]).filter((v) => v != null);
    return sample.length > 0 && sample.every((v) => !isNaN(+v));
  };

  const handleSave = () => {
    if (!col) return;

    const numeric = isNumericField(col!);
    if (numeric) {
      if (!numVal) return;
      setPending((p) => [
        ...p,
        { category: col!, operator: op, value: numVal, isNumeric: true },
      ]);
    } else {
      if (selectedValues.length === 0) return;
      setPending((p) => [
        ...p,
        {
          category: col!,
          operator: op,
          value: selectedValues,
          isNumeric: false,
        },
      ]);
    }

    setCol(null);
    setTab("Tags");
  };

  const filteredCols = useMemo(
    () =>
      cols
        .filter((c) => c.type === tab)
        .filter((c) => c.name.toLowerCase().includes(searchCol.toLowerCase())),
    [cols, tab, searchCol]
  );

  const renderValuesStep = () => {
    if (!col) return null;

    if (isNumericField(col)) {
      return (
        <input
          type="number"
          value={numVal}
          onChange={(e) => setNumVal(e.target.value)}
          placeholder="Enter value"
          className="w-1/2 border rounded-md px-3 py-1.5 text-sm"
        />
      );
    } else {
      return (
        <>
          <input
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search values"
            className="w-full pl-8 pr-3 py-1.5 border rounded-md text-sm"
          />
          <div className="flex items-center px-3 py-2">
            <input
              type="checkbox"
              checked={selectedValues.length === vals.length}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedValues(vals);
                } else {
                  setSelectedValues([]);
                }
              }}
              className="rounded border-gray-300"
            />
            <span className="ml-2 text-sm font-medium">Select all</span>
          </div>
          <ul className="max-h-40 overflow-auto space-y-1 border rounded-md">
            {vals
              .filter((v) =>
                v.toLowerCase().includes(searchVal.toLowerCase())
              )
              .map((v) => (
                <li
                  key={v}
                  onClick={() =>
                    setSelectedValues((prev) =>
                      prev.includes(v)
                        ? prev.filter((x) => x !== v)
                        : [...prev, v]
                    )
                  }
                  className={`flex items-center px-3 py-2 rounded-md text-sm cursor-pointer ${
                    selectedValues.includes(v)
                      ? "bg-green-50 text-green-700"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(v)}
                    readOnly
                    className="rounded border-gray-300"
                  />
                  <span className="ml-2">{v}</span>
                </li>
              ))}
          </ul>
        </>
      );
    }
  };

  const availableOperators = col
    ? col.type === "Metrics"
      ? ["equals", "lesser than", "greater than"]
      : selectedValues.length > 1
        ? ["is", "is not"]
        : ["is", "is not", "contains", "does not contain"]
    : [];

  return (
    <div className="w-full bg-gray-100 rounded-xl px-4 py-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 bg-white border rounded-xl px-4 py-2 text-sm font-medium shadow hover:bg-gray-100"
      >
        <Funnel className="w-4 h-4" />
        <span>Filters</span>
        <Badge className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-semibold">
          {countLabel}
        </Badge>
        <ChevronDown className="w-4 h-4" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-20 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute z-20 mt-2 w-full sm:w-[28rem] bg-white rounded-xl shadow-xl border">
            <div className="flex justify-between items-center px-4 py-2 border-b">
              <h3 className="font-medium text-gray-700">Add Filters</h3>
              <button
                onClick={() => {
                  onFiltersChange(pending, logic);
                  setOpen(false);
                }}
                className="text-green-600 text-sm font-semibold hover:underline"
              >
                Apply All
              </button>
            </div>

            <div className="p-4 space-y-2">
              {pending.map((r, i) => (
                <div
                  key={i}
                  className="bg-green-50 border border-green-100 text-green-800 px-3 py-2 rounded-md flex justify-between text-sm"
                >
                  <div>
                    <span className="font-medium">{r.category.name}</span>{" "}
                    {r.operator}{" "}
                    <em className="font-semibold">
                      {Array.isArray(r.value) ? r.value.join(", ") : r.value}
                    </em>
                  </div>
                  <button
                    onClick={() =>
                      setPending((p) => p.filter((_, idx) => idx !== i))
                    }
                  >
                    <Trash2 className="w-4 h-4 hover:text-red-600" />
                  </button>
                </div>
              ))}
              {pending.length >= 2 && (
                <div className="flex justify-center space-x-2 py-2">
                  {(["AND", "OR"] as const).map((L) => (
                    <button
                      key={L}
                      onClick={() => setLogic(L)}
                      className={`px-3 py-1 text-xs rounded-md ${
                        logic === L
                          ? "bg-gray-100 text-gray-800 font-semibold"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {L}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!col ? (
              <>
                <div className="grid grid-cols-3 border-b">
                  {(["Dimensions", "Tags", "Metrics"] as Tab[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setTab(t);
                        setSearchCol("");
                      }}
                      className={`py-2 text-sm ${
                        tab === t
                          ? "text-gray-800 font-semibold border-b-2 border-green-500"
                          : "text-gray-500"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="p-4 space-y-2">
                  <div className="relative">
                    <input
                      value={searchCol}
                      onChange={(e) => setSearchCol(e.target.value)}
                      placeholder="Search"
                      className="w-full pl-8 pr-3 py-1.5 border rounded-md text-sm"
                    />
                    <Search className="absolute left-2 top-1.5 w-4 h-4 text-gray-400" />
                  </div>
                  <ul className="max-h-40 overflow-auto space-y-1">
                    {filteredCols.map((c) => (
                      <li
                        key={c.name}
                        onClick={() => setCol(c)}
                        className="flex justify-between items-center px-3 py-2 hover:bg-green-50 rounded-md cursor-pointer text-sm"
                      >
                        {c.name}
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <div className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2 text-sm font-medium">
                    <span>{col.type}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold">{col.name}</span>
                  </div>
                  <button
                    className="text-xs text-gray-500"
                    onClick={() => setCol(null)}
                  >
                    ← Back
                  </button>
                </div>

                <div className="relative w-1/2">
                  <button
                    onClick={() => setOpOpen((o) => !o)}
                    className="w-full flex justify-between items-center border rounded-md px-3 py-1.5 text-sm"
                  >
                    <span className="capitalize">{op}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                  {opOpen && (
                    <ul className="absolute left-0 right-0 z-30 mt-1 bg-white border rounded-md shadow-lg">
                      {availableOperators.map((o) => (
                        <li
                          key={o}
                          onClick={() => {
                            setOp(o as ComparisonOperator);
                            setOpOpen(false);
                          }}
                          className="px-3 py-1.5 hover:bg-gray-100 cursor-pointer capitalize text-sm"
                        >
                          {o}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {renderValuesStep()}

                <button
                  onClick={handleSave}
                  disabled={
                    isNumericField(col!) ? !numVal : selectedValues.length === 0
                  }
                  className={`w-full py-2 rounded-md text-sm font-medium ${
                    isNumericField(col!)
                      ? numVal
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : selectedValues.length
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