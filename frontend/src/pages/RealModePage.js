import React, { useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, AlertTriangle, CheckCircle, TrendingUp, Shield, Smartphone } from "lucide-react";
import Layout from "../components/Layout";
import api from "../utils/api";
import { useMode } from "../contexts/ModeContext";

const BROKERS = [
  {
    id: "interactive-brokers",
    name: "Interactive Brokers",
    tagline: "Professional-grade platform",
    initials: "IB",
    color: "bg-red-600",
    url: "https://www.interactivebrokers.com/?src=simutrade",
    desc: "Industry leader for options and volatility derivatives. Used by institutional traders worldwide.",
    features: ["Options & futures on VIX", "Low commissions", "Advanced analytics", "Global markets"],
    level: "Advanced",
  },
  {
    id: "tastytrade",
    name: "Tastytrade",
    tagline: "Built for derivatives traders",
    initials: "TT",
    color: "bg-orange-500",
    url: "https://tastytrade.com/?ref=simutrade",
    desc: "Designed specifically for options and futures traders. Excellent educational resources.",
    features: ["VIX options trading", "Free education", "Simple pricing", "Mobile-first"],
    level: "Intermediate",
  },
  {
    id: "schwab",
    name: "Charles Schwab",
    tagline: "Full-service brokerage",
    initials: "CS",
    color: "bg-blue-700",
    url: "https://www.schwab.com/?ref=simutrade",
    desc: "One of the largest retail brokerages. Great for beginners with strong customer support.",
    features: ["No account minimums", "thinkorswim platform", "Volatility ETFs", "Extensive research"],
    level: "Beginner",
  },
  {
    id: "etrade",
    name: "E*TRADE",
    tagline: "Morgan Stanley platform",
    initials: "ET",
    color: "bg-purple-600",
    url: "https://us.etrade.com/?ref=simutrade",
    desc: "Full-featured platform backed by Morgan Stanley. Strong tools for options trading.",
    features: ["Options on VIX ETFs", "Power E*TRADE platform", "Screeners", "Portfolio analysis"],
    level: "Intermediate",
  },
  {
    id: "webull",
    name: "Webull",
    tagline: "Commission-free trading",
    initials: "WB",
    color: "bg-teal-600",
    url: "https://www.webull.com/?ref=simutrade",
    desc: "Modern mobile-first platform with commission-free trading and strong charting tools.",
    features: ["Commission-free", "Mobile app", "Extended hours", "Paper trading mode"],
    level: "Beginner",
  },
  {
    id: "robinhood",
    name: "Robinhood",
    tagline: "Simple mobile investing",
    initials: "RH",
    color: "bg-emerald-600",
    url: "https://robinhood.com/?ref=simutrade",
    desc: "Simple, beginner-friendly app. Options available with Robinhood Gold subscription.",
    features: ["Simple interface", "No minimums", "Fractional shares", "Options trading"],
    level: "Beginner",
  },
];

const levelColor = { Beginner: "bg-emerald-50 text-emerald-700", Intermediate: "bg-blue-50 text-blue-700", Advanced: "bg-purple-50 text-purple-700" };

export default function RealModePage() {
  const [tracked, setTracked] = useState({});
  const { setMode } = useMode();

  const handleClick = async (broker) => {
    try {
      await api.post("/referral/track", { partner: broker.id, action: "click" });
    } catch {}
    setTracked((p) => ({ ...p, [broker.id]: true }));
    window.open(broker.url, "_blank", "noopener,noreferrer");
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto font-inter">
        <div className="mb-8">
          <h1 className="font-outfit text-3xl font-semibold text-[#0A2540] mb-1">Live Trading Partners</h1>
          <p className="text-sm text-slate-400">Access real volatility markets via our verified broker partners.</p>
        </div>

        {/* Big disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8 flex gap-4">
          <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" strokeWidth={2} />
          <div>
            <p className="font-semibold text-amber-800 text-sm mb-1">Important — Real Money Involved</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              Real Mode connects you to <strong>third-party broker platforms</strong>. These involve <strong>real financial transactions</strong>.
              SimuTrade does not execute trades, hold funds, or act as a financial intermediary.
              All trading on partner platforms is subject to their terms, fees, and risks.
              <strong> Only trade what you can afford to lose. </strong>
              Consider switching back to <button onClick={() => setMode("demo")} className="underline font-semibold">Practice Mode</button> to learn first.
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-8 shadow-card">
          <h2 className="font-outfit text-base font-semibold text-[#0A2540] mb-4">How Live Mode Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Shield, t: "1. Choose a Broker", d: "Select a partner platform that fits your experience level and needs." },
              { icon: ExternalLink, t: "2. Open an Account", d: "Create your account directly on the broker's platform. SimuTrade never handles your money." },
              { icon: TrendingUp, t: "3. Trade Volatility", d: "Use your knowledge from SimuTrade to trade real volatility products on the partner platform." },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t} className="flex gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                  <Icon size={16} strokeWidth={1.5} className="text-[#0A2540]" />
                </div>
                <div>
                  <p className="font-semibold text-[#0A2540] text-sm mb-1">{t}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Broker grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {BROKERS.map((b, i) => (
            <motion.div key={b.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-card hover:shadow-card-hover transition-shadow card-hover">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 ${b.color} rounded-xl flex items-center justify-center text-white font-outfit font-bold text-sm shrink-0`}>
                  {b.initials}
                </div>
                <div className="min-w-0">
                  <h3 className="font-outfit font-semibold text-[#0A2540] text-sm">{b.name}</h3>
                  <p className="text-xs text-slate-400">{b.tagline}</p>
                </div>
                <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${levelColor[b.level]}`}>{b.level}</span>
              </div>

              <p className="text-sm text-slate-500 leading-relaxed mb-4">{b.desc}</p>

              <ul className="space-y-1.5 mb-5">
                {b.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-slate-500">
                    <CheckCircle size={12} className="text-emerald-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <button onClick={() => handleClick(b)} data-testid={`broker-open-${b.id}`}
                className="w-full flex items-center justify-center gap-2 bg-[#0A2540] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#051A2E] transition-colors">
                {tracked[b.id] ? (
                  <><CheckCircle size={14} /> Opened</>
                ) : (
                  <>Open Account <ExternalLink size={13} /></>
                )}
              </button>
              <p className="text-center text-[10px] text-slate-400 mt-2">
                External platform — SimuTrade earns referral fees
              </p>
            </motion.div>
          ))}
        </div>

        {/* Footer disclaimer */}
        <div className="mt-8 bg-slate-50 border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500 leading-relaxed text-center">
            <strong className="text-slate-700">Affiliate Disclosure:</strong> SimuTrade may earn a referral commission if you open an account with a partner broker.
            This does not affect the quality of our recommendations. All brokers listed are regulated financial institutions.
            SimuTrade is not a broker-dealer or financial advisor. This is not financial advice.
            <strong className="text-slate-700"> Trading involves significant risk of loss.</strong>
          </p>
        </div>
      </div>
    </Layout>
  );
}
