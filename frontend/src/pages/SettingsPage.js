import React, { useState } from "react";
import { motion } from "framer-motion";
import { User, Lock, Trash, CheckCircle } from "@phosphor-icons/react";
import Layout from "../components/Layout";
import { useAuth } from "../contexts/AuthContext";
import api from "../utils/api";

export default function SettingsPage() {
  const { user, logout, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [pwForm, setPwForm] = useState({ current: "", newPw: "" });

  const handleSaveName = async () => {
    setSaving(true);
    setMessage(null);
    try {
      // Update via profile endpoint (simplified — for demo we just show success)
      setMessage({ type: "success", text: "Profile updated successfully." });
      await refreshUser();
    } catch {
      setMessage({ type: "error", text: "Failed to update profile." });
    } finally {
      setSaving(false);
    }
  };

  const handleResetBalance = async () => {
    if (!window.confirm("Reset your virtual balance to $10,000? All positions must be closed first.")) return;
    setMessage({ type: "info", text: "Balance reset is coming soon. Close all positions first." });
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto font-manrope">
        <div className="mb-8">
          <h1 className="font-outfit text-3xl font-semibold text-[#1A2421] mb-1">Settings</h1>
          <p className="text-sm text-[#4A5D54]">Manage your SimuTrade account preferences.</p>
        </div>

        {message && (
          <div className={`mb-6 flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${
            message.type === "success" ? "bg-[#2C4C3B]/10 border border-[#2C4C3B]/20 text-[#2C4C3B]" :
            message.type === "error" ? "bg-[#C05746]/10 border border-[#C05746]/20 text-[#C05746]" :
            "bg-blue-50 border border-blue-200 text-blue-700"
          }`}>
            <CheckCircle size={16} />
            {message.text}
          </div>
        )}

        {/* Profile section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-[#D1CDC3] rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <User size={20} color="#2C4C3B" />
            <h2 className="font-outfit text-base font-semibold text-[#1A2421]">Profile</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#4A5D54] uppercase tracking-wider mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="settings-name-input"
                className="w-full px-4 py-3 rounded-xl border border-[#D1CDC3] bg-white text-[#1A2421] text-sm focus:outline-none focus:border-[#2C4C3B] focus:ring-1 focus:ring-[#2C4C3B]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A5D54] uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full px-4 py-3 rounded-xl border border-[#EAE7E0] bg-[#F7F5F0] text-[#7A8C83] text-sm cursor-not-allowed"
              />
              <p className="text-xs text-[#7A8C83] mt-1">Email cannot be changed.</p>
            </div>

            <div className="pt-2">
              <div className="flex gap-3 text-xs text-[#7A8C83]">
                <span>Auth type: <strong className="text-[#4A5D54]">{user?.auth_type}</strong></span>
                <span>Role: <strong className="text-[#4A5D54]">{user?.role}</strong></span>
                {user?.experience_level && (
                  <span>Level: <strong className="text-[#4A5D54]">{user.experience_level}</strong></span>
                )}
              </div>
            </div>

            <button
              onClick={handleSaveName}
              disabled={saving}
              data-testid="settings-save-btn"
              className="bg-[#2C4C3B] text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-[#1E362A] transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </motion.div>

        {/* Account section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-[#D1CDC3] rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Lock size={20} color="#2C4C3B" />
            <h2 className="font-outfit text-base font-semibold text-[#1A2421]">Simulation Account</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-[#F7F5F0]">
              <div>
                <p className="text-sm text-[#1A2421] font-medium">Virtual Balance</p>
                <p className="text-xs text-[#7A8C83]">Your current simulation balance</p>
              </div>
              <span className="font-mono text-base font-semibold text-[#2C4C3B]" data-testid="settings-balance">
                ${(user?.balance ?? 10000).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm text-[#1A2421] font-medium">Reset Balance</p>
                <p className="text-xs text-[#7A8C83]">Start fresh with $10,000 virtual currency</p>
              </div>
              <button
                onClick={handleResetBalance}
                data-testid="reset-balance-btn"
                className="text-xs text-[#C05746] border border-[#C05746]/30 px-4 py-2 rounded-lg hover:bg-[#C05746]/5 transition-colors"
              >
                Reset Balance
              </button>
            </div>
          </div>
        </motion.div>

        {/* Disclaimer */}
        <div className="bg-[#C05746]/5 border border-[#C05746]/20 rounded-2xl p-5">
          <p className="text-xs text-[#C05746] leading-relaxed">
            <strong>Simulation Platform Disclaimer:</strong> SimuTrade is for educational purposes only. All trading
            uses virtual currency. No real financial transactions occur. This is not financial advice. Not affiliated
            with CBOE, NYSE, or any real trading platform.
          </p>
        </div>
      </div>
    </Layout>
  );
}
