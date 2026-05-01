"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Download, Award, Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { courseService } from "@/services/course.service";
import { type CourseRoadmap } from "@/types";

export default function CertificatePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user, initialize } = useAuth();
  const [course, setCourse] = useState<CourseRoadmap | null>(null);
  const certRef = useRef<HTMLDivElement>(null);

  useEffect(() => { initialize(); }, [initialize]);
  useEffect(() => {
    if (!user) return;
    courseService.roadmap(Number(courseId)).then(setCourse);
  }, [courseId, user]);

  async function downloadCert() {
    if (!certRef.current) return;
    const { default: html2canvas } = await import("html2canvas" as any).catch(() => ({ default: null }));
    if (!html2canvas) { window.print(); return; }
    const canvas = await html2canvas(certRef.current, { scale: 2, backgroundColor: "#04040d" });
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `certificate-${courseId}.png`;
    a.click();
  }

  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />

      <div className="relative w-full max-w-3xl">
        <Link href={`/courses/${courseId}`} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to course
        </Link>

        {/* Certificate card */}
        <motion.div ref={certRef} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="relative bg-gradient-to-br from-dark-700 via-dark-800 to-dark-700 rounded-3xl p-12 text-center border border-brand-500/20 shadow-[0_0_80px_rgba(103,65,255,0.15)] overflow-hidden">

          {/* Decorative corner borders */}
          <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-brand-500/40 rounded-tl-xl" />
          <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-brand-500/40 rounded-tr-xl" />
          <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-brand-500/40 rounded-bl-xl" />
          <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-brand-500/40 rounded-br-xl" />

          {/* Glow orbs */}
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative">
            {/* Logo */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-500 flex items-center justify-center shadow-glow">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">LearnPath</span>
            </div>

            <p className="text-slate-400 text-sm uppercase tracking-widest mb-2">Certificate of Completion</p>

            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-500/20 to-indigo-500/20 border-2 border-brand-500/40 flex items-center justify-center mx-auto my-6">
              <Award className="w-12 h-12 text-brand-300" />
            </div>

            <p className="text-slate-400 mb-3">This certifies that</p>
            <h1 className="text-4xl font-extrabold gradient-text mb-3">{user?.full_name || "Student"}</h1>
            <p className="text-slate-400 mb-2">has successfully completed</p>
            <h2 className="text-2xl font-bold text-white mb-8">{course?.title || "Course"}</h2>

            <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-brand-500/50 to-transparent mx-auto mb-6" />

            <p className="text-slate-500 text-sm">Issued on {today}</p>
            <p className="text-slate-600 text-xs mt-1">LearnPath · Powered by Grok AI</p>
          </div>
        </motion.div>

        <div className="flex justify-center mt-8">
          <button onClick={downloadCert}
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 to-indigo-500 text-white font-medium hover:shadow-glow transition-all">
            <Download className="w-4 h-4" /> Download Certificate
          </button>
        </div>
      </div>
    </div>
  );
}
