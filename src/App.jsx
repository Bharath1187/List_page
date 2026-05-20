import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminDashboard from "./AdminDashboard";
import List_page from "./List_page";
import SummaryReport from "./SummaryReport";
import WasherPage from "./WasherPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/inventory" element={<List_page />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/summary-report" element={<SummaryReport />} />
        <Route path="/washer" element={<WasherPage />} />
      </Routes>
    </Router>
  );
}

export default App;