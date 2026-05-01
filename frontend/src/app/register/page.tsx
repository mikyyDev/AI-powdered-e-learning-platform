"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  User,
  Sparkles,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import toast from "react-hot-toast";
import { authService } from "@/services/auth.service";
import { useAuth } from "@/hooks/useAuth";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { cn, getErrorMessage } from "@/lib/utils";

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: "",
    username: "",
    full_name: "",
    password: "",
    role: "student",
  });
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const router = useRouter();

  const update = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const tokens = await authService.register(form);
      authService.saveTokens(tokens);
      setUser(tokens.user);
      toast.success("Account created! Welcome to LearnPath 🎉");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(getErrorMessage(err, "Registration failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-500 flex items-center justify-center shadow-glow">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-slate-400 text-sm mt-1">
            Start learning for free today
          </p>
        </div>

        <div className="glass rounded-2xl p-8 shadow-glass">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role selector */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  value: "student",
                  label: "I want to learn",
                  icon: GraduationCap,
                },
                { value: "teacher", label: "I want to teach", icon: BookOpen },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, role: value }))}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-sm font-medium",
                    form.role === value
                      ? "bg-brand-500/15 border-brand-500/40 text-white"
                      : "glass border-white/5 text-slate-400 hover:border-white/15",
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </button>
              ))}
            </div>

            <Input
              label="Full name"
              placeholder="Abebe Bikila"
              value={form.full_name}
              onChange={update("full_name")}
              icon={<User className="w-4 h-4" />}
              required
            />
            <Input
              label="Username"
              placeholder="abebe_b"
              value={form.username}
              onChange={update("username")}
              icon={<span className="text-xs">@</span>}
              required
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={update("email")}
              icon={<Mail className="w-4 h-4" />}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={update("password")}
              icon={<Lock className="w-4 h-4" />}
              required
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={loading}
            >
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-brand-300 hover:text-brand-200 font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
