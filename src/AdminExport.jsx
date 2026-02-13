import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "./api";

export default function AdminExport() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // 🔒 Protect admin-only access
  if (role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-6 rounded-xl shadow text-red-600 font-semibold">
          Access denied
        </div>
      </div>
    );
  }

  const downloadExcel = async () => {
    setLoading(true);
    setMessage("");

    try {
      const res = await api.get("/export-excel", {
        responseType: "blob",
      });

      const blob = new Blob([res.data], {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "survey_attempts_report.xlsx";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      setMessage("Report downloaded successfully.");
    } catch (err) {
      setMessage("Failed to download report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <div className="bg-slate-900 text-white p-4 text-center">
        <h1 className="text-lg font-semibold">Admin Panel</h1>
        <p className="text-xs text-slate-300">
          Export survey reports
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 space-y-6">

          <h2 className="text-xl font-bold text-slate-800 text-center">
            Download Survey Report
          </h2>

          <p className="text-sm text-slate-500 text-center">
            This Excel file contains all survey attempts grouped by mobile number.
          </p>

          <button
            onClick={downloadExcel}
            disabled={loading}
            className={`w-full py-4 rounded-xl font-bold text-white transition-all ${
              loading
                ? "bg-green-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading ? "Preparing Excel..." : "📥 Download Excel"}
          </button>

          {message && (
            <div className="text-center text-sm font-semibold text-slate-600">
              {message}
            </div>
          )}

          <button
            onClick={logout}
            className="w-full py-3 rounded-xl font-semibold bg-red-500 text-white hover:bg-red-600 transition-all"
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-500 p-3">
        Admin access only
      </div>
    </div>
  );
}
