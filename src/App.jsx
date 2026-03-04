import { BrowserRouter, Routes, Route } from "react-router-dom";
import PhishingStudy from "./PhishingStudy";
import Dashboard from "./Dashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PhishingStudy />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
