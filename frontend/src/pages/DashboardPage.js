import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { TrendUp, TrendDown, Wallet, ChartLineUp, ArrowRight, Circle } from "@phosphor-icons/react";
import Layout from "../components/Layout";
import api from "../utils/api";
import { useAuth } from "../contexts/AuthContext";

function MetricCard({ label, value, sub, positive, icon: Icon, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-white border border-[#D1CDC3] rounded-2xl p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs text-[#7A8C83] font-manrope uppercase tracking-wider">{label}</p>
        <div className="w-8 h-8 bg-[#F7F5F0] rounded-lg flex items-center justify-center">
          <Icon size={16} color="#4A5D54" />
        </div>
      </div>
      <p className={`font-mono text-2xl font-semibold mb-1 ${
        positive === true ? "text-[#2C4C3B]" : positive === false ? "text-[#C05746]" : "text-[#1A2421]"
      }`} data-testid={`metric-${label.toLowerCase().replace(/\s+/g, "-")}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-[#7A8C83]">{sub}</p>}
    </motion.div>
  );
}

function formatCurrency(n) {
  if (n == null) return "$0.00";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : n > 0 ? "+" : "";
  return `${sign}$${abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function DashboardPage() {
  const [portfolio, setPortfolio] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const [pRes, qRes, posRes] = await Promise.all([
          api.get("/portfolio/summary"),
          api.get("/market/quotes"),
          api.get("/trading/positions"),
        ]);
        setPortfolio(pRes.data);
        setQuotes(qRes.data);
        setPositions(posRes.data.slice(0, 5));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const pct = portfolio?.total_return_pct ?? 0;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-outfit text-3xl font-semibold text-[#1A2421] mb-1">
            Welcome back, {user?.name?.split(" ")[0] || "Trader"}
          </h1>
          <p className="text-[#4A5D54] text-sm font-manrope">
            Your simulated portfolio at a glance.
          </p>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Portfolio Value"
            value={`$${(portfolio?.total_portfolio_value ?? 10000).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
            sub="Virtual currency"
            icon={Wallet}
            delay={0}
          />
          <MetricCard
            label="Cash Balance"
            value={`$${(portfolio?.cash_balance ?? 10000).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
            sub="Available to trade"
            icon={Wallet}
            delay={0.1}
          />
          <MetricCard
            label="Total Return"
            value={formatCurrency(portfolio?.total_return ?? 0)}
            sub="vs. $10,000 start"
            positive={pct > 0 ? true : pct < 0 ? false : null}
            icon={pct >= 0 ? TrendUp : TrendDown}
            delay={0.2}
          />
          <MetricCard
            label="Return %"
            value={`${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`}
            sub={`${portfolio?.total_trades ?? 0} closed trades`}
            positive={pct > 0 ? true : pct < 0 ? false : null}
            icon={ChartLineUp}
            delay={0.3}
          />
        </div>

        {/* Market watchlist + quick trade */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-white border border-[#D1CDC3] rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[#EAE7E0] flex items-center justify-between">
                <h2 className="font-outfit text-base font-semibold text-[#1A2421]">Volatility Watchlist</h2>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-[#2C4C3B] rounded-full live-dot" />
                  <span className="text-xs text-[#7A8C83]">Live data</span>
                </div>
              </div>
              {loading ? (
                <div className="p-6 space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 shimmer rounded-lg" />
                  ))}
                </div>
              ) : (
                <table className="w-full" data-testid="watchlist-table">
                  <thead>
                    <tr className="border-b border-[#EAE7E0]">
                      <th className="text-left px-6 py-3 text-xs font-medium text-[#7A8C83] uppercase tracking-wider">Index</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-[#7A8C83] uppercase tracking-wider">Price</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-[#7A8C83] uppercase tracking-wider">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotes.map((q) => (
                      <tr
                        key={q.symbol}
                        onClick={() => navigate("/trading", { state: { symbol: q.symbol } })}
                        className="border-b border-[#F7F5F0] hover:bg-[#F7F5F0] cursor-pointer transition-colors"
                        data-testid={`watchlist-row-${q.display}`}
                      >
                        <td className="px-6 py-4">
                          <div>
                            <span className="font-mono text-sm font-semibold text-[#1A2421]">{q.display}</span>
                            <p className="text-xs text-[#7A8C83] mt-0.5 hidden sm:block">{q.name}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="font-mono text-sm font-medium text-[#1A2421]">
                            {q.price > 0 ? q.price.toFixed(2) : "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`font-mono text-sm font-medium ${
                            q.change_pct >= 0 ? "text-[#2C4C3B]" : "text-[#C05746]"
                          }`}>
                            {q.change_pct >= 0 ? "+" : ""}{q.change_pct.toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Quick trade card */}
          <div className="bg-[#1A2421] rounded-2xl p-6 flex flex-col">
            <h2 className="font-outfit text-base font-semibold text-white mb-2">Ready to trade?</h2>
            <p className="text-sm text-[#7A8C83] mb-6 leading-relaxed">
              Go long or short on CBOE volatility indices with your virtual balance.
            </p>
            <div className="space-y-3 mb-8 flex-1">
              {[
                ["$" + (portfolio?.cash_balance ?? 10000).toFixed(2), "Available Cash"],
                [(portfolio?.open_positions ?? 0) + " open", "Positions"],
                [(portfolio?.total_trades ?? 0) + " closed", "Trades"],
              ].map(([val, lab]) => (
                <div key={lab} className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-xs text-[#7A8C83]">{lab}</span>
                  <span className="font-mono text-sm text-white font-medium">{val}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate("/trading")}
              data-testid="quick-trade-btn"
              className="flex items-center justify-center gap-2 bg-[#C05746] text-white py-3 rounded-xl text-sm font-medium hover:bg-[#A64B3C] transition-colors"
            >
              Open Trading Terminal <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Open positions */}
        {positions.length > 0 && (
          <div className="bg-white border border-[#D1CDC3] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#EAE7E0] flex items-center justify-between">
              <h2 className="font-outfit text-base font-semibold text-[#1A2421]">Open Positions</h2>
              <button
                onClick={() => navigate("/portfolio")}
                className="text-xs text-[#4A5D54] hover:text-[#1A2421] flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight size={12} />
              </button>
            </div>
            <div className="divide-y divide-[#F7F5F0]">
              {positions.map((pos) => (
                <div key={pos.position_id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-[#1A2421]">
                        {pos.symbol?.replace("^", "")}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        pos.direction === "long"
                          ? "bg-[#2C4C3B]/10 text-[#2C4C3B]"
                          : "bg-[#C05746]/10 text-[#C05746]"
                      }`}>
                        {pos.direction?.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-[#7A8C83] mt-0.5">{pos.contracts} contracts @ {pos.entry_price?.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-mono text-sm font-semibold ${
                      (pos.unrealized_pnl ?? 0) >= 0 ? "text-[#2C4C3B]" : "text-[#C05746]"
                    }`}>
                      {(pos.unrealized_pnl ?? 0) >= 0 ? "+" : ""}${Math.abs(pos.unrealized_pnl ?? 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-[#7A8C83]">{pos.pnl_pct?.toFixed(2)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {positions.length === 0 && !loading && (
          <div className="bg-white border border-dashed border-[#D1CDC3] rounded-2xl p-12 text-center">
            <Circle size={40} className="text-[#D1CDC3] mx-auto mb-4" />
            <p className="font-outfit font-semibold text-[#4A5D54] mb-2">No open positions</p>
            <p className="text-sm text-[#7A8C83] mb-6">Head to the trading terminal to open your first position.</p>
            <button
              onClick={() => navigate("/trading")}
              data-testid="no-positions-trade-btn"
              className="bg-[#2C4C3B] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#1E362A] transition-colors"
            >
              Start Trading
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
