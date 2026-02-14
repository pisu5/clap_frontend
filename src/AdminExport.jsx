import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "./api";

export default function AdminExport() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [usersFile, setUsersFile] = useState(null);
  const [mobilesFile, setMobilesFile] = useState(null);

  // 🔒 Admin-only protection
  if (role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-6 rounded-xl shadow text-red-600 font-semibold">
          Access denied
        </div>
      </div>
    );
  }

  // --------------------------
  // DOWNLOAD REPORT
  // --------------------------
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
      setMessage("Failed to download report.");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------
  // UPLOAD USERS SHEET
  // --------------------------
  const uploadUsers = async () => {
    if (!usersFile) {
      setMessage("Please select a users sheet first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", usersFile);

    setLoading(true);
    setMessage("");

    try {
      const res = await api.post("/upload-users-excel", formData);
      setMessage(`Users uploaded successfully. Inserted: ${res.data.inserted}`);
      setUsersFile(null);
    } catch (err) {
      setMessage(err.response?.data?.detail || "Users upload failed.");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------
  // UPLOAD MOBILE SHEET
  // --------------------------
  const uploadMobiles = async () => {
    if (!mobilesFile) {
      setMessage("Please select a mobile sheet first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", mobilesFile);

    setLoading(true);
    setMessage("");

    try {
      const res = await api.post("/upload-mobiles-excel", formData);
      setMessage(`Mobiles uploaded successfully. Inserted: ${res.data.inserted}`);
      setMobilesFile(null);
    } catch (err) {
      setMessage(err.response?.data?.detail || "Mobiles upload failed.");
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
          Manage system data
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 space-y-6">

          {/* DOWNLOAD REPORT */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-800">
              📥 Export Survey Report
            </h2>
            <button
              onClick={downloadExcel}
              disabled={loading}
              className={`w-full py-3 rounded-xl font-semibold text-white ${loading
                ? "bg-green-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
                }`}
            >
              {loading ? "Preparing..." : "Download Excel"}
            </button>
          </div>

          {/* UPLOAD USERS */}
          <div className="space-y-3 border-t pt-5">
            <h2 className="text-lg font-bold text-slate-800">
              👥 Upload Users Sheet
            </h2>

            <input
              type="file"
              accept=".xlsx"
              onChange={(e) => setUsersFile(e.target.files[0])}
              className="w-full text-sm"
            />

            <button
              onClick={uploadUsers}
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold bg-blue-600 text-white hover:bg-blue-700"
            >
              Upload Users
            </button>
          </div>

          {/* UPLOAD MOBILES */}
          <div className="space-y-3 border-t pt-5">
            <h2 className="text-lg font-bold text-slate-800">
              📱 Upload Client Mobiles Sheet
            </h2>

            <input
              type="file"
              accept=".xlsx"
              onChange={(e) => setMobilesFile(e.target.files[0])}
              className="w-full text-sm"
            />

            <button
              onClick={uploadMobiles}
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Upload Mobiles
            </button>
          </div>

          {/* MESSAGE */}
          {message && (
            <div className="text-center text-sm font-semibold text-slate-600">
              {message}
            </div>
          )}

          {/* LOGOUT */}
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
