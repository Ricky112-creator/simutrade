import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, ChartBar, Lightbulb, ArrowRight, MagnifyingGlass } from "@phosphor-icons/react";
import Layout from "../components/Layout";
import { useAuth } from "../contexts/AuthContext";

const ARTICLES = [
  {
    id: "what-is-vix",
    category: "Fundamentals",
    title: "What is the VIX?",
    desc: "The CBOE Volatility Index — the market's 'fear gauge' — explained for beginners.",
    readTime: "5 min",
    content: [
      {
        heading: "The VIX: Market's Fear Gauge",
        body: `The VIX (CBOE Volatility Index) was introduced in 1993 and measures the market's expectation of how much the S&P 500 will fluctuate over the next 30 days. It's derived from the prices of S&P 500 options.

When investors are fearful, they rush to buy put options (insurance against falling prices). This demand drives up option prices, which in turn pushes the VIX higher. When markets are calm, the VIX tends to stay low.

A VIX below 20 generally indicates calm markets. Above 30 suggests significant stress. During the COVID crash in March 2020, the VIX hit an all-time high of 82.69.`,
      },
      {
        heading: "How to Read the VIX",
        body: `The VIX is expressed as an annualized percentage. A VIX of 20 means options are pricing in a daily move of roughly 20/√252 ≈ 1.26% in the S&P 500.

Key levels traders watch:
• Below 15: Very calm — complacency may be building
• 15–25: Normal range — typical market conditions
• 25–35: Elevated — some fear/uncertainty in markets
• Above 35: High fear — potential market dislocation
• Above 50: Extreme panic — rare, major crisis territory`,
      },
      {
        heading: "Mean Reversion: A Core Concept",
        body: `Unlike stocks, volatility tends to mean-revert. When the VIX spikes to extreme levels, it almost always comes back down. This is why many volatility traders look for opportunities to go SHORT on the VIX after a major spike.

However, this strategy requires careful risk management — volatility can stay elevated for extended periods during market crises (2008, 2020).`,
      },
    ],
  },
  {
    id: "long-vs-short",
    category: "Strategy",
    title: "Long vs. Short Volatility",
    desc: "When to bet that fear will rise, and when to bet it will fall.",
    readTime: "6 min",
    content: [
      {
        heading: "Going LONG on Volatility",
        body: `When you go LONG on a volatility index (like VIX), you're betting that volatility will INCREASE. This means you expect markets to become more uncertain or fearful.

Scenarios where going long makes sense:
• Before major economic announcements (Fed decisions, jobs data)
• Ahead of geopolitical events with uncertain outcomes
• When markets seem overly complacent (VIX unusually low)
• As a hedge against a stock portfolio

In SimuTrade, a LONG position profits when the index price rises above your entry price.`,
      },
      {
        heading: "Going SHORT on Volatility",
        body: `When you go SHORT, you're betting that volatility will DECREASE — markets will calm down from a period of stress.

This is actually how many professional volatility strategies work. After a spike in the VIX, selling volatility (going short) is a common institutional strategy.

Scenarios for short volatility:
• After a major market panic where VIX has spiked significantly
• In low-volatility trending bull markets
• When you expect central bank intervention to calm markets

In SimuTrade, a SHORT position profits when the index price falls below your entry price.`,
      },
    ],
  },
  {
    id: "all-indices",
    category: "Indices",
    title: "Understanding All 7 Volatility Indices",
    desc: "VIX, VXN, OVX, GVZ, RVX, EVZ, and VVIX — what each one measures.",
    readTime: "8 min",
    content: [
      {
        heading: "The Full Volatility Universe",
        body: `While VIX is the most famous, CBOE offers a suite of volatility indices covering different asset classes:

VIX — S&P 500 volatility (the classic "fear gauge")
VXN — NASDAQ-100 volatility (tech sector focus)  
OVX — Crude oil volatility (energy markets)
GVZ — Gold volatility (safe-haven assets)
RVX — Russell 2000 volatility (small-cap stocks)
EVZ — EUR/USD volatility (forex)
VVIX — Volatility of VIX itself`,
      },
      {
        heading: "Correlations Between Indices",
        body: `These indices often — but not always — move together. During broad market crises, VIX, VXN, and RVX tend to spike simultaneously. However, oil-specific events (OPEC decisions, supply shocks) will primarily move OVX without necessarily moving equity volatility.

This creates trading opportunities. If oil volatility spikes but equity markets remain calm, a trader might take a short position on OVX if they believe the oil supply shock will be temporary.`,
      },
    ],
  },
  {
    id: "risk-management",
    category: "Risk",
    title: "Risk Management Basics",
    desc: "Position sizing, stop-losses, and protecting your virtual portfolio.",
    readTime: "5 min",
    content: [
      {
        heading: "Position Sizing",
        body: `Never risk too much on a single trade. A common rule is to risk no more than 1-2% of your total portfolio on any single position.

With a $10,000 portfolio:
• 1% risk = $100 per trade
• 2% risk = $200 per trade

In volatility trading, positions can move very quickly — a VIX spike from 20 to 40 (100% increase) is not uncommon during crises.`,
      },
      {
        heading: "Diversification Across Indices",
        body: `Don't concentrate all your capital in one index. Spreading positions across VIX (equity), OVX (oil), and GVZ (gold) provides diversification since these don't always move together.

Use SimuTrade to experiment with different allocation strategies before applying them in real markets.`,
      },
    ],
  },
];

