"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { paymentService } from "@/services/payment.service";

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<PaymentSuccessLoading />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}

function PaymentSuccessContent() {
  const params = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "success" | "failed">(
    "verifying",
  );
  const [courseId, setCourseId] = useState<number | null>(null);

  useEffect(() => {
    const queryRef =
      params.get("trx_ref") ??
      params.get("tx_ref") ??
      params.get("transaction_id");
    const storedRef =
      typeof window !== "undefined"
        ? localStorage.getItem("pending_chapa_transaction_id")
        : null;
    const storedStartedAt =
      typeof window !== "undefined"
        ? Number(localStorage.getItem("pending_chapa_started_at") ?? 0)
        : 0;
    const storedRefIsFresh =
      storedRef !== null && storedStartedAt > 0
        ? Date.now() - storedStartedAt < 30 * 60 * 1000
        : false;
    const trxRef = queryRef ?? (storedRefIsFresh ? storedRef : null);

    if (!trxRef) {
      setStatus("failed");
      return;
    }

    let cancelled = false;
    let retryTimer: number | undefined;
    let attempts = 0;
    const maxRetries = 6;

    const verifyPayment = async () => {
      try {
        const res = await paymentService.verify(trxRef);
        if (cancelled) return;

        if (res.enrolled) {
          setStatus("success");
          setCourseId(res.payment?.course_id ?? null);
          localStorage.removeItem("pending_chapa_transaction_id");
          localStorage.removeItem("pending_chapa_course_id");
          localStorage.removeItem("pending_chapa_started_at");
          return;
        }

        if (res.payment?.status === "pending" && attempts < maxRetries) {
          attempts += 1;
          retryTimer = window.setTimeout(verifyPayment, 2000);
          return;
        }

        localStorage.removeItem("pending_chapa_transaction_id");
        localStorage.removeItem("pending_chapa_course_id");
        localStorage.removeItem("pending_chapa_started_at");
        setStatus("failed");
      } catch {
        localStorage.removeItem("pending_chapa_transaction_id");
        localStorage.removeItem("pending_chapa_course_id");
        localStorage.removeItem("pending_chapa_started_at");
        if (!cancelled) setStatus("failed");
      }
    };

    verifyPayment();

    return () => {
      cancelled = true;
      if (retryTimer !== undefined) {
        window.clearTimeout(retryTimer);
      }
    };
  }, [params]);

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-3xl p-10 text-center max-w-md w-full shadow-glass"
      >
        {status === "verifying" && (
          <>
            <Loader2 className="w-14 h-14 mx-auto mb-4 text-brand-400 animate-spin" />
            <h1 className="text-xl font-bold text-white mb-2">
              Verifying Payment
            </h1>
            <p className="text-slate-400 text-sm">
              Please wait while we confirm your Chapa payment…
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
              className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Payment Successful!
            </h1>
            <p className="text-slate-400 text-sm mb-8">
              You&apos;re enrolled. Your learning roadmap is ready.
            </p>
            <div className="flex flex-col gap-3">
              {courseId && (
                <Link
                  href={`/courses/${courseId}`}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-500 text-white font-medium hover:shadow-glow transition-all"
                >
                  <Sparkles className="w-4 h-4" /> Start Learning
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              <Link
                href="/dashboard"
                className="px-6 py-3 rounded-xl glass text-slate-300 text-sm hover:text-white transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="w-20 h-20 rounded-full bg-rose-500/15 border-2 border-rose-500/40 flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">✕</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Payment Failed
            </h1>
            <p className="text-slate-400 text-sm mb-8">
              Something went wrong. Please try again.
            </p>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass text-slate-300 hover:text-white transition-colors"
            >
              Back to Courses
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
}

function PaymentSuccessLoading() {
  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="glass rounded-3xl p-10 text-center max-w-md w-full shadow-glass">
        <Loader2 className="w-14 h-14 mx-auto mb-4 text-brand-400 animate-spin" />
        <h1 className="text-xl font-bold text-white mb-2">
          Loading Payment Status
        </h1>
        <p className="text-slate-400 text-sm">
          Please wait while we load your payment result…
        </p>
      </div>
    </div>
  );
}
