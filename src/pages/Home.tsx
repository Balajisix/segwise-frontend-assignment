import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import { FilterBar }  from "../components/FilterBar";
import DataTable from "../components/DataTable";
import Footer from "../components/Footer";
import logo from "../assets/segwise-logo.png";
import csvText from "../data/creatives.csv?raw";

export interface CreativeRow {
  [key: string]: string | number;
}

const Home: React.FC = () => {
  const [tableData, setTableData] = useState<CreativeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // This will parse the data from the csv file in filterdata component
  useEffect(() => {
    try {
      const result = Papa.parse<CreativeRow>(csvText, {
        header: true,
        skipEmptyLines: true,
      });
      setTableData(result.data);
    } catch (err: any) {
      setError(err.message || "Parsing error");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white relative">
      {/* Header */}
      <header className="px-4 md:px-12 lg:px-24 py-6 flex items-center space-x-3">
        <img src={logo} alt="Segwise Logo" className="h-13 w-auto" />
        <div className="flex flex-col leading-tight">
          <span className="text-xl font-semibold text-gray-700">
            Segwise
          </span>
          <span className="text-2xl text-gray-500">
            Front End Test
          </span>
        </div>
      </header>

      {/* Filters */}
      <div className="px-4 md:px-12 lg:px-24">
        <div className="border-2 border-dashed border-gray-300 rounded-md py-6">
          <FilterBar />
        </div>
      </div>

      {/* DataTable */}
      <div className="px-4 md:px-12 lg:px-24 mt-8">
        {loading && <p className="text-gray-600">Loading data…</p>}
        {error && (
          <p className="text-red-500">Error loading data: {error}</p>
        )}
        {!loading && !error && <DataTable data={tableData} />}
      </div>

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
