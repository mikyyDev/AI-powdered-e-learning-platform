"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  Clock,
  ChevronRight,
  CreditCard,
  PhoneCall,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { courseService } from "@/services/course.service";
import { aiService } from "@/services/ai.service";
import { paymentService } from "@/services/payment.service";
import { callService } from "@/services/call.service";
import {
  type Enrollment,
  type AIRecommendation,
  type Payment,
  type Call,
} from "@/types";
import {
  CATEGORY_ICONS,
  LEVEL_COLORS,
  formatCurrency,
  getInitials,
} from "@/lib/utils";
import Badge from "@/components/ui/Badge";

export default function DashboardPage() {
  const router = useRouter();
  const { user, initialize, isLoading } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>(
    [],
  );
  const [payments, setPayments] = useState<Payment[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [joiningCallId, setJoiningCallId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      courseService.myEnrollments().catch(() => []),
      aiService.recommendations().catch(() => []),
      paymentService.myPayments().catch(() => []),
      callService.myCalls().catch(() => []),
    ])
      .then(([enr, recs, myPayments, myCalls]) => {
        setEnrollments(enr);
        setRecommendations(recs);
        setPayments(myPayments);
        setCalls(myCalls);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [user]);

  async function openCall(call: Call) {
    if (call.status === "pending" && call.callee_id === user?.id) {
      setJoiningCallId(call.id);
      try {
        await callService.accept(call.id);
      } catch {
        // continue to the call page even if accept already happened or fails due to race
      } finally {
        setJoiningCallId(null);
      }
    }

    router.push(`/call/${call.id}`);
  }

  function callPartnerName(call: Call) {
    const partner = call.caller_id === user?.id ? call.callee : call.caller;
    return (
      partner?.full_name ||
      `User #${call.caller_id === user?.id ? call.callee_id : call.caller_id}`
    );
  }

  function statusClasses(status: Call["status"] | Payment["status"]) {
    if (status === "success" || status === "active")
      return "bg-emerald-500/20 text-emerald-400";
    if (status === "pending") return "bg-amber-500/20 text-amber-400";
    if (status === "failed" || status === "declined")
      return "bg-rose-500/20 text-rose-400";
    if (status === "refunded" || status === "ended")
      return "bg-slate-500/20 text-slate-300";
    return "bg-brand-500/20 text-brand-400";
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center text-slate-400">
        <div className="glass rounded-2xl px-6 py-4 text-sm">
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center text-slate-400">
        <div className="glass rounded-2xl px-6 py-4 text-sm">
          Please log in to access dashboard
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: "Enrolled Courses",
      value: enrollments.length,
      icon: BookOpen,
      color: "from-brand-500 to-indigo-500",
    },
    {
      label: "AI Recommendations",
      value: recommendations.length,
      icon: Sparkles,
      color: "from-violet-500 to-purple-600",
    },
    {
      label: "Learning Streak",
      value: "7 days",
      icon: TrendingUp,
      color: "from-emerald-500 to-teal-600",
    },
  ];

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Welcome */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-indigo-500 flex items-center justify-center text-xl font-bold text-white shadow-glow">
                {getInitials(user.full_name)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Welcome back, {user.full_name?.split(" ")[0] || "User"} 👋
                </h1>
                <p className="text-slate-400 text-sm mt-0.5 capitalize">
                  {user.role || "User"} · {user.email || ""}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="glass rounded-2xl p-5 flex items-center gap-4"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-lg shrink-0`}
                >
                  <s.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-white">
                    {s.value}
                  </div>
                  <div className="text-xs text-slate-400">{s.label}</div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* My Courses */}
            <div className="lg:col-span-2">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-brand-400" /> My Courses
              </h2>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="glass rounded-xl h-20 shimmer" />
                  ))}
                </div>
              ) : enrollments.length === 0 ? (
                <div className="glass rounded-2xl p-10 text-center">
                  <BookOpen className="w-10 h-10 mx-auto mb-3 text-slate-600" />
                  <p className="text-slate-400 mb-4">
                    You haven&apos;t enrolled in any courses yet.
                  </p>
                  <Link
                    href="/courses"
                    className="text-brand-300 hover:text-brand-200 text-sm font-medium"
                  >
                    Browse courses →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {enrollments.map((enr, i) => (
                    <motion.div
                      key={enr.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                    >
                      <button
                        type="button"
                        onClick={() => router.push(`/courses/${enr.course_id}`)}
                        className="glass glass-hover rounded-xl p-4 w-full text-left group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/20 flex items-center justify-center text-xl shrink-0">
                            📚
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white text-sm truncate group-hover:text-brand-300 transition-colors">
                              Course #{enr.course_id}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Enrolled{" "}
                              {new Date(enr.enrolled_at).toLocaleDateString()}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-brand-400 group-hover:translate-x-1 transition-all" />
                        </div>
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Recommendations */}
            <div>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-400" /> Grok Recommends
              </h2>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="glass rounded-xl h-24 shimmer" />
                  ))}
                </div>
              ) : recommendations.length === 0 ? (
                <div className="glass rounded-2xl p-6 text-center text-slate-500 text-sm">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No recommendations yet
                </div>
              ) : (
                <div className="space-y-3">
                  {recommendations.map((rec, i) => (
                    <motion.div
                      key={rec.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                    >
                      <Link
                        href={`/courses/${rec.course_id}`}
                        className="glass glass-hover rounded-xl p-4 block group"
                      >
                        {rec.course && (
                          <>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">
                                {CATEGORY_ICONS[rec.course.category]}
                              </span>
                              <Badge className={LEVEL_COLORS[rec.course.level]}>
                                {rec.course.level}
                              </Badge>
                              <span className="ml-auto text-xs text-brand-300 font-medium">
                                {Math.round(rec.score * 100)}% match
                              </span>
                            </div>
                            <p className="text-sm font-medium text-white group-hover:text-brand-300 transition-colors line-clamp-2">
                              {rec.course.title}
                            </p>
                            {rec.reason && (
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                {rec.reason}
                              </p>
                            )}
                          </>
                        )}
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mt-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="glass rounded-2xl p-6"
            >
              <div className="flex items-center justify-between gap-3 mb-5">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-brand-400" /> Payment
                  History
                </h2>
                <span className="text-xs text-slate-500">
                  {payments.length} record{payments.length === 1 ? "" : "s"}
                </span>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="glass rounded-xl h-20 shimmer" />
                  ))}
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No payments yet
                </div>
              ) : (
                <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
                  {payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="glass glass-hover rounded-xl p-4 flex items-center gap-4"
                    >
                      <div className="w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/20 flex items-center justify-center shrink-0">
                        <CreditCard className="w-5 h-5 text-brand-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-white truncate">
                            Course #{payment.course_id}
                          </p>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${statusClasses(payment.status)}`}
                          >
                            {payment.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {formatCurrency(payment.amount, payment.currency)} ·{" "}
                          {payment.payment_method}
                        </p>
                        <p className="text-[11px] text-slate-600 mt-1">
                          {new Date(payment.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Link
                        href={`/courses/${payment.course_id}`}
                        className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
                        title="Open course"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
              className="glass rounded-2xl p-6"
            >
              <div className="flex items-center justify-between gap-3 mb-5">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <PhoneCall className="w-5 h-5 text-brand-400" /> Live Calls
                </h2>
                <span className="text-xs text-slate-500">
                  {calls.length} call{calls.length === 1 ? "" : "s"}
                </span>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="glass rounded-xl h-20 shimmer" />
                  ))}
                </div>
              ) : calls.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  <PhoneCall className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No calls yet
                </div>
              ) : (
                <div className="space-y-3">
                  {calls.slice(0, 5).map((call) => {
                    const partnerName = callPartnerName(call);
                    const canAccept =
                      call.status === "pending" && call.callee_id === user?.id;
                    const buttonLabel = canAccept
                      ? "Accept & Join"
                      : call.status === "active" || call.status === "pending"
                        ? "Join Call"
                        : "View Call";

                    return (
                      <div
                        key={call.id}
                        className="glass glass-hover rounded-xl p-4 flex items-center gap-4"
                      >
                        <div className="w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/20 flex items-center justify-center shrink-0">
                          <PhoneCall className="w-5 h-5 text-brand-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-white truncate">
                              {partnerName}
                            </p>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${statusClasses(call.status)}`}
                            >
                              {call.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {call.course_id
                              ? `Course #${call.course_id} · `
                              : ""}
                            {call.duration_seconds > 0
                              ? `${Math.floor(call.duration_seconds / 60)}m ${call.duration_seconds % 60}s`
                              : "No duration yet"}
                          </p>
                          <p className="text-[11px] text-slate-600 mt-1">
                            {new Date(call.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant={canAccept ? "primary" : "secondary"}
                          onClick={() => openCall(call)}
                          isLoading={joiningCallId === call.id}
                        >
                          {buttonLabel}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}