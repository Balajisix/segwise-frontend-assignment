import { FilterBar } from "../components/FilterBar";
import Footer from "../components/Footer";
import logo from "../assets/segwise-logo.png";

const Home = () => {
  return (
    <div className="min-h-screen bg-white relative">
      {/* Header */}
      <header className="px-4 md:px-12 lg:px-24 py-6 flex items-center space-x-3">
        <img src={logo} alt="Segwise Logo" className="h-13 w-auto" />
        <div className="flex flex-col leading-tight">
          <span className="text-xl font-semibold text-gray-700">Segwise</span>
          <span className="text-2xl text-gray-500">Front End Test</span>
        </div>
      </header>

      {/* Filters Section */}
      <div className="px-4 md:px-12 lg:px-24">
        <div className="border-2 border-dashed border-gray-300 rounded-md py-6">
          <FilterBar />
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-10 px-4 md:px-12 lg:px-24">
        <h2 className="font-semibold text-md text-gray-800 mb-2">Instructions</h2>
        <p className="text-gray-600">
          Click{" "}
          <kbd className="px-2 py-1 border rounded bg-gray-100">R</kbd> to
          restart prototype
        </p>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
