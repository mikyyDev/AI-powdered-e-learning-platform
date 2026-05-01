"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, LayoutDashboard, MessageSquare, LogOut, Sparkles, Menu, X, GraduationCap, UserCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { cn, getInitials } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "Chat", icon: MessageSquare },
];

export default function Navbar() {
  const { user, logout, initialize } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { initialize(); }, [initialize]);
  const isTeacher = user?.role === "teacher" || user?.role === "admin";

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-indigo-500 flex items-center justify-center shadow-glow-sm group-hover:shadow-glow transition-all">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base gradient-text">LearnPath</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={cn("flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all",
                pathname.startsWith(href) ? "text-white bg-brand-500/15 border border-brand-500/20" : "text-slate-400 hover:text-white hover:bg-white/5")}>
              <Icon className="w-4 h-4" />{label}
            </Link>
          ))}
          {isTeacher && (
            <Link href="/teacher"
              className={cn("flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all",
                pathname.startsWith("/teacher") ? "text-white bg-amber-500/15 border border-amber-500/20" : "text-slate-400 hover:text-white hover:bg-white/5")}>
              <GraduationCap className="w-4 h-4" />Teach
            </Link>
          )}
        </div>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                  {getInitials(user.full_name)}
                </div>
                <span className="text-sm text-slate-300">{user.full_name?.split(" ")[0] || ""}</span>
              </div>
              <Link href="/profile"
                className="p-2 rounded-lg text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 transition-all"
                title="Profile">
                <UserCircle className="w-4 h-4" />
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition-all">
                Sign in
              </Link>
              <Link
                href="/register"
                className="text-sm font-medium px-4 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-500 text-white hover:shadow-glow-sm transition-all"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden border-t border-white/5 bg-dark-800/95 backdrop-blur-xl px-4 py-4 space-y-1"
        >
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                pathname.startsWith(href)
                  ? "text-white bg-brand-500/15"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
          {!user && (
            <div className="pt-2 flex flex-col gap-2">
              <Link href="/login" onClick={() => setMenuOpen(false)} className="text-center px-4 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-white/5">Sign in</Link>
              <Link href="/register" onClick={() => setMenuOpen(false)} className="text-center px-4 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-brand-500 to-indigo-500 text-white">Get Started</Link>
            </div>
          )}
        </motion.div>
      )}
    </nav>
  );
}
