import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Marquee from "react-fast-marquee";
import { ArrowRight, ShieldCheck, ChartLineUp, BookOpen, TrendUp, TrendDown, Play } from "@phosphor-icons/react";
import { useAuth } from "../contexts/AuthContext";

const MARQUEE_ITEMS = [
  { label: "VIX — CBOE Volatility Index", value: "23.45", change: "+2.3%" },
  { label: "VXN — NASDAQ Volatility", value: "25.12", change: "-1.2%" },
  { label: "OVX — Crude Oil Volatility", value: "31.45", change: "+0.8%" },
  { label: "GVZ — Gold Volatility", value: "15.33", change: "-0.5%" },
  { label: "RVX — Russell 2000 Volatility", value: "28.67", change: "+1.4%" },
  { label: "EVZ — EuroCurrency Volatility", value: "7.21", change: "-0.3%" },
  { label: "VVIX — Volatility of VIX", value: "89.42", change: "+3.1%" },
];

const FEATURES = [
  {
    title: "Real Market Data",
    desc: "Live volatility indices from CBOE — VIX, VXN, OVX, GVZ, RVX and more.",
    icon: ChartLineUp,
    span: "md:col-span-4",
  },
  {
    title: "Risk-Free Learning",
    desc: "Start with $10,000 virtual balance. Trade freely without losing real money.",
    icon: ShieldCheck,
    span: "md:col-span-4",
  },
  {
    title: "Expert Guides",
    desc: "Step-by-step tutorials on volatility, market mechanics, and trading strategy.",
    icon: BookOpen,
    span: "md:col-span-4",
  },
  {
    title: "Long & Short Positions",
    desc: "Go LONG when you expect volatility to rise. Go SHORT when you expect it to fall.",
    icon: TrendUp,
    span: "md:col-span-6",
  },
  {
    title: "Live Portfolio Tracking",
    desc: "Monitor unrealized P&L, closed trades, and overall performance in real-time.",
    icon: TrendDown,
    span: "md:col-span-6",
  },
];