const GLOSSARY = [
  { term: "VIX", def: "CBOE Volatility Index. Measures S&P 500's expected 30-day volatility." },
  { term: "Implied Volatility (IV)", def: "The market's forecast of a security's future price movement, derived from options prices." },
  { term: "Mean Reversion", def: "The tendency of volatility to return to its long-term average after extreme highs or lows." },
  { term: "Contango", def: "When futures prices are higher than the spot price. Common in VIX futures — a headwind for long volatility." },
  { term: "Backwardation", def: "When futures prices are lower than the spot price. Rare in VIX — usually signals severe market stress." },
  { term: "Vega", def: "An option's sensitivity to changes in implied volatility. A measure of volatility exposure." },
  { term: "P&L", def: "Profit and Loss. The financial result of a trade." },
  { term: "Long Position", def: "Buying a contract expecting its price to RISE." },
  { term: "Short Position", def: "Selling a contract expecting its price to FALL." },
  { term: "Contracts", def: "The unit of trading. In SimuTrade, 1 contract = 1 unit of the index value." },
];

export default function LearnPage() {
  const { user } = useAuth();
  const [activeArticle, setActiveArticle] = useState(null);
  const [activeSection, setActiveSection] = useState("articles");
  const [search, setSearch] = useState("");

  const filteredGlossary = GLOSSARY.filter(
    (g) =>
      g.term.toLowerCase().includes(search.toLowerCase()) ||
      g.def.toLowerCase().includes(search.toLowerCase())
  );

  const Wrapper = user ? Layout : ({ children }) => (
    <div className="min-h-screen bg-[#F7F5F0]">
      <nav className="sticky top-0 z-50 bg-[#F7F5F0]/90 backdrop-blur-xl border-b border-[#D1CDC3]/50 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#C05746] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm font-outfit">S</span>
          </div>
          <span className="font-outfit text-xl font-semibold text-[#1A2421]">SimuTrade</span>
        </Link>
        <Link to="/auth" className="bg-[#2C4C3B] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#1E362A] transition-colors">
          Start Trading Free
        </Link>
      </nav>
      <div className="p-6 md:p-12">{children}</div>
    </div>
  );

  return (
    <Wrapper>
      <div className="max-w-5xl mx-auto font-manrope">
        <div className="mb-10">
          <span className="text-xs font-semibold tracking-widest uppercase text-[#C05746] mb-3 block">Learning Center</span>
          <h1 className="font-outfit text-4xl font-semibold text-[#1A2421] mb-3">
            Master Volatility Trading
          </h1>
          <p className="text-[#4A5D54] leading-relaxed max-w-2xl">
            Beginner-friendly guides on volatility indices, trading strategies, and risk management.
            Learn the theory, then practice with real market data in SimuTrade.
          </p>
        </div>

        {/* Section tabs */}
        <div className="flex gap-2 mb-8">
          {[
            { key: "articles", label: "Articles", icon: BookOpen },
            { key: "glossary", label: "Glossary", icon: MagnifyingGlass },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { setActiveSection(key); setActiveArticle(null); }}
              data-testid={`learn-tab-${key}`}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeSection === key
                  ? "bg-[#2C4C3B] text-white"
                  : "bg-white border border-[#D1CDC3] text-[#4A5D54] hover:border-[#2C4C3B]"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* Article detail view */}
        {activeArticle && activeSection === "articles" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#D1CDC3] rounded-2xl p-8 md:p-12"
          >
            <button
              onClick={() => setActiveArticle(null)}
              className="text-sm text-[#4A5D54] hover:text-[#1A2421] mb-6 flex items-center gap-1 transition-colors"
            >
              ← Back to articles
            </button>
            <span className="text-xs font-semibold tracking-widest uppercase text-[#C05746] mb-2 block">
              {activeArticle.category}
            </span>
            <h2 className="font-outfit text-3xl font-semibold text-[#1A2421] mb-2">{activeArticle.title}</h2>
            <p className="text-sm text-[#7A8C83] mb-8">{activeArticle.readTime} read</p>
            <div className="space-y-8">
              {activeArticle.content.map((section) => (
                <div key={section.heading}>
                  <h3 className="font-outfit text-xl font-semibold text-[#1A2421] mb-4">{section.heading}</h3>
                  {section.body.split("\n\n").map((para, i) => (
                    <p key={i} className="text-[#4A5D54] leading-loose mb-4 whitespace-pre-line">{para}</p>
                  ))}
                </div>
              ))}
            </div>
            {!user && (
              <div className="mt-10 bg-[#F7F5F0] rounded-2xl p-6 text-center border border-[#D1CDC3]">
                <p className="font-outfit text-lg font-semibold text-[#1A2421] mb-2">
                  Ready to practice?
                </p>
                <p className="text-sm text-[#4A5D54] mb-4">
                  Apply what you've learned with $10,000 in virtual currency.
                </p>
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-2 bg-[#C05746] text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-[#A64B3C] transition-colors"
                >
                  Start Simulating Free <ArrowRight size={16} />
                </Link>
              </div>
            )}
          </motion.div>
        )}

        {/* Articles grid */}
        {!activeArticle && activeSection === "articles" && (
          <div className="grid md:grid-cols-2 gap-5">
            {ARTICLES.map((article, i) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => setActiveArticle(article)}
                data-testid={`article-card-${article.id}`}
                className="bg-white border border-[#D1CDC3] rounded-2xl p-6 cursor-pointer hover:border-[#2C4C3B]/40 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
              >
                <span className="text-xs font-semibold uppercase tracking-widest text-[#C05746] mb-3 block">
                  {article.category}
                </span>
                <h3 className="font-outfit text-lg font-semibold text-[#1A2421] mb-2">{article.title}</h3>
                <p className="text-sm text-[#4A5D54] leading-relaxed mb-4">{article.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#7A8C83]">{article.readTime} read</span>
                  <span className="text-sm text-[#2C4C3B] font-medium flex items-center gap-1">
                    Read <ArrowRight size={14} />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Glossary */}
        {activeSection === "glossary" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="relative mb-6">
              <MagnifyingGlass size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A8C83]" />
              <input
                type="text"
                placeholder="Search terms..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="glossary-search"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#D1CDC3] bg-white text-[#1A2421] text-sm focus:outline-none focus:border-[#2C4C3B] focus:ring-1 focus:ring-[#2C4C3B]"
              />
            </div>
            <div className="space-y-3">
              {filteredGlossary.map((g) => (
                <div key={g.term} className="bg-white border border-[#D1CDC3] rounded-xl p-5 hover:border-[#2C4C3B]/30 transition-colors">
                  <span className="font-mono text-sm font-semibold text-[#2C4C3B] bg-[#2C4C3B]/8 rounded-lg px-2 py-0.5 mr-3">
                    {g.term}
                  </span>
                  <span className="text-sm text-[#4A5D54] leading-relaxed">{g.def}</span>
                </div>
              ))}
              {filteredGlossary.length === 0 && (
                <p className="text-center py-8 text-sm text-[#7A8C83]">No terms found for "{search}"</p>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </Wrapper>
  );
}
