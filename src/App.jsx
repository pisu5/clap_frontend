import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";
import Home from "./Home";
import AdminExport from "./AdminExport";

export default function App() {
  return (

    <Routes>
      {/* Default route */}
      <Route path="/" element={<Navigate to="/home" />} />
      <Route path="/admin" element={<AdminExport />} />

      {/* Login route */}
      <Route path="/login" element={<Login />} />
      <Route path="/home" element={<Home />} />
    </Routes>
  );
}
