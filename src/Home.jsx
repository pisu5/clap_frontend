import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "./api";

const PRESET_REASONS = [
  "Farmer denied survey",
  "Farmer not available",
  "Wrong number",
  "Call not reachable",
  "Farmer asked to call later",
  "Other"
];

export default function Home() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const surveyorId = localStorage.getItem("user_id");

  const [mobileQuery, setMobileQuery] = useState("");
  const [mobileOptions, setMobileOptions] = useState([]);
  const [selectedMobile, setSelectedMobile] = useState("");

  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [evidence, setEvidence] = useState(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", isError: false });

  // ✅ Fix 1: Guard clause using useEffect to prevent "Maximum update depth" error
  useEffect(() => {
    if (!surveyorId || role !== "SURVEYOR") {
      navigate("/login");
    }
  }, [role, surveyorId, navigate]);

  // ✅ Fix 2: Mobile search optimization
  useEffect(() => {
    if (mobileQuery.length < 3 || mobileQuery === selectedMobile) {
      setMobileOptions([]);
      return;
    }

    const fetchMobiles = async () => {
      try {
        const res = await api.get(`/search-mobile?q=${mobileQuery}`);
        setMobileOptions(res.data);
      } catch (err) {
        console.error("Search failed", err);
      }
    };

    const delayDebounceFn = setTimeout(() => fetchMobiles(), 300);
    return () => clearTimeout(delayDebounceFn);
  }, [mobileQuery, selectedMobile]);

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const submitAttempt = async () => {
    if (!selectedMobile || !reason) {
      setMessage({ text: "Please select mobile and reason", isError: true });
      return;
    }

    const finalReason = reason === "Other" ? customReason : reason;
    if (reason === "Other" && !customReason.trim()) {
      setMessage({ text: "Please enter custom reason", isError: true });
      return;
    }

    setLoading(true);
    setMessage({ text: "Submitting...", isError: false });

    try {
      // Step 1: Submit text details
      const res = await api.post("/submit-attempt", {
        mobile_number: selectedMobile,
        outcome: "ATTEMPTED",
        remarks: finalReason,
        surveyor_id: surveyorId
      });

      const attemptId = res.data.attempt_id;

      // ✅ Fix 3: Proper FormData for File Upload (Fixes 422 error)
      if (evidence && attemptId) {
        const fd = new FormData();
        fd.append("attempt_id", String(attemptId)); // Ensure it's a string
        fd.append("file", evidence);

        await api.post("/upload-evidence", fd, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }

      setMessage({ text: "✅ Submitted successfully!", isError: false });

      // Reset Form
      setMobileQuery("");
      setSelectedMobile("");
      setReason("");
      setCustomReason("");
      setEvidence(null);
      
    } catch (err) {
      const errorDetail = err.response?.data?.detail || "Submission failed";
      setMessage({ text: `❌ ${errorDetail}`, isError: true });
    } finally {
      setLoading(false);
    }
  };

  if (role !== "SURVEYOR") return null;

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-sans max-w-md mx-auto">
      {/* Header */}
      <div className="bg-blue-600 text-white rounded-2xl p-6 shadow-lg mb-6">
        <h1 className="text-xl font-bold italic tracking-tight italic">CLAP SURVEY</h1>
        <div className="flex justify-between items-end mt-4">
          <p className="text-sm opacity-90">Surveyor: {surveyorId}</p>
          <button onClick={logout} className="text-xs font-bold bg-blue-700 px-3 py-1 rounded-full uppercase">Logout</button>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6">
        {/* Mobile Input */}
        <div className="relative">
          <label className="text-xs font-bold text-slate-500 uppercase ml-1">Farmer Mobile</label>
          <input
            className="w-full mt-1 px-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all text-lg font-medium"
            placeholder="Search 10-digit number"
            value={mobileQuery}
            onChange={(e) => setMobileQuery(e.target.value)}
          />
          {mobileOptions.length > 0 && (
            <div className="absolute z-10 w-full bg-white border border-slate-100 shadow-xl rounded-2xl mt-2 overflow-hidden">
              {mobileOptions.map((m) => (
                <button
                  key={m}
                  className="w-full text-left px-5 py-4 hover:bg-blue-50 border-b border-slate-50 last:border-none font-medium"
                  onClick={() => {
                    setSelectedMobile(m);
                    setMobileQuery(m);
                    setMobileOptions([]);
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reason Dropdown */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase ml-1">Reason</label>
          <select
            className="w-full mt-1 px-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            <option value="">Choose a reason...</option>
            {PRESET_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {reason === "Other" && (
          <input
            className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500"
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            placeholder="Type your reason here..."
          />
        )}

        {/* File Upload */}
        <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 text-center">
          <input
            type="file"
            id="file-upload"
            hidden
            onChange={(e) => setEvidence(e.target.files[0])}
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <span className="text-sm font-bold text-blue-600">
              {evidence ? `📎 ${evidence.name}` : "📸 Add Photo Evidence"}
            </span>
          </label>
        </div>

        {/* Status Message */}
        {message.text && (
          <div className={`p-4 rounded-xl text-sm font-bold text-center ${message.isError ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
            {message.text}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={submitAttempt}
          disabled={loading}
          className={`w-full py-5 rounded-2xl font-black text-lg uppercase tracking-widest shadow-lg shadow-blue-100 transition-all active:scale-95 ${
            loading ? "bg-slate-300" : "bg-blue-600 text-white"
          }`}
        >
          {loading ? "Please Wait..." : "Submit Entry"}
        </button>
      </div>
    </div>
  );
}