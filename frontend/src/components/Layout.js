import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  House, ChartLineUp, Wallet, GraduationCap, Gear, SignOut, List, X
} from "@phosphor-icons/react";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: House },
  { path: "/trading", label: "Trade", icon: ChartLineUp },
  { path: "/portfolio", label: "Portfolio", icon: Wallet },
  { path: "/learn", label: "Learn", icon: GraduationCap },
  { path: "/settings", label: "Settings", icon: Gear },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#C05746] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm font-outfit">S</span>
          </div>
          <span className="font-outfit text-xl font-semibold text-white">SimuTrade</span>
        </div>
        <span className="mt-2 inline-block text-[10px] font-manrope font-medium tracking-widest uppercase bg-[#C05746]/20 text-[#C05746] rounded px-2 py-0.5">
          Demo Mode
        </span>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              onClick={() => setMobileOpen(false)}
              data-testid={`nav-${label.toLowerCase()}`}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-[#2C4C3B] text-white shadow-sm"
                  : "text-[#7A8C83] hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon size={20} weight={isActive ? "fill" : "regular"} />
              <span className="font-manrope text-sm font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-4 px-1">
          <div className="w-9 h-9 rounded-full bg-[#2C4C3B] flex items-center justify-center text-white text-sm font-semibold font-outfit shrink-0">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium font-manrope truncate">{user?.name}</p>
            <p className="text-[#7A8C83] text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          data-testid="logout-button"
          className="flex items-center gap-2 text-[#7A8C83] hover:text-white transition-colors text-sm font-manrope w-full px-1 py-2 rounded-lg hover:bg-white/5"
        >
          <SignOut size={16} />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-[#F7F5F0]">
      {/* Desktop sidebar */}
      <aside className="w-64 bg-[#1A2421] flex flex-col fixed h-full z-30 hidden md:flex">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 bg-[#1A2421] flex flex-col h-full z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="md:ml-64 flex-1 min-h-screen flex flex-col">
        {/* Sticky header */}
        <header className="sticky top-0 z-20 bg-[#F7F5F0]/90 backdrop-blur-xl border-b border-[#D1CDC3]/60 px-4 md:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-[#4A5D54] hover:text-[#1A2421]"
              onClick={() => setMobileOpen(true)}
            >
              <List size={22} />
            </button>
            <span className="text-xs font-manrope font-semibold tracking-wider uppercase bg-[#C05746]/10 text-[#C05746] border border-[#C05746]/20 rounded-full px-3 py-1">
              Simulation Only — Not Real Money
            </span>
          </div>
          <div className="text-sm text-[#4A5D54] font-manrope hidden sm:block">
            Virtual Balance:{" "}
            <span className="font-semibold text-[#1A2421] font-mono" data-testid="header-balance">
              ${(user?.balance ?? 10000).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
