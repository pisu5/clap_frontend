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

    // ✅ State changed to arrays for multiple files
    const [screenshots, setScreenshots] = useState([]);
    const [recordings, setRecordings] = useState([]);

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: "", isError: false });

    useEffect(() => {
        if (!surveyorId || role !== "SURVEYOR") {
            navigate("/login");
        }
    }, [role, surveyorId, navigate]);

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
        const delay = setTimeout(fetchMobiles, 300);
        return () => clearTimeout(delay);
    }, [mobileQuery, selectedMobile]);

    const logout = () => {
        localStorage.clear();
        navigate("/login");
    };

    // Helper to handle multiple file selection
    const handleFileChange = (e, setFiles, currentFiles) => {
        const newFiles = Array.from(e.target.files);
        setFiles([...currentFiles, ...newFiles]);
    };

    // Helper to remove a file from selection
    const removeFile = (index, setFiles, currentFiles) => {
        setFiles(currentFiles.filter((_, i) => i !== index));
    };

    const submitAttempt = async () => {
        if (!selectedMobile || !reason) {
            setMessage({ text: "Please select mobile and reason", isError: true });
            return;
        }

        if (screenshots.length === 0) {
            setMessage({ text: "At least one screenshot is mandatory", isError: true });
            return;
        }

        const finalReason = reason === "Other" ? customReason : reason;
        setLoading(true);
        setMessage({ text: "Submitting...", isError: false });

        try {
            // 1️⃣ Create Attempt
            const res = await api.post("/submit-attempt", {
                mobile_number: selectedMobile,
                outcome: "ATTEMPTED",
                remarks: finalReason,
                surveyor_id: parseInt(surveyorId)
            });

            const attemptId = res.data.attempt_id;

            // 2️⃣ Upload Multiple Screenshots
            for (const file of screenshots) {
                const data = new FormData();
                data.append("attempt_id", attemptId);
                data.append("file", file);
                await api.post("/upload-screenshot", data);
            }

            // 3️⃣ Upload Multiple Call Recordings
            for (const file of recordings) {
                const data = new FormData();
                data.append("attempt_id", attemptId);
                data.append("file", file);
                await api.post("/upload-call-recording", data);
            }

            setMessage({ text: "✅ All entries submitted successfully!", isError: false });

            // Reset
            setSelectedMobile("");
            setMobileQuery("");
            setReason("");
            setCustomReason("");
            setScreenshots([]);
            setRecordings([]);

        } catch (err) {
            const errorDetail = err.response?.data?.detail || "Submission failed";
            setMessage({ text: `❌ ${errorDetail}`, isError: true });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 font-sans max-w-md mx-auto">
            <div className="bg-blue-600 text-white rounded-2xl p-6 shadow-lg mb-6">
                <h1 className="text-xl font-bold tracking-tight">CLAP SURVEY</h1>
                <div className="flex justify-between items-end mt-4">
                    <p className="text-sm opacity-90">ID: {surveyorId}</p>
                    <button onClick={logout} className="text-xs font-bold bg-blue-700 px-3 py-1 rounded-full">LOGOUT</button>
                </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm space-y-6">
                <div className="relative">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Farmer Mobile</label>
                    <input
                        className="w-full mt-1 px-4 py-4 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-blue-500 text-lg"
                        placeholder="Search number"
                        value={mobileQuery}
                        onChange={(e) => setMobileQuery(e.target.value)}
                    />
                    {mobileOptions.length > 0 && (
                        <div className="absolute z-10 w-full bg-white shadow-xl rounded-2xl mt-2 border">
                            {mobileOptions.map((m) => (
                                <button key={m} className="w-full text-left px-5 py-4 hover:bg-blue-50 border-b last:border-0"
                                    onClick={() => { setSelectedMobile(m); setMobileQuery(m); setMobileOptions([]); }}>
                                    {m}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Reason</label>
                    <select className="w-full mt-1 px-4 py-4 bg-slate-50 rounded-2xl" value={reason} onChange={(e) => setReason(e.target.value)}>
                        <option value="">Choose a reason...</option>
                        {PRESET_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>

                {reason === "Other" && (
                    <input className="w-full px-4 py-4 bg-slate-50 rounded-2xl border-2 border-blue-100"
                        value={customReason} onChange={(e) => setCustomReason(e.target.value)} placeholder="Specify reason..." />
                )}

                {/* --- Multiple File Section --- */}
                <div className="space-y-4">
                    {/* Screenshots */}
                    <div>
                        <div className="p-4 border-2 border-dashed border-red-200 rounded-2xl bg-red-50 text-center">
                            <input type="file" hidden id="ss-upload" accept="image/*" multiple onChange={(e) => handleFileChange(e, setScreenshots, screenshots)} />
                            <label htmlFor="ss-upload" className="cursor-pointer text-sm font-bold text-red-600">
                                📸 Add Screenshots (Mandatory)
                            </label>
                        </div>
                        <div className="mt-2 space-y-1">
                            {screenshots.map((f, i) => (
                                <div key={i} className="flex justify-between items-center bg-red-100/50 px-3 py-2 rounded-lg text-xs">
                                    <span className="truncate w-40">{f.name}</span>
                                    <button onClick={() => removeFile(i, setScreenshots, screenshots)} className="text-red-500 font-bold">Remove</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recordings */}
                    <div>
                        <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 text-center">
                            <input type="file" hidden id="call-upload" accept="audio/*" multiple onChange={(e) => handleFileChange(e, setRecordings, recordings)} />
                            <label htmlFor="call-upload" className="cursor-pointer text-sm font-bold text-blue-600">
                                🎧 Add Recordings (Optional)
                            </label>
                        </div>
                        <div className="mt-2 space-y-1">
                            {recordings.map((f, i) => (
                                <div key={i} className="flex justify-between items-center bg-slate-100 px-3 py-2 rounded-lg text-xs">
                                    <span className="truncate w-40">{f.name}</span>
                                    <button onClick={() => removeFile(i, setRecordings, recordings)} className="text-slate-500 font-bold">Remove</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {message.text && (
                    <div className={`p-4 rounded-xl text-sm font-bold text-center ${message.isError ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                        {message.text}
                    </div>
                )}

                <button onClick={submitAttempt} disabled={loading}
                    className={`w-full py-5 rounded-2xl font-black text-lg uppercase ${loading ? "bg-slate-300" : "bg-blue-600 text-white shadow-lg"}`}>
                    {loading ? "Uploading..." : "Submit Entry"}
                </button>
            </div>
        </div>
    );
}