import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "./api";

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState({ text: "", isError: false });
  const [loading, setLoading] = useState(false);

  // ✅ Skip login if already logged in (role-aware)
  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    const role = localStorage.getItem("role");

    if (userId && role) {
      if (role === "ADMIN") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/home", { replace: true });
      }
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();

    if (!username || !password) {
      setMessage({
        text: "Please enter both phone and password",
        isError: true,
      });
      return;
    }

    setLoading(true);
    setMessage({ text: "", isError: false });

    try {
      const res = await api.post("/login", { username, password });

      const { user_id, role } = res.data;

      // Save session
      localStorage.setItem("user_id", user_id);
      localStorage.setItem("role", role);

      setMessage({
        text: "Success! Taking you forward...",
        isError: false,
      });

      // ✅ Role-based redirect (no UI change)
      setTimeout(() => {
        if (role === "ADMIN") {
          navigate("/admin", { replace: true });
        } else {
          navigate("/home", { replace: true });
        }
      }, 800);

    } catch (err) {
      setMessage({
        text: err.response?.data?.detail || "Invalid phone number or password",
        isError: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-10 border border-slate-100 transition-all">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200 mb-4">
            <span className="text-white text-2xl font-bold">C</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome Back
          </h2>
          <p className="text-slate-500 mt-2 font-medium">
            Sign in to manage your account
          </p>
        </div>

        {/* Inputs */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
              Phone Number
            </label>
            <input
              type="text"
              placeholder="e.g. 8269408037"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all duration-200 placeholder:text-slate-300"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all duration-200 placeholder:text-slate-300"
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className={`w-full py-4 rounded-2xl font-bold text-white shadow-xl transform transition-all duration-200 active:scale-[0.97] ${
              loading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 hover:shadow-blue-200"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Verifying...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </div>

        {/* Status Message */}
        {message.text && (
          <div
            className={`mt-6 p-4 rounded-2xl text-center text-sm font-bold animate-in fade-in slide-in-from-top-2 duration-300 ${
              message.isError
                ? "bg-red-50 text-red-600 border border-red-100"
                : "bg-green-50 text-green-600 border border-green-100"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-slate-50 text-center">
          <p className="text-sm text-slate-500">
            Don't have access?{" "}
            <Link
              to="/request-access"
              className="text-blue-600 font-bold hover:text-blue-800 transition-colors"
            >
              Contact Admin
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
