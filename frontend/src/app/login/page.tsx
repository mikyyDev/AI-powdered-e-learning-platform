"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Sparkles, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { getErrorMessage } from "@/lib/utils";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [returnTo] = useState(() => {
    if (typeof window === "undefined") return "/dashboard";
    const next = new URLSearchParams(window.location.search).get("next");
    return next && next.startsWith("/") ? next : "/dashboard";
  });
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      router.push(returnTo);
    } catch (err: any) {
      toast.error(getErrorMessage(err, "Invalid credentials"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-brand-500/6 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-500 flex items-center justify-center shadow-glow">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-slate-400 text-sm mt-1">
            Sign in to continue your learning journey
          </p>
        </div>

        <div className="glass rounded-2xl p-8 shadow-glass">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              required
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full glass rounded-xl pl-10 pr-10 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={loading}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-brand-300 hover:text-brand-200 font-medium transition-colors"
            >
              Create one free
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