const STEPS = [
  { num: "01", title: "Create Free Account", desc: "Sign up in seconds with email or Google. No payment required." },
  { num: "02", title: "Complete Onboarding", desc: "Tell us your experience level. Get a personalized tutorial on volatility trading." },
  { num: "03", title: "Start Simulating", desc: "Trade 7 volatility indices with $10,000 virtual currency. Risk-free." },
];

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCTA = () => navigate(user ? "/dashboard" : "/auth");

  return (
    <div className="min-h-screen bg-[#F7F5F0] font-manrope">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-[#F7F5F0]/90 backdrop-blur-xl border-b border-[#D1CDC3]/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#C05746] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm font-outfit">S</span>
            </div>
            <span className="font-outfit text-xl font-semibold text-[#1A2421]">SimuTrade</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/learn" className="text-sm text-[#4A5D54] hover:text-[#1A2421] transition-colors">Learn</Link>
            <Link to="/terms" className="text-sm text-[#4A5D54] hover:text-[#1A2421] transition-colors">Legal</Link>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <button
                onClick={() => navigate("/dashboard")}
                data-testid="nav-dashboard-cta"
                className="bg-[#2C4C3B] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#1E362A] transition-colors"
              >
                Dashboard
              </button>
            ) : (
              <>
                <Link to="/auth" data-testid="nav-login" className="text-sm text-[#4A5D54] hover:text-[#1A2421] transition-colors">
                  Sign In
                </Link>
                <Link
                  to="/auth"
                  data-testid="nav-signup"
                  className="bg-[#2C4C3B] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#1E362A] transition-colors"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Disclaimer banner */}
      <div className="bg-[#C05746]/10 border-b border-[#C05746]/20 text-center py-2 px-4">
        <p className="text-xs text-[#C05746] font-medium tracking-wide">
          SIMULATION PLATFORM ONLY — All trades use virtual currency. No real money involved.
        </p>
      </div>

      {/* Hero section */}
      <section
        className="relative min-h-[90vh] flex items-center overflow-hidden"
        style={{
          backgroundImage: `url('https://images.pexels.com/photos/26447275/pexels-photo-26447275.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-[#F7F5F0]/88" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-[#C05746] bg-[#C05746]/10 rounded-full px-4 py-1.5 mb-6">
              Free Trading Simulator
            </span>
            <h1 className="font-outfit text-5xl sm:text-6xl lg:text-7xl font-semibold text-[#1A2421] tracking-tight leading-none mb-6 max-w-4xl">
              Master Volatility.{" "}
              <span className="gradient-text">Without the Risk.</span>
            </h1>
            <p className="text-lg text-[#4A5D54] leading-relaxed max-w-2xl mb-10">
              Trade CBOE volatility indices — VIX, VXN, OVX, and more — with $10,000 in virtual currency.
              Learn professional trading strategies in a completely risk-free environment.
            </p>
            <div className="flex flex-wrap gap-4 mb-12">
              <button
                onClick={handleCTA}
                data-testid="hero-cta-primary"
                className="flex items-center gap-2 bg-[#2C4C3B] text-white px-8 py-4 rounded-xl text-base font-medium hover:bg-[#1E362A] transition-all hover:shadow-lg hover:-translate-y-0.5 duration-200"
              >
                Start Trading for Free <ArrowRight size={18} weight="bold" />
              </button>
              <Link
                to="/learn"
                data-testid="hero-cta-learn"
                className="flex items-center gap-2 bg-white text-[#1A2421] border border-[#D1CDC3] px-8 py-4 rounded-xl text-base font-medium hover:border-[#2C4C3B] transition-all hover:shadow-sm duration-200"
              >
                <Play size={16} weight="fill" /> Watch Tutorial
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8">
              {[
                { value: "7", label: "Volatility Indices" },
                { value: "$10K", label: "Starting Balance" },
                { value: "Free", label: "No Credit Card" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="font-mono text-2xl font-semibold text-[#1A2421]">{s.value}</p>
                  <p className="text-sm text-[#7A8C83]">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Marquee */}
      <div className="bg-[#EAE7E0] border-y border-[#D1CDC3] py-3">
        <Marquee speed={35} gradient={false} pauseOnHover>
          {MARQUEE_ITEMS.map((item, i) => (
            <span key={i} className="mx-8 text-xs font-mono text-[#4A5D54] tracking-widest uppercase">
              {item.label}
              <span className="text-[#1A2421] font-semibold ml-2">{item.value}</span>
              <span className={`ml-1 ${item.change.startsWith("+") ? "text-[#2C4C3B]" : "text-[#C05746]"}`}>
                {item.change}
              </span>
              <span className="ml-8 text-[#D1CDC3]">|</span>
            </span>
          ))}
        </Marquee>
      </div>

      {/* Features grid */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h2 className="font-outfit text-4xl font-semibold text-[#1A2421] mb-4">
              Everything you need to learn volatility trading
            </h2>
            <p className="text-[#4A5D54] max-w-2xl mx-auto leading-relaxed">
              Real data. Professional tools. Zero risk. SimuTrade gives beginners the same instruments used by
              professional volatility traders.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`${f.span} bg-white border border-[#D1CDC3] rounded-2xl p-8 hover:border-[#2C4C3B]/40 hover:shadow-md transition-all duration-300 hover:-translate-y-1`}
              >
                <div className="w-12 h-12 bg-[#F7F5F0] rounded-xl flex items-center justify-center mb-4">
                  <f.icon size={24} color="#2C4C3B" weight="duotone" />
                </div>
                <h3 className="font-outfit text-lg font-semibold text-[#1A2421] mb-2">{f.title}</h3>
                <p className="text-sm text-[#4A5D54] leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-[#EAE7E0]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-outfit text-4xl font-semibold text-[#1A2421] mb-4">Get started in minutes</h2>
            <p className="text-[#4A5D54] max-w-xl mx-auto">Three simple steps to start your volatility trading journey.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative"
              >
                <div className="text-6xl font-outfit font-bold text-[#D1CDC3] mb-4">{step.num}</div>
                <h3 className="font-outfit text-xl font-semibold text-[#1A2421] mb-3">{step.title}</h3>
                <p className="text-[#4A5D54] leading-relaxed text-sm">{step.desc}</p>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-14">
            <button
              onClick={handleCTA}
              data-testid="steps-cta"
              className="bg-[#C05746] text-white px-10 py-4 rounded-xl text-base font-medium hover:bg-[#A64B3C] transition-all hover:shadow-lg hover:-translate-y-0.5 duration-200 inline-flex items-center gap-2"
            >
              Start Simulating Now <ArrowRight size={18} weight="bold" />
            </button>
          </div>
        </div>
      </section>

      {/* Education preview */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-xs font-semibold tracking-widest uppercase text-[#C05746] mb-4 block">
              Learning Center
            </span>
            <h2 className="font-outfit text-4xl font-semibold text-[#1A2421] mb-6">
              Understand volatility before you trade it
            </h2>
            <p className="text-[#4A5D54] leading-relaxed mb-8">
              Our beginner-friendly guides explain what the VIX is, how volatility indices work, and why
              professional traders use them. Learn the theory, then practice with real market data.
            </p>
            <Link
              to="/learn"
              data-testid="learn-section-cta"
              className="inline-flex items-center gap-2 text-[#2C4C3B] font-semibold hover:gap-3 transition-all"
            >
              Explore the Learning Center <ArrowRight size={16} />
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <img
              src="https://images.unsplash.com/photo-1768471125958-78556538fadc?crop=entropy&cs=srgb&fm=jpg&q=85&w=600"
              alt="Learning environment"
              className="rounded-2xl w-full h-80 object-cover border border-[#D1CDC3] shadow-sm"
            />
          </motion.div>
        </div>
      </section>

      {/* Disclaimer & Footer */}
      <footer className="bg-[#1A2421] text-[#EAE7E0] py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="border border-[#C05746]/30 rounded-xl p-6 mb-12 bg-[#C05746]/5">
            <h4 className="font-outfit text-base font-semibold text-[#C05746] mb-2">Important Disclaimer</h4>
            <p className="text-sm text-[#7A8C83] leading-relaxed">
              SimuTrade is a <strong className="text-[#EAE7E0]">simulation platform only</strong>. All trading
              activity uses virtual currency and has no real-world financial impact. This platform is intended for
              educational purposes and does not constitute financial advice. SimuTrade is{" "}
              <strong className="text-[#EAE7E0]">not affiliated</strong> with CBOE Global Markets, NYSE, or any
              real trading platform. Past simulated performance does not guarantee future results.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-[#C05746] rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-xs font-outfit">S</span>
                </div>
                <span className="font-outfit text-lg font-semibold text-white">SimuTrade</span>
              </div>
              <p className="text-xs text-[#7A8C83] leading-relaxed">
                Learn volatility trading risk-free. Not affiliated with any real trading platform.
              </p>
            </div>
            <div>
              <h5 className="font-outfit font-semibold text-sm mb-4 text-[#EAE7E0]">Platform</h5>
              <ul className="space-y-2 text-sm text-[#7A8C83]">
                <li><Link to="/auth" className="hover:text-[#EAE7E0] transition-colors">Sign Up</Link></li>
                <li><Link to="/learn" className="hover:text-[#EAE7E0] transition-colors">Learning Center</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-outfit font-semibold text-sm mb-4 text-[#EAE7E0]">Data Partners</h5>
              <ul className="space-y-2 text-xs text-[#7A8C83]">
                <li>CBOE VIX (Public)</li>
                <li>Yahoo Finance API</li>
              </ul>
            </div>
            <div>
              <h5 className="font-outfit font-semibold text-sm mb-4 text-[#EAE7E0]">Legal</h5>
              <ul className="space-y-2 text-sm text-[#7A8C83]">
                <li><Link to="/terms" className="hover:text-[#EAE7E0] transition-colors">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-[#EAE7E0] transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 text-center text-xs text-[#7A8C83]">
            © {new Date().getFullYear()} SimuTrade. All rights reserved. Not affiliated with any real trading platform.
          </div>
        </div>
      </footer>
    </div>
  );
}
