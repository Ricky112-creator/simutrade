import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { EnvelopeSimple, Lock, User, GoogleLogo, Eye, EyeSlash } from "@phosphor-icons/react";
import { useAuth } from "../contexts/AuthContext";
import api from "../utils/api";

function formatError(detail) {
  if (!detail) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((e) => (e?.msg || JSON.stringify(e))).join(", ");
  return String(detail);
}

export default function AuthPage() {
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleGoogle = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint = tab === "login" ? "/auth/login" : "/auth/register";
      const payload = tab === "login"
        ? { email: form.email, password: form.password }
        : { email: form.email, password: form.password, name: form.name };
      const res = await api.post(endpoint, payload);
      const { user, token } = res.data;
      login(user, token);
      navigate(user.onboarding_complete ? "/dashboard" : "/onboarding");
    } catch (err) {
      setError(formatError(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex font-manrope">
      {/* Left decorative panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{
          backgroundImage: `url('https://images.pexels.com/photos/26447275/pexels-photo-26447275.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-[#1A2421]/80" />
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-[#C05746] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold font-outfit">S</span>
            </div>
            <span className="font-outfit text-2xl font-semibold text-white">SimuTrade</span>
          </Link>
        </div>
        <div className="relative z-10">
          <h2 className="font-outfit text-4xl font-semibold text-white mb-4 leading-tight">
            Learn volatility trading.<br />
            <span className="text-[#C05746]">Zero risk.</span>
          </h2>
          <p className="text-[#7A8C83] leading-relaxed mb-8 text-base">
            Join thousands of learners mastering the VIX, OVX, and GVZ with $10,000 in virtual currency.
          </p>
          <div className="flex gap-6">
            {[["$10K", "Starting Balance"], ["7", "Indices"], ["Free", "Forever"]].map(([v, l]) => (
              <div key={l}>
                <p className="font-mono text-2xl font-semibold text-white">{v}</p>
                <p className="text-xs text-[#7A8C83]">{l}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 border border-[#C05746]/30 rounded-xl p-4 bg-[#C05746]/10">
          <p className="text-xs text-[#C05746] font-medium">
            SIMULATION ONLY — Virtual currency. No real financial transactions.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-[#C05746] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm font-outfit">S</span>
            </div>
            <span className="font-outfit text-xl font-semibold text-[#1A2421]">SimuTrade</span>
          </Link>

          <h1 className="font-outfit text-3xl font-semibold text-[#1A2421] mb-2">
            {tab === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-[#4A5D54] mb-8 text-sm">
            {tab === "login" ? "Sign in to your SimuTrade account." : "Start your free trading simulation today."}
          </p>

          {/* Tab switcher */}
          <div className="flex bg-[#EAE7E0] rounded-xl p-1 mb-8">
            {["login", "register"].map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(""); }}
                data-testid={`auth-tab-${t}`}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  tab === t ? "bg-white text-[#1A2421] shadow-sm" : "text-[#7A8C83] hover:text-[#4A5D54]"
                }`}
              >
                {t === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          {/* Google OAuth */}
          <button
            onClick={handleGoogle}
            data-testid="google-auth-btn"
            className="w-full flex items-center justify-center gap-3 border border-[#D1CDC3] bg-white rounded-xl py-3 text-sm font-medium text-[#1A2421] hover:border-[#2C4C3B] hover:shadow-sm transition-all duration-200 mb-4"
          >
            <GoogleLogo size={20} weight="bold" />
            Continue with Google
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-[#D1CDC3]" />
            <span className="text-xs text-[#7A8C83]">or continue with email</span>
            <div className="flex-1 h-px bg-[#D1CDC3]" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {tab === "register" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <label className="block text-xs font-medium text-[#4A5D54] mb-1.5 uppercase tracking-wider">
                    Full Name
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A8C83]" />
                    <input
                      type="text"
                      value={form.name}
                      onChange={update("name")}
                      placeholder="Alex Johnson"
                      required={tab === "register"}
                      data-testid="register-name-input"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#D1CDC3] bg-white text-[#1A2421] text-sm focus:outline-none focus:border-[#2C4C3B] focus:ring-1 focus:ring-[#2C4C3B] placeholder:text-[#7A8C83]"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-xs font-medium text-[#4A5D54] mb-1.5 uppercase tracking-wider">
                Email
              </label>
              <div className="relative">
                <EnvelopeSimple size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A8C83]" />
                <input
                  type="email"
                  value={form.email}
                  onChange={update("email")}
                  placeholder="you@example.com"
                  required
                  data-testid="auth-email-input"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#D1CDC3] bg-white text-[#1A2421] text-sm focus:outline-none focus:border-[#2C4C3B] focus:ring-1 focus:ring-[#2C4C3B] placeholder:text-[#7A8C83]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4A5D54] mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A8C83]" />
                <input
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={update("password")}
                  placeholder="Min. 8 characters"
                  required
                  minLength={6}
                  data-testid="auth-password-input"
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-[#D1CDC3] bg-white text-[#1A2421] text-sm focus:outline-none focus:border-[#2C4C3B] focus:ring-1 focus:ring-[#2C4C3B] placeholder:text-[#7A8C83]"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7A8C83] hover:text-[#4A5D54]"
                >
                  {showPw ? <EyeSlash size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div data-testid="auth-error" className="bg-[#C05746]/10 border border-[#C05746]/20 rounded-xl p-3 text-sm text-[#C05746]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              data-testid="auth-submit-btn"
              className="w-full bg-[#2C4C3B] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#1E362A] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Please wait..." : tab === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <p className="text-center text-xs text-[#7A8C83] mt-6">
            By continuing, you agree to our{" "}
            <Link to="/terms" className="text-[#4A5D54] hover:text-[#1A2421] underline">Terms of Service</Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-[#4A5D54] hover:text-[#1A2421] underline">Privacy Policy</Link>.
          </p>
          <p className="text-center text-xs text-[#C05746] mt-3 bg-[#C05746]/5 rounded-lg py-2 px-3">
            This is a simulation platform. No real money is used.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
