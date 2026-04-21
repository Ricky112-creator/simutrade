import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { TrendUp, TrendDown, Info, X, CheckCircle } from "@phosphor-icons/react";
import Layout from "../components/Layout";
import api from "../utils/api";
import { useAuth } from "../contexts/AuthContext";

const TOOLTIP_CONTENT = {
  long: "LONG: You profit when the volatility index RISES. Best when you expect fear/uncertainty to increase.",
  short: "SHORT: You profit when the volatility index FALLS. Best when you expect markets to calm down.",
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#D1CDC3] rounded-xl px-4 py-3 shadow-lg">
      <p className="text-xs text-[#7A8C83] mb-1">{label}</p>
      <p className="font-mono font-semibold text-[#1A2421]">{payload[0]?.value?.toFixed(2)}</p>
    </div>
  );
}

export default function TradingPage() {
  const location = useLocation();
  const [indices, setIndices] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState(location.state?.symbol || "^VIX");
  const [chartData, setChartData] = useState([]);
  const [chartPeriod, setChartPeriod] = useState("1mo");
  const [positions, setPositions] = useState([]);
  const [direction, setDirection] = useState("long");
  const [contracts, setContracts] = useState("1");
  const [currentQuote, setCurrentQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeMessage, setTradeMessage] = useState(null);
  const [showTooltip, setShowTooltip] = useState(null);
  const { refreshUser } = useAuth();

  useEffect(() => {
    api.get("/market/quotes").then((res) => {
      setIndices(res.data);
      const sel = res.data.find((q) => q.symbol === selectedSymbol);
      if (sel) setCurrentQuote(sel);
      setLoading(false);
    });
    loadPositions();
  }, []);

  useEffect(() => {
    const q = indices.find((i) => i.symbol === selectedSymbol);
    if (q) setCurrentQuote(q);
    loadChart();
  }, [selectedSymbol, chartPeriod]);

  const loadChart = () => {
    const clean = selectedSymbol.replace("^", "");
    api.get(`/market/history/${clean}?period=${chartPeriod}`).then((res) => {
      setChartData(res.data.data || []);
    });
  };

  const loadPositions = () => {
    api.get("/trading/positions").then((res) => setPositions(res.data));
  };

  const handleTrade = async () => {
    const c = parseFloat(contracts);
    if (!c || c <= 0) return;
    setTradeLoading(true);
    setTradeMessage(null);
    try {
      await api.post("/trading/open", {
        symbol: selectedSymbol,
        direction,
        contracts: c,
      });
      setTradeMessage({ type: "success", text: `Position opened: ${direction.toUpperCase()} ${c} contracts on ${selectedSymbol.replace("^", "")}` });
      await refreshUser();
      loadPositions();
    } catch (err) {
      setTradeMessage({ type: "error", text: err.response?.data?.detail || "Trade failed" });
    } finally {
      setTradeLoading(false);
    }
  };

  const handleClose = async (posId) => {
    try {
      const res = await api.post(`/trading/close/${posId}`);
      setTradeMessage({
        type: "success",
        text: `Position closed. P&L: ${res.data.pnl >= 0 ? "+" : ""}$${res.data.pnl.toFixed(2)}`,
      });
      await refreshUser();
      loadPositions();
    } catch (err) {
      setTradeMessage({ type: "error", text: err.response?.data?.detail || "Failed to close" });
    }
  };

  const price = currentQuote?.price ?? 0;
  const cost = (parseFloat(contracts) || 0) * price;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="font-outfit text-3xl font-semibold text-[#1A2421] mb-1">Trading Terminal</h1>
          <p className="text-sm text-[#4A5D54] font-manrope">Simulate trades on CBOE volatility indices.</p>
        </div>

        {/* Trade message */}
        <AnimatePresence>
          {tradeMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-4 flex items-center justify-between px-4 py-3 rounded-xl text-sm font-manrope ${
                tradeMessage.type === "success"
                  ? "bg-[#2C4C3B]/10 border border-[#2C4C3B]/20 text-[#2C4C3B]"
                  : "bg-[#C05746]/10 border border-[#C05746]/20 text-[#C05746]"
              }`}
              data-testid="trade-message"
            >
              <div className="flex items-center gap-2">
                {tradeMessage.type === "success" ? <CheckCircle size={16} weight="fill" /> : <X size={16} />}
                {tradeMessage.text}
              </div>
              <button onClick={() => setTradeMessage(null)}><X size={14} /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Index selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {indices.map((q) => (
            <button
              key={q.symbol}
              onClick={() => setSelectedSymbol(q.symbol)}
              data-testid={`index-select-${q.display}`}
              className={`shrink-0 px-4 py-3 rounded-xl border transition-all duration-200 text-left ${
                selectedSymbol === q.symbol
                  ? "bg-[#1A2421] border-[#1A2421] text-white shadow-sm"
                  : "bg-white border-[#D1CDC3] text-[#1A2421] hover:border-[#4A5D54]"
              }`}
            >
              <div className="font-mono text-sm font-semibold">{q.display}</div>
              <div className={`font-mono text-xs mt-0.5 ${
                selectedSymbol === q.symbol ? "text-white/70" :
                q.change_pct >= 0 ? "text-[#2C4C3B]" : "text-[#C05746]"
              }`}>
                {q.price > 0 ? q.price.toFixed(2) : "—"} {q.change_pct >= 0 ? "▲" : "▼"} {Math.abs(q.change_pct).toFixed(1)}%
              </div>
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-[#D1CDC3] rounded-2xl p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="font-outfit text-xl font-semibold text-[#1A2421]">
                      {currentQuote?.display || selectedSymbol.replace("^", "")}
                    </h2>
                    <span className={`font-mono text-xl font-semibold ${
                      (currentQuote?.change_pct ?? 0) >= 0 ? "text-[#2C4C3B]" : "text-[#C05746]"
                    }`}>
                      {price > 0 ? price.toFixed(2) : "—"}
                    </span>
                    <span className={`text-sm font-mono ${
                      (currentQuote?.change_pct ?? 0) >= 0 ? "text-[#2C4C3B]" : "text-[#C05746]"
                    }`}>
                      {(currentQuote?.change_pct ?? 0) >= 0 ? "+" : ""}{(currentQuote?.change_pct ?? 0).toFixed(2)}%
                    </span>
                  </div>
                  <p className="text-sm text-[#7A8C83] mt-1">{currentQuote?.name}</p>
                  <p className="text-xs text-[#7A8C83] mt-0.5">{currentQuote?.description}</p>
                </div>
              </div>

              {/* Period buttons */}
              <div className="flex gap-2 mb-4">
                {["5d", "1mo", "3mo", "6mo", "1y"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setChartPeriod(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      chartPeriod === p
                        ? "bg-[#1A2421] text-white"
                        : "bg-[#F7F5F0] text-[#4A5D54] hover:bg-[#EAE7E0]"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <div className="h-52" data-testid="price-chart">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2C4C3B" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#2C4C3B" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EAE7E0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#7A8C83" }} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#7A8C83" }} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="close" stroke="#2C4C3B" strokeWidth={2} fill="url(#areaGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-[#2C4C3B] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* Open positions */}
            <div className="bg-white border border-[#D1CDC3] rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[#EAE7E0]">
                <h3 className="font-outfit text-sm font-semibold text-[#1A2421]">Open Positions</h3>
              </div>
              {positions.length === 0 ? (
                <p className="px-6 py-8 text-sm text-[#7A8C83] text-center">No open positions yet.</p>
              ) : (
                <div className="divide-y divide-[#F7F5F0]">
                  {positions.map((pos) => (
                    <div key={pos.position_id} className="px-6 py-4 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-[#1A2421]">
                            {pos.symbol?.replace("^", "")}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                            pos.direction === "long" ? "bg-[#2C4C3B]/10 text-[#2C4C3B]" : "bg-[#C05746]/10 text-[#C05746]"
                          }`}>
                            {pos.direction?.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-[#7A8C83]">
                          {pos.contracts} contracts @ {pos.entry_price?.toFixed(2)} → {pos.current_price?.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={`font-mono text-sm font-semibold ${
                            (pos.unrealized_pnl ?? 0) >= 0 ? "text-[#2C4C3B]" : "text-[#C05746]"
                          }`} data-testid={`position-pnl-${pos.position_id}`}>
                            {(pos.unrealized_pnl ?? 0) >= 0 ? "+" : ""}${Math.abs(pos.unrealized_pnl ?? 0).toFixed(2)}
                          </p>
                          <p className="text-xs text-[#7A8C83]">{pos.pnl_pct?.toFixed(2)}%</p>
                        </div>
                        <button
                          onClick={() => handleClose(pos.position_id)}
                          data-testid={`close-position-${pos.position_id}`}
                          className="text-xs bg-[#F7F5F0] hover:bg-[#C05746] hover:text-white text-[#4A5D54] px-3 py-1.5 rounded-lg transition-all border border-[#D1CDC3] hover:border-[#C05746]"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Trade panel */}
          <div className="space-y-4">
            <div className="bg-white border border-[#D1CDC3] rounded-2xl p-6">
              <h3 className="font-outfit text-base font-semibold text-[#1A2421] mb-5">Place Order</h3>

              {/* Direction toggle */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-[#4A5D54] uppercase tracking-wider">Direction</label>
                  <button
                    onClick={() => setShowTooltip(showTooltip ? null : direction)}
                    className="text-[#7A8C83] hover:text-[#4A5D54] transition-colors"
                  >
                    <Info size={14} />
                  </button>
                </div>
                {showTooltip && (
                  <div className="mb-3 bg-[#F7F5F0] rounded-xl p-3 text-xs text-[#4A5D54] leading-relaxed border border-[#D1CDC3]">
                    {TOOLTIP_CONTENT[direction]}
                  </div>
                )}
                <div className="flex rounded-xl overflow-hidden border border-[#D1CDC3]">
                  <button
                    onClick={() => setDirection("long")}
                    data-testid="direction-long"
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all ${
                      direction === "long" ? "bg-[#2C4C3B] text-white" : "bg-white text-[#7A8C83] hover:text-[#1A2421]"
                    }`}
                  >
                    <TrendUp size={16} /> Long
                  </button>
                  <button
                    onClick={() => setDirection("short")}
                    data-testid="direction-short"
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all ${
                      direction === "short" ? "bg-[#C05746] text-white" : "bg-white text-[#7A8C83] hover:text-[#1A2421]"
                    }`}
                  >
                    <TrendDown size={16} /> Short
                  </button>
                </div>
              </div>

              {/* Contracts input */}
              <div className="mb-5">
                <label className="block text-xs font-medium text-[#4A5D54] uppercase tracking-wider mb-2">
                  Contracts
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={contracts}
                  onChange={(e) => setContracts(e.target.value)}
                  data-testid="contracts-input"
                  className="w-full px-4 py-3 rounded-xl border border-[#D1CDC3] bg-white text-[#1A2421] font-mono text-sm focus:outline-none focus:border-[#2C4C3B] focus:ring-1 focus:ring-[#2C4C3B]"
                />
                <div className="flex gap-2 mt-2">
                  {[1, 5, 10, 25].map((n) => (
                    <button
                      key={n}
                      onClick={() => setContracts(String(n))}
                      className="flex-1 py-1.5 text-xs rounded-lg bg-[#F7F5F0] text-[#4A5D54] hover:bg-[#EAE7E0] transition-colors"
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Order summary */}
              <div className="bg-[#F7F5F0] rounded-xl p-4 mb-5 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[#7A8C83]">Index Price</span>
                  <span className="font-mono font-medium text-[#1A2421]">{price > 0 ? price.toFixed(2) : "—"}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#7A8C83]">Contracts</span>
                  <span className="font-mono font-medium text-[#1A2421]">{contracts || "0"}</span>
                </div>
                <div className="h-px bg-[#D1CDC3]" />
                <div className="flex justify-between text-sm">
                  <span className="text-[#4A5D54] font-medium">Total Cost</span>
                  <span className="font-mono font-semibold text-[#1A2421]" data-testid="trade-cost">
                    ${cost.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleTrade}
                disabled={tradeLoading || price <= 0 || !contracts || parseFloat(contracts) <= 0}
                data-testid="trade-submit-button"
                className={`w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  direction === "long"
                    ? "bg-[#2C4C3B] text-white hover:bg-[#1E362A]"
                    : "bg-[#C05746] text-white hover:bg-[#A64B3C]"
                }`}
              >
                {tradeLoading
                  ? "Placing order..."
                  : `Open ${direction.toUpperCase()} Position`}
              </button>

              <p className="text-center text-xs text-[#7A8C83] mt-3">
                Simulation only — no real money used
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
