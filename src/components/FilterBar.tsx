import React, { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import csvText from "../data/creatives.csv?raw";
import {
  ChevronDown,
  ChevronRight,
  Funnel,
  Search,
  Trash2,
} from "lucide-react";
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
  value: string;
  operator: ComparisonOperator;
  isNumeric: boolean;
}

interface FilterBarProps {
  onFiltersChange: (filters: FilterItem[], logic: "AND" | "OR") => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ onFiltersChange }) => {
  // It loads CSV
  const [cols, setCols] = useState<ColDef[]>([]);
  const [data, setData] = useState<Record<string, any>[]>([]);
  useEffect(() => {
    const { data: rows, meta } = Papa.parse<Record<string, any>>(csvText, {
      header: true,
      skipEmptyLines: true,
    });
    const metricKeys = [
      "ipm","ctr","spend","impressions","clicks",
      "cpm","cost_per_click","cost_per_install","installs"
    ];
    setCols(
      (meta.fields || []).map(h => {
        const key = h.trim().toLowerCase();
        if (key.includes("tag")) return { name: h, type: "Tags" };
        if (metricKeys.includes(key)) return { name: h, type: "Metrics" };
        return { name: h, type: "Dimensions" };
      })
    );
    setData(rows as any);
  }, []);

  // AND OR Logic
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<FilterItem[]>([]);
  const [logic, setLogic] = useState<"AND"|"OR">("AND");

  const [step, setStep] = useState<1|2|3>(1);
  const [tab, setTab] = useState<Tab>("Dimensions");
  const [search, setSearch] = useState("");
  const [col, setCol] = useState<ColDef|null>(null);
  const [vals, setVals] = useState<string[]>([]);
  const [sel, setSel] = useState<string[]>([]);
  const [single, setSingle] = useState(false);

  // numeric branch
  const [numOp, setNumOp] = useState<ComparisonOperator>("equals");
  const [numVal, setNumVal] = useState("");
  const [opOpen, setOpOpen] = useState(false);

  // string‑only branch
  const [strOp, setStrOp] = useState<ComparisonOperator>("is");

  const countLabel = pending.length.toString().padStart(2, "0");

  // filterable columns
  const filteredCols = useMemo(
    () => cols
      .filter(c => c.type === tab)
      .filter(c => c.name.toLowerCase().includes(search.toLowerCase())),
    [cols, tab, search]
  );

  // when you pick a column, load its values
  useEffect(() => {
    if (!col) return;
    const out = data
      .map(r => r[col.name])
      .filter(v => v != null)
      .map(String);
    setVals(Array.from(new Set(out)).sort());
  }, [col, data]);

  // detect numeric OR “ID” columns
  const isNumericField = (c: ColDef) => {
    if (c.name.toLowerCase().endsWith("id")) return true;
    const sample = data
      .slice(0,10)
      .map(r => r[c.name])
      .filter(v => v != null);
    return sample.length>0 && sample.every(v => !isNaN(+v));
  };

  // queue one filter
  const saveOne = () => {
    if (!col) return;
    const numeric = col.type==="Metrics" || isNumericField(col);
    if (numeric) {
      if (!numVal) return;
      setPending(p=>[
        ...p,
        { category: col, operator: numOp, value: numVal, isNumeric: true }
      ]);
    } else {
      if (sel.length===0) return;
      setPending(p=>[
        ...p,
        ...sel.map(v=>({
          category: col,
          operator: strOp,
          value: v,
          isNumeric: false
        }))
      ]);
    }
    // reset
    setStep(1); setCol(null); setSel([]); setNumVal(""); setSearch("");
  };

  const Step1 = () => (
    <>
      <div className="grid grid-cols-3 border-b">
        {(["Dimensions","Tags","Metrics"] as Tab[]).map(t=>(
          <button
            key={t}
            onClick={()=>{ setTab(t); setSearch(""); }}
            className={`py-2 text-sm ${
              tab===t
                ? "text-gray-800 font-semibold border-b-2 border-green-500"
                : "text-gray-500"
            }`}
          >{t}</button>
        ))}
      </div>
      <div className="p-4 space-y-2">
        <div className="relative">
          <input
            value={search}
            onChange={e=>setSearch(e.target.value)}
            placeholder="Search"
            className="w-full pl-8 pr-3 py-1.5 border rounded-md text-sm focus:ring-2 focus:ring-green-300"
          />
          <Search className="absolute left-2 top-1.5 w-4 h-4 text-gray-400"/>
        </div>
        <ul className="max-h-40 overflow-auto space-y-1">
          {filteredCols.map(c=>(
            <li
              key={c.name}
              onClick={()=>{
                setCol(c);
                setSingle(c.type!=="Metrics");
                setStep(2);
              }}
              className="flex justify-between items-center px-3 py-2 hover:bg-green-50 rounded-md cursor-pointer text-sm"
            >
              {c.name}
              <ChevronRight className="w-4 h-4 text-gray-400"/>
            </li>
          ))}
        </ul>
      </div>
    </>
  );

  const Step2 = () => {
    const numeric = col!.type==="Metrics" || isNumericField(col!);
    if (numeric) {
      return (
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">{col!.name}</span>
            <button className="text-xs text-gray-500" onClick={()=>setStep(1)}>← Back</button>
          </div>
          <div className="flex space-x-2">
            <div className="relative w-1/2">
              <button
                onClick={() => setOpOpen((o) => !o)}
                className="w-full flex justify-between items-center border rounded-md px-3 py-1.5 text-sm"
              >
                <span className="capitalize">{numOp}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {opOpen && (
                <ul className="absolute left-0 right-0 z-30 mt-1 bg-white border rounded-md shadow-lg">
                  {["equals", "lesser than", "greater than"].map((o) => (
                    <li
                      key={o}
                      onClick={() => {
                        setNumOp(o as ComparisonOperator);
                        setOpOpen(false);
                      }}
                      className="px-3 py-1.5 hover:bg-gray-100 cursor-pointer capitalize text-sm"
                    >
                      {o.charAt(0).toUpperCase() + o.slice(1)}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <input
              value={numVal}
              onChange={e=>setNumVal(e.target.value)}
              placeholder="Enter value"
              className="w-1/2 border rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-green-300"
            />
          </div>
          <button
            onClick={saveOne}
            disabled={!numVal}
            className={`w-full py-2 rounded-md text-sm font-medium ${
              numVal
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            Apply
          </button>
        </div>
      );
    }

    // non‑numeric path
    return (
      <div className="p-4 space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2 text-sm font-medium">
            <span>{col!.type}</span>
            <ChevronRight className="w-4 h-4 text-gray-400"/>
            <span className="font-semibold">{col!.name}</span>
          </div>
          <button className="text-xs text-gray-500" onClick={()=>setStep(1)}>← Back</button>
        </div>
        <div className="relative">
          <input
            value={search}
            onChange={e=>setSearch(e.target.value)}
            placeholder="Search values"
            className="w-full pl-8 pr-3 py-1.5 border rounded-md text-sm focus:ring-2 focus:ring-green-300"
          />
          <Search className="absolute left-2 top-1.5 w-4 h-4 text-gray-400"/>
        </div>
        <div className="flex justify-between items-center text-xs mb-2">
          <label className="flex items-center space-x-1">
            <input
              type="checkbox"
              checked={sel.length>0 && sel.length===vals.length}
              onChange={()=>
                setSel(v=> v.length===vals.length ? [] : [...vals])
              }
              className="rounded border-gray-300 text-green-600 focus:ring-green-300"
            />
            <span>Select all</span>
          </label>
          <span className="text-gray-500">{sel.length} selected</span>
        </div>
        <ul className="max-h-40 overflow-auto space-y-1">
          {vals.filter(v=>v.toLowerCase().includes(search.toLowerCase()))
            .map(v=>(
              <li
                key={v}
                onClick={()=>{
                  if (single) {
                    setSel([v]);
                    setStep(3);
                  } else {
                    setSel(prev=> prev.includes(v)
                      ? prev.filter(x=>x!==v)
                      : [...prev,v]
                    );
                  }
                }}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm cursor-pointer ${
                  sel.includes(v)
                    ? "bg-green-50 text-green-700"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <input
                  type="checkbox"
                  checked={sel.includes(v)}
                  readOnly
                  className="rounded border-gray-300 text-green-600 focus:ring-green-300"
                />
                <span>{v}</span>
              </li>
            ))
          }
        </ul>
        <button
          onClick={saveOne}
          disabled={sel.length===0}
          className={`w-full py-2 rounded-md text-sm font-medium mt-4 ${
            sel.length>0
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          Add {sel.length>1?"Rules":"Rule"}
        </button>
      </div>
    );
  };

  const Step3 = () => (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Operator</span>
        <button className="text-xs text-gray-500" onClick={()=>setStep(2)}>← Back</button>
      </div>
      <div className="space-y-2">
        {["is","is not","contains","does not contain","equals"].map(o=>(
          <button
            key={o}
            onClick={()=>setStrOp(o as ComparisonOperator)}
            className={`w-full text-left py-2 px-3 text-sm border rounded-md ${
              strOp===o
                ? "bg-green-50 border-green-300 text-green-700"
                : "border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {o.charAt(0).toUpperCase() + o.slice(1)}
          </button>
        ))}
      </div>
      <button
        onClick={saveOne}
        className="w-full bg-green-600 text-white py-2 text-sm font-medium rounded-md hover:bg-green-700 transition"
      >
        Apply
      </button>
    </div>
  );

  return (
    <div className="w-full bg-gray-100 rounded-xl px-4 py-3">
      <div className="inline-block">
        <button
          onClick={() => setOpen((o) => !o)}
          className={`
            flex items-center gap-2
            bg-white border border-gray-200
            rounded-full px-4 py-2
            text-sm font-medium text-gray-700
            shadow-sm hover:bg-gray-100
          `}
        >
          <Funnel className="w-4 h-4 text-gray-500" />
          <span>Filters</span>
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-semibold"
          >
            {countLabel}
          </Badge>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {open && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-20 z-10"
            onClick={()=>setOpen(false)}
          />
          <div className="absolute z-20 mt-2 w-full sm:w-[28rem] bg-white rounded-xl shadow-xl border border-gray-200 overflow-visible">
            <div className="flex justify-between items-center px-4 py-2 border-b">
              <h3 className="font-medium text-gray-700">Add Filters</h3>
              <button
                onClick={()=>{
                  onFiltersChange(pending, logic);
                  setOpen(false);
                }}
                className="text-green-600 text-sm font-semibold hover:underline"
              >
                Apply All
              </button>
            </div>
            <div className="p-4 space-y-2">
              {pending.map((r,i)=>(
                <div
                  key={i}
                  className="bg-green-50 border border-green-100 text-green-800 px-3 py-2 rounded-md flex justify-between text-sm"
                >
                  <div>
                    <span className="font-medium">{r.category.name}</span>{" "}
                    {r.operator} <em className="font-semibold">{r.value}</em>
                  </div>
                  <button onClick={()=>setPending(p=>p.filter((_,idx)=>idx!==i))}>
                    <Trash2 className="w-4 h-4 hover:text-red-600"/>
                  </button>
                </div>
              ))}
              {pending.length>=2 && (
                <div className="flex justify-center space-x-2 py-2">
                  {(["AND","OR"] as const).map(L=>(
                    <button
                      key={L}
                      onClick={()=>setLogic(L)}
                      className={`px-3 py-1 text-xs rounded-md ${
                        logic===L
                          ? "bg-gray-100 text-gray-800 font-semibold"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >{L}</button>
                  ))}
                </div>
              )}
            </div>
            {step===1 && <Step1 />}
            {step===2 && <Step2 />}
            {step===3 && <Step3 />}
          </div>
        </>
      )}
    </div>
  );
};
