import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import { ArrowLeft, TrendingUp, BarChart, PieChart } from "lucide-react";
import logo from "../assets/logo.svg";
import { Link } from "react-router-dom";
import { CreativeRow } from "./Home";
import Papa from "papaparse";
import csvText from "../data/creatives.csv?raw";

interface RowData {
  [key: string]: string | number | boolean | null;
  id: number;
}

const RowDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [rowData, setRowData] = useState<RowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Parse CSV and find the specific row
    try {
      const res = Papa.parse<CreativeRow>(csvText, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        transformHeader: (h) => h.trim(),
      });
      
      const data = res.data.map((row, index) => {
        const cleaned: RowData = { id: index };
        Object.entries(row).forEach(([k, v]) => {
          const key = k.trim();
          cleaned[key] = typeof v === "string" ? v.trim() : v;
        });
        return cleaned;
      });
      
      const foundRow = data.find(row => row.id === Number(id));
      if (foundRow) {
        setRowData(foundRow);
      } else {
        setError("Row not found");
      }
    } catch (err: any) {
      setError(err.message || "Error loading data");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleBack = () => {
    navigate(-1);
  };

  // Separate numeric fields and text fields
  const numericFields = rowData ? 
    Object.entries(rowData)
      .filter(([key, value]) => typeof value === 'number' && !isNaN(value as number) && key !== 'id')
      .map(([key]) => key) 
    : [];
    
  const textFields = rowData ? 
    Object.entries(rowData)
      .filter(([key, value]) => typeof value === 'string' || key === 'id')
      .map(([key]) => key) 
    : [];

  // Find the highest value among numeric fields for highlighting
  const highestValueField = rowData && numericFields.length > 0 ? 
    numericFields.reduce((highest, field) => {
      if (!rowData || !highest) return field;
      const currentVal = rowData[field] as number;
      const highestVal = rowData[highest] as number;
      return (currentVal > highestVal ? field : highest);
    }, numericFields[0]) 
    : null;

  const renderMetricCard = (field: string, index: number) => {
    if (!rowData) return null;
    
    const isHighest = field === highestValueField;
    const cardColors = [
      'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200',
      'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200',
      'bg-gradient-to-br from-green-50 to-green-100 border-green-200',
      'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200',
      'bg-gradient-to-br from-red-50 to-red-100 border-red-200',
      'bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200',
    ];
    
    const textColors = [
      'text-blue-700',
      'text-purple-700',
      'text-green-700',
      'text-amber-700',
      'text-red-700',
      'text-indigo-700',
    ];
    
    const bgColor = cardColors[index % cardColors.length];
    const textColor = textColors[index % textColors.length];
    
    const value = rowData[field] as number;
    const formattedValue = value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value;

    return (
      <div 
        key={field} 
        className={`${bgColor} rounded-xl p-6 border shadow-md transform transition-all duration-300 hover:scale-105 ${isHighest ? 'ring-2 ring-blue-400' : ''}`}
      >
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-gray-800 capitalize mb-1">
            {field.replace(/_/g, " ")}
          </h3>
          {isHighest && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              Top
            </span>
          )}
        </div>
        <div className={`text-3xl font-bold ${textColor} mt-2`}>
          {formattedValue}
        </div>
      </div>
    );
  };

  const renderDetailItem = (key: string, value: string | number | boolean | null) => {
    return (
      <div key={key} className="border-b border-gray-100 py-3 flex flex-col md:flex-row md:justify-between">
        <span className="font-medium text-gray-700 capitalize mb-1 md:mb-0 md:w-1/3">
          {key.replace(/_/g, " ")}
        </span>
        <div className="text-gray-600 break-words md:w-2/3">
          {String(value)}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 md:px-8 lg:px-12 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center">
              <img src={logo} alt="Segwise Logo" className="h-13 w-auto cursor-pointer" />
              <div className="flex flex-col ml-3 leading-tight">
                <span className="text-lg font-semibold text-gray-800">Segwise</span>
                <span className="text-2xl text-gray-500">Front End Test</span>
              </div>
            </Link>
          </div>

          <button 
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-blue-600 transition-colors bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span>Back</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="px-4 md:px-8 lg:px-12 py-6">
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-pulse flex flex-col items-center">
              <div className="rounded-full bg-blue-100 h-12 w-12 mb-4"></div>
              <div className="h-4 bg-blue-100 rounded w-24 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <div className="text-red-500 mb-4 text-lg">{error}</div>
            <button 
              onClick={handleBack}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              Return Home
            </button>
          </div>
        )}

        {rowData && (
          <>
            {/* Title section */}
            <div className="mb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                  Row #{id} Details
                </h1>
              </div>
            </div>
            
            {/* Tabs */}
            <div className="mb-6 bg-white rounded-lg p-1 shadow-sm border border-gray-200 inline-flex">
              <button 
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'overview' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100 cursor-pointer'}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button 
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'details' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100 cursor-pointer'}`}
                onClick={() => setActiveTab('details')}
              >
                All Details
              </button>
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Key metrics */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <div className="flex items-center mb-4">
                    <BarChart className="w-5 h-5 mr-2 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-800">Key Metrics</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {numericFields.slice(0, 8).map((field, index) => renderMetricCard(field, index))}
                  </div>
                </div>
                
                {/* Summary section */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <div className="flex items-center mb-4">
                    <PieChart className="w-5 h-5 mr-2 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-800">Row Summary</h2>
                  </div>
                  
                  <div className="space-y-2">
                    {textFields.slice(0, 5).map(field => 
                      rowData[field] !== undefined && renderDetailItem(field, rowData[field])
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'details' && (
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                  <span className="bg-blue-100 text-blue-800 w-8 h-8 rounded-full flex items-center justify-center mr-2">
                    {id}
                  </span>
                  Complete Details
                </h2>
                
                <div className="space-y-1">
                  {Object.entries(rowData)
                    .filter(([key]) => key !== 'id')
                    .map(([key, value]) => renderDetailItem(key, value))
                  }
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default RowDetail;