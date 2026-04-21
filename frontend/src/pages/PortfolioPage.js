import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendUp, TrendDown, Clock, CheckCircle, X } from "@phosphor-icons/react";
import Layout from "../components/Layout";
import api from "../utils/api";
import { useAuth } from "../contexts/AuthContext";

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState(null);
  const [positions, setPositions] = useState([]);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("open");
  const [closing, setClosing] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const { refreshUser } = useAuth();

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, posRes, histRes] = await Promise.all([
        api.get("/portfolio/summary"),
        api.get("/trading/positions"),
        api.get("/trading/history"),
      ]);
      setPortfolio(pRes.data);
      setPositions(posRes.data);
      setHistory(histRes.data.filter((t) => t.status === "closed"));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async (posId) => {
    setClosing(posId);
    try {
      const res = await api.post(`/trading/close/${posId}`);
      setMessage({
        type: "success",
        text: `Closed. P&L: ${res.data.pnl >= 0 ? "+" : ""}$${res.data.pnl.toFixed(2)}`,
      });
      await refreshUser();
      await load();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.detail || "Failed to close" });
    } finally {
      setClosing(null);
    }
  };

  const pct = portfolio?.total_return_pct ?? 0;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto font-manrope">
        <div className="mb-8">
          <h1 className="font-outfit text-3xl font-semibold text-[#1A2421] mb-1">Portfolio</h1>
          <p className="text-sm text-[#4A5D54]">Track your simulated positions and performance.</p>
        </div>

        {message && (
          <div className={`mb-4 flex items-center justify-between px-4 py-3 rounded-xl text-sm ${
            message.type === "success"
              ? "bg-[#2C4C3B]/10 border border-[#2C4C3B]/20 text-[#2C4C3B]"
              : "bg-[#C05746]/10 border border-[#C05746]/20 text-[#C05746]"
          }`}>
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)}><X size={14} /></button>
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Portfolio Value", value: `$${(portfolio?.total_portfolio_value ?? 10000).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, sub: "Total" },
            { label: "Cash Balance", value: `$${(portfolio?.cash_balance ?? 10000).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, sub: "Available" },
            {
              label: "Unrealized P&L",
              value: `${(portfolio?.unrealized_pnl ?? 0) >= 0 ? "+" : ""}$${Math.abs(portfolio?.unrealized_pnl ?? 0).toFixed(2)}`,
              colored: portfolio?.unrealized_pnl ?? 0,
            },
            {
              label: "Realized P&L",
              value: `${(portfolio?.realized_pnl ?? 0) >= 0 ? "+" : ""}$${Math.abs(portfolio?.realized_pnl ?? 0).toFixed(2)}`,
              colored: portfolio?.realized_pnl ?? 0,
            },
          ].map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white border border-[#D1CDC3] rounded-2xl p-5"
            >
              <p className="text-xs text-[#7A8C83] uppercase tracking-wider mb-2">{c.label}</p>
              <p className={`font-mono text-xl font-semibold ${
                c.colored != null
                  ? c.colored >= 0 ? "text-[#2C4C3B]" : "text-[#C05746]"
                  : "text-[#1A2421]"
              }`} data-testid={`portfolio-${c.label.toLowerCase().replace(/\s+/g, "-")}`}>
                {c.value}
              </p>
              {c.sub && <p className="text-xs text-[#7A8C83] mt-1">{c.sub}</p>}
            </motion.div>
          ))}
        </div>

        {/* Return bar */}
        <div className="bg-white border border-[#D1CDC3] rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-[#4A5D54]">Overall Performance</span>
            <span className={`font-mono text-lg font-semibold ${pct >= 0 ? "text-[#2C4C3B]" : "text-[#C05746]"}`} data-testid="overall-return-pct">
              {pct >= 0 ? "+" : ""}{pct.toFixed(2)}%
            </span>
          </div>
          <div className="w-full h-2 bg-[#EAE7E0] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${pct >= 0 ? "bg-[#2C4C3B]" : "bg-[#C05746]"}`}
              style={{ width: `${Math.min(Math.abs(pct) * 2, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-[#7A8C83]">
            <span>Start: $10,000</span>
            <span className="font-mono">{portfolio?.total_trades ?? 0} trades closed</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-[#EAE7E0] rounded-xl p-1 mb-6 w-fit">
          {[
            { key: "open", label: `Open Positions (${positions.length})` },
            { key: "closed", label: `Trade History (${history.length})` },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              data-testid={`portfolio-tab-${t.key}`}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === t.key ? "bg-white text-[#1A2421] shadow-sm" : "text-[#7A8C83]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Open positions table */}
        {activeTab === "open" && (
          <div className="bg-white border border-[#D1CDC3] rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-6 space-y-3">
                {[...Array(3)].map((_, i) => <div key={i} className="h-14 shimmer rounded-lg" />)}
              </div>
            ) : positions.length === 0 ? (
              <p className="py-16 text-center text-sm text-[#7A8C83]">No open positions.</p>
            ) : (
              <table className="w-full" data-testid="open-positions-table">
                <thead>
                  <tr className="border-b border-[#EAE7E0] bg-[#F7F5F0]">
                    {["Index", "Direction", "Contracts", "Entry", "Current", "P&L", "Action"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[#7A8C83] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {positions.map((pos) => (
                    <tr key={pos.position_id} className="border-b border-[#F7F5F0] hover:bg-[#F7F5F0] transition-colors">
                      <td className="px-4 py-4 font-mono text-sm font-semibold text-[#1A2421]">
                        {pos.symbol?.replace("^", "")}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`flex items-center gap-1 text-xs font-medium w-fit px-2 py-0.5 rounded ${
                          pos.direction === "long" ? "bg-[#2C4C3B]/10 text-[#2C4C3B]" : "bg-[#C05746]/10 text-[#C05746]"
                        }`}>
                          {pos.direction === "long" ? <TrendUp size={12} /> : <TrendDown size={12} />}
                          {pos.direction?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-mono text-sm text-[#4A5D54]">{pos.contracts}</td>
                      <td className="px-4 py-4 font-mono text-sm text-[#4A5D54]">{pos.entry_price?.toFixed(2)}</td>
                      <td className="px-4 py-4 font-mono text-sm text-[#4A5D54]">{pos.current_price?.toFixed(2) || "—"}</td>
                      <td className="px-4 py-4">
                        <span className={`font-mono text-sm font-semibold ${
                          (pos.unrealized_pnl ?? 0) >= 0 ? "text-[#2C4C3B]" : "text-[#C05746]"
                        }`}>
                          {(pos.unrealized_pnl ?? 0) >= 0 ? "+" : ""}${Math.abs(pos.unrealized_pnl ?? 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => handleClose(pos.position_id)}
                          disabled={closing === pos.position_id}
                          data-testid={`close-btn-${pos.position_id}`}
                          className="text-xs bg-[#F7F5F0] hover:bg-[#C05746] hover:text-white text-[#4A5D54] px-3 py-1.5 rounded-lg transition-all border border-[#D1CDC3] hover:border-[#C05746] disabled:opacity-50"
                        >
                          {closing === pos.position_id ? "..." : "Close"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Trade history */}
        {activeTab === "closed" && (
          <div className="bg-white border border-[#D1CDC3] rounded-2xl overflow-hidden">
            {history.length === 0 ? (
              <p className="py-16 text-center text-sm text-[#7A8C83]">No closed trades yet.</p>
            ) : (
              <table className="w-full" data-testid="trade-history-table">
                <thead>
                  <tr className="border-b border-[#EAE7E0] bg-[#F7F5F0]">
                    {["Index", "Direction", "Contracts", "Entry", "Exit", "P&L", "Date"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[#7A8C83] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((t) => (
                    <tr key={t.position_id} className="border-b border-[#F7F5F0] hover:bg-[#F7F5F0]">
                      <td className="px-4 py-4 font-mono text-sm font-semibold text-[#1A2421]">
                        {t.symbol?.replace("^", "")}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                          t.direction === "long" ? "bg-[#2C4C3B]/10 text-[#2C4C3B]" : "bg-[#C05746]/10 text-[#C05746]"
                        }`}>
                          {t.direction?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-mono text-sm text-[#4A5D54]">{t.contracts}</td>
                      <td className="px-4 py-4 font-mono text-sm text-[#4A5D54]">{t.entry_price?.toFixed(2)}</td>
                      <td className="px-4 py-4 font-mono text-sm text-[#4A5D54]">{t.exit_price?.toFixed(2) || "—"}</td>
                      <td className="px-4 py-4">
                        <span className={`font-mono text-sm font-semibold flex items-center gap-1 ${
                          (t.pnl ?? 0) >= 0 ? "text-[#2C4C3B]" : "text-[#C05746]"
                        }`}>
                          {(t.pnl ?? 0) >= 0 ? <CheckCircle size={12} weight="fill" /> : <X size={12} />}
                          {(t.pnl ?? 0) >= 0 ? "+" : ""}${Math.abs(t.pnl ?? 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-[#7A8C83]">
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          {t.closed_at ? new Date(t.closed_at).toLocaleDateString() : "—"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
