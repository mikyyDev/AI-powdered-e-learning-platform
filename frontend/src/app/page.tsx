"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, BookOpen, Brain, MessageSquare, TrendingUp, Shield, Zap, ChevronRight, Star } from "lucide-react";
import Navbar from "@/components/layout/Navbar";

const FEATURES = [
  { icon: Brain, title: "AI-Powered Learning", desc: "Grok AI analyzes your progress and suggests the perfect next step, adapting to your unique learning style.", color: "from-violet-500 to-purple-600" },
  { icon: BookOpen, title: "Roadmap UI", desc: "Visual learning paths show exactly where you are, what's unlocked, and how far you've come — no guesswork.", color: "from-blue-500 to-indigo-600" },
  { icon: MessageSquare, title: "Real-time Chat", desc: "Connect with instructors and fellow learners through live chat with file sharing support.", color: "from-emerald-500 to-teal-600" },
  { icon: Shield, title: "Secure Payments", desc: "Pay with Chapa — the trusted Ethiopian payment gateway. ETB supported natively.", color: "from-amber-500 to-orange-600" },
  { icon: TrendingUp, title: "Track Progress", desc: "Watch your completion percentage climb. Every lesson completed unlocks the next one automatically.", color: "from-rose-500 to-pink-600" },
  { icon: Zap, title: "Instant Enrollment", desc: "Free courses enroll you instantly. Paid courses unlock after secure Chapa payment.", color: "from-cyan-500 to-sky-600" },
];

const STATS = [
  { value: "500+", label: "Courses" },
  { value: "12K+", label: "Learners" },
  { value: "98%", label: "Satisfaction" },
  { value: "200+", label: "Instructors" },
];

const fade = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } };

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-dark-900 overflow-x-hidden">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 px-4">
        {/* Background glows */}
        <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-brand-500/8 rounded-full blur-3xl pointer-events-none animate-pulse-slow" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-indigo-500/6 rounded-full blur-3xl pointer-events-none animate-pulse-slow" style={{ animationDelay: "2s" }} />

        <div className="relative max-w-4xl mx-auto text-center space-y-8">
          <motion.div initial="hidden" animate="show" variants={fade} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-brand-300 border border-brand-500/20 mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Powered by Grok AI · Payments via Chapa
            </span>
          </motion.div>

          <motion.h1
            initial="hidden" animate="show" variants={fade} transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight"
          >
            Learn Smarter with{" "}
            <span className="gradient-text">AI-Guided</span>{" "}
            Paths
          </motion.h1>

          <motion.p
            initial="hidden" animate="show" variants={fade} transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            Master new skills through intelligent roadmaps that adapt to you. Every lesson
            unlocks the next. Your progress, your pace — guided by AI.
          </motion.p>

          <motion.div
            initial="hidden" animate="show" variants={fade} transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/register"
              className="group flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-500 to-indigo-500 text-white font-semibold text-lg shadow-glow hover:shadow-glow hover:scale-105 transition-all duration-200"
            >
              Start Learning Free
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/courses"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl glass text-slate-200 font-medium text-lg hover:border-brand-500/30 transition-all"
            >
              Browse Courses
            </Link>
          </motion.div>

          {/* Star ratings */}
          <motion.div
            initial="hidden" animate="show" variants={fade} transition={{ duration: 0.5, delay: 0.4 }}
            className="flex items-center justify-center gap-2 text-sm text-slate-500"
          >
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span>Trusted by 12,000+ learners in Ethiopia and beyond</span>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 border-y border-white/5">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl md:text-4xl font-extrabold gradient-text">{s.value}</div>
              <div className="text-sm text-slate-500 mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Everything you need to <span className="gradient-text">level up</span></h2>
            <p className="text-slate-400 max-w-xl mx-auto">A complete learning ecosystem built for modern students and professionals.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="glass glass-hover rounded-2xl p-6 group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap Preview */}
      <section className="py-24 px-4 bg-card-glow">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
            <h2 className="text-4xl font-bold mb-4">Visual <span className="gradient-text">Learning Roadmap</span></h2>
            <p className="text-slate-400 mb-12">See your entire learning journey at a glance. Locked, in progress, and completed — always clear.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass rounded-3xl p-8 max-w-sm mx-auto"
          >
            {[
              { label: "Introduction to Python", state: "completed", order: 1 },
              { label: "Variables & Data Types", state: "completed", order: 2 },
              { label: "Control Flow", state: "current", order: 3 },
              { label: "Functions & Modules", state: "locked", order: 4 },
              { label: "OOP Concepts", state: "locked", order: 5 },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 mb-2 last:mb-0">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all
                    ${item.state === "completed" ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" :
                      item.state === "current" ? "bg-brand-500/20 border-brand-500 text-brand-300 shadow-glow-sm animate-pulse" :
                      "bg-dark-600 border-dark-400 text-slate-600"}`}>
                    {item.state === "completed" ? "✓" : item.state === "locked" ? "🔒" : item.order}
                  </div>
                  {i < 4 && <div className={`w-0.5 h-6 mt-1 ${item.state === "completed" ? "bg-emerald-500/40" : "bg-dark-500"}`} />}
                </div>
                <span className={`text-sm font-medium ${item.state === "locked" ? "text-slate-600" : item.state === "current" ? "text-white" : "text-slate-400"}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <motion.div
          initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-4xl font-bold mb-4">Ready to start your journey?</h2>
          <p className="text-slate-400 mb-8">Join thousands of learners already growing on LearnPath.</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl bg-gradient-to-r from-brand-500 to-indigo-500 text-white font-semibold text-lg shadow-glow hover:shadow-glow hover:scale-105 transition-all"
          >
            <Sparkles className="w-5 h-5" />
            Create Free Account
          </Link>
        </motion.div>
      </section>

      <footer className="border-t border-white/5 py-8 text-center text-slate-600 text-sm">
        © 2025 LearnPath · Built for Ethiopia, open to the world.
      </footer>
    </div>
  );
}
