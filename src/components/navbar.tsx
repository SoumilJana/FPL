"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, CalendarDays, LayoutDashboard, ShieldCheck, LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTournament } from "@/context/TournamentContext";
import { useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const { isAdmin, loginAdmin, logoutAdmin } = useTournament();
  const [showLogin, setShowLogin] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginAdmin(username, password)) {
      setShowLogin(false);
      setUsername("");
      setPassword("");
      setError(false);
    } else {
      setError(true);
    }
  };

  const navLinks = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/matches", label: "Matches", icon: CalendarDays },
    { href: "/brackets", label: "Brackets", icon: Trophy },
  ];

  return (
    <nav className="bg-slate-900/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-2 text-emerald-400 font-bold text-xl tracking-wider">
            <Trophy className="w-6 h-6" />
            <span>FPL</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Admin Button */}
          {isAdmin ? (
            <button
              onClick={logoutAdmin}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-lg text-sm font-medium transition-colors border border-rose-500/20"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          ) : (
            <button
              onClick={() => setShowLogin(!showLogin)}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]"
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Admin</span>
            </button>
          )}

          {/* Mobile Hamburger */}
          <button
            className="md:hidden text-slate-400 hover:text-white"
            onClick={() => setMobileMenu(!mobileMenu)}
          >
            {mobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Login Dropdown */}
          {showLogin && !isAdmin && (
            <div className="absolute top-16 right-4 w-72 bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-2xl z-50">
              <form onSubmit={handleLogin} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={cn(
                      "w-full bg-slate-950 border rounded-lg px-3 py-2 text-sm text-slate-200 outline-none transition-colors",
                      error ? "border-rose-500/50 focus:border-rose-500" : "border-slate-700 focus:border-emerald-500"
                    )}
                    placeholder="Username"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn(
                      "w-full bg-slate-950 border rounded-lg px-3 py-2 text-sm text-slate-200 outline-none transition-colors",
                      error ? "border-rose-500/50 focus:border-rose-500" : "border-slate-700 focus:border-emerald-500"
                    )}
                    placeholder="Password"
                  />
                  {error && <p className="text-rose-400 text-xs mt-1">Invalid credentials</p>}
                </div>
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg py-2 text-sm font-medium transition-colors"
                >
                  Unlock Admin
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Nav Menu */}
      {mobileMenu && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900/95 backdrop-blur-md px-4 py-3 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenu(false)}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
