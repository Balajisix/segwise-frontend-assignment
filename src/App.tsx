import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import RowDetail from "./pages/RowDetail";

function App() {
  return(
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/row/:id" element={<RowDetail />} />
      </Routes>
    </Router>
  )
}

export default App;