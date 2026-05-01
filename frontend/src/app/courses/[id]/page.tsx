"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Lock,
  PlayCircle,
  ChevronRight,
  Clock,
  BookOpen,
  TrendingUp,
  Sparkles,
  ArrowLeft,
  Users,
  Zap,
  Award,
  Star,
  Paperclip,
  ExternalLink,
  PhoneCall,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { courseService } from "@/services/course.service";
import { paymentService } from "@/services/payment.service";
import { callService } from "@/services/call.service";
import { aiService } from "@/services/ai.service";
import { type CourseRoadmap, type LessonWithProgress } from "@/types";
import api from "@/lib/api";
import {
  LEVEL_COLORS,
  CATEGORY_ICONS,
  formatCurrency,
  cn,
  getErrorMessage,
  resolveMediaUrl,
} from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

export default function CourseRoadmapPage() {
  const { id } = useParams<{ id: string }>();
  const [roadmap, setRoadmap] = useState<CourseRoadmap | null>(null);
  const [aiTip, setAiTip] = useState("");
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [activeLesson, setActiveLesson] = useState<LessonWithProgress | null>(
    null,
  );
  const [hasAutoOpenedLesson, setHasAutoOpenedLesson] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [myReview, setMyReview] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [hoverStar, setHoverStar] = useState(0);
  const [startingCall, setStartingCall] = useState(false);
  const [unenrolling, setUnenrolling] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(`/courses/${id}`)}`);
      return;
    }

    setLoading(true);
    setRoadmap(null);
    setAiTip("");
    setActiveLesson(null);
    setHasAutoOpenedLesson(false);

    if (!id) return;
    courseService
      .roadmap(Number(id))
      .then((data) => {
        setRoadmap(data);
        if (data.is_enrolled) {
          aiService.learningPath(Number(id)).then((tip) => setAiTip(tip.tip));
        }
      })
      .catch((err: any) => {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          router.replace(`/login?next=${encodeURIComponent(`/courses/${id}`)}`);
          return;
        }

        toast.error(getErrorMessage(err, "Failed to load course"));
      })
      .finally(() => setLoading(false));
  }, [authLoading, id, router, user]);

  useEffect(() => {
    if (!roadmap) return;

    if (!roadmap.is_enrolled) {
      setHasAutoOpenedLesson(false);
      return;
    }

    if (hasAutoOpenedLesson || activeLesson) return;

    const firstAvailableLesson =
      roadmap.lessons.find((lesson) => lesson.is_unlocked) ??
      roadmap.lessons[0] ??
      null;
    if (firstAvailableLesson) {
      setActiveLesson(firstAvailableLesson);
      setHasAutoOpenedLesson(true);
    }
  }, [roadmap, activeLesson, hasAutoOpenedLesson]);

  async function handleEnroll() {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/courses/${id}`)}`);
      return;
    }
    setEnrolling(true);
    try {
      const res = await paymentService.initiate(Number(id));
      if (res.checkout_url) {
        if (typeof window !== "undefined") {
          localStorage.setItem("pending_chapa_transaction_id", res.transaction_id);
          localStorage.setItem("pending_chapa_course_id", String(id));
          localStorage.setItem("pending_chapa_started_at", String(Date.now()));
        }
        window.location.href = res.checkout_url;
      } else {
        if (typeof window !== "undefined") {
          localStorage.removeItem("pending_chapa_transaction_id");
          localStorage.removeItem("pending_chapa_course_id");
          localStorage.removeItem("pending_chapa_started_at");
        }
        toast.success("Enrolled successfully!");
        const updated = await courseService.roadmap(Number(id));
        setRoadmap(updated);
      }
    } catch (err: any) {
      toast.error(getErrorMessage(err, "Enrollment failed"));
    } finally {
      setEnrolling(false);
    }
  }

  async function handleStartInstructorCall() {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/courses/${id}`)}`);
      return;
    }
    if (!roadmap) return;

    setStartingCall(true);
    try {
      const call = await callService.initiate({
        callee_id: roadmap.teacher_id,
        course_id: roadmap.id,
      });
      toast.success("Call started");
      router.push(`/call/${call.id}`);
    } catch (err: any) {
      toast.error(getErrorMessage(err, "Failed to start call"));
    } finally {
      setStartingCall(false);
    }
  }

  async function handleUnenroll() {
    if (!roadmap || !roadmap.is_enrolled) return;
    if (
      !window.confirm(
        "Unenroll from this free course? You can enroll again later.",
      )
    ) {
      return;
    }

    setUnenrolling(true);
    try {
      await courseService.unenroll(Number(id));
      toast.success("You have been unenrolled.");
      const updated = await courseService.roadmap(Number(id));
      setRoadmap(updated);
      setActiveLesson(null);
      setHasAutoOpenedLesson(false);
      setAiTip("");
    } catch (err: any) {
      toast.error(getErrorMessage(err, "Unenroll failed"));
    } finally {
      setUnenrolling(false);
    }
  }

  async function submitRating() {
    if (!myRating) return;
    setSubmittingRating(true);
    try {
      await api.post("/ratings", {
        course_id: Number(id),
        stars: myRating,
        review: myReview || null,
      });
      toast.success("Rating submitted!");
    } catch (e: any) {
      toast.error(getErrorMessage(e, "Rating failed"));
    } finally {
      setSubmittingRating(false);
    }
  }

  async function handleCompleteLesson(lesson: LessonWithProgress) {
    if (!lesson.is_unlocked) return;
    await courseService.markProgress(lesson.id, !lesson.is_completed);
    const updated = await courseService.roadmap(Number(id));
    setRoadmap(updated);
    if (!lesson.is_completed) toast.success("Lesson completed! 🎉");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900">
        <Navbar />
        <div className="pt-32 flex justify-center">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!roadmap) return null;

  const activeLessonIndex = activeLesson
    ? roadmap.lessons.findIndex((lesson) => lesson.id === activeLesson.id)
    : -1;
  const nextUnlockedLesson =
    activeLessonIndex >= 0
      ? (roadmap.lessons
          .slice(activeLessonIndex + 1)
          .find((lesson) => lesson.is_unlocked) ?? null)
      : null;

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />

      <div className="pt-20">
        {/* Hero banner */}
        <div className="relative bg-gradient-to-r from-brand-900/50 via-dark-700 to-indigo-900/40 border-b border-white/5 py-12 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-hero-glow opacity-40 pointer-events-none" />
          <div className="max-w-6xl mx-auto relative">
            <Link
              href="/courses"
              className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to courses
            </Link>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl">
                    {CATEGORY_ICONS[roadmap.category]}
                  </span>
                  <Badge className={LEVEL_COLORS[roadmap.level]}>
                    {roadmap.level}
                  </Badge>
                  <Badge variant="info" className="capitalize">
                    {roadmap.category.replace("_", " ")}
                  </Badge>
                </div>
                <h1 className="text-3xl lg:text-4xl font-extrabold text-white mb-3">
                  {roadmap.title}
                </h1>
                <p className="text-slate-400 leading-relaxed max-w-2xl">
                  {roadmap.description}
                </p>

                <div className="flex flex-wrap gap-5 mt-6 text-sm text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-brand-400" />
                    {roadmap.estimated_hours}h total
                  </span>
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-brand-400" />
                    {roadmap.total_lessons} lessons
                  </span>
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-brand-400" />
                    {roadmap.progress_percent}% complete
                  </span>
                </div>
              </div>

              {/* Enroll card */}
              <div className="glass rounded-2xl p-6 min-w-[260px] shadow-glass space-y-4">
                {roadmap.thumbnail ? (
                  <div className="relative h-40 overflow-hidden rounded-xl border border-white/5 bg-dark-800">
                    <img
                      src={resolveMediaUrl(roadmap.thumbnail)}
                      alt={roadmap.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-900/40 to-transparent" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-full bg-brand-500/15 border border-brand-500/25 flex items-center justify-center mx-auto">
                    <span className="text-2xl">
                      {CATEGORY_ICONS[roadmap.category]}
                    </span>
                  </div>
                )}

                {roadmap.is_enrolled ? (
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                    </div>
                    <p className="font-semibold text-white mb-1">Enrolled</p>
                    <p className="text-xs text-slate-400 mb-4">
                      {roadmap.completed_lessons}/{roadmap.total_lessons}{" "}
                      lessons done
                    </p>
                    {/* Progress bar */}
                    <progress
                      value={roadmap.progress_percent}
                      max={100}
                      aria-label="Course progress"
                      className="w-full h-2 mb-2 overflow-hidden rounded-full bg-dark-500"
                    />
                    <p className="text-xs text-brand-300">
                      {roadmap.progress_percent}% complete
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="text-center mb-4">
                      <div className="text-3xl font-extrabold gradient-text mb-1">
                        {roadmap.is_free
                          ? "Free"
                          : formatCurrency(roadmap.price, roadmap.currency)}
                      </div>
                      <p className="text-xs text-slate-500">
                        {roadmap.is_free
                          ? "Enroll for free"
                          : "Pay securely via Chapa"}
                      </p>
                    </div>
                    <Button
                      onClick={handleEnroll}
                      isLoading={enrolling}
                      className="w-full"
                      size="lg"
                    >
                      {roadmap.is_free ? "Enroll Now — Free" : "Pay & Enroll"}
                    </Button>
                    {!roadmap.is_free && (
                      <p className="text-xs text-center text-slate-500 mt-3 flex items-center justify-center gap-1">
                        <Zap className="w-3 h-3" /> Powered by Chapa · ETB
                        supported
                      </p>
                    )}
                  </>
                )}

                {roadmap.is_enrolled && user?.id !== roadmap.teacher_id && (
                  <div className="space-y-3 mt-4">
                    {roadmap.is_free && (
                      <Button
                        onClick={handleUnenroll}
                        isLoading={unenrolling}
                        className="w-full"
                        variant="danger"
                      >
                        Unenroll
                      </Button>
                    )}

                    {roadmap.is_free ? null : (
                      <p className="text-xs text-slate-500 text-center leading-relaxed">
                        Paid enrollments stay in your payment history. Ask
                        support if you need help reversing a payment.
                      </p>
                    )}

                    <Button
                      onClick={handleStartInstructorCall}
                      isLoading={startingCall}
                      className="w-full"
                      variant="secondary"
                    >
                      <PhoneCall className="w-4 h-4" />
                      Start Live Call
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* AI Tip */}
        {aiTip && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto px-4 mt-6"
          >
            <div className="glass rounded-xl px-5 py-3 flex items-center gap-3 border border-brand-500/20">
              <Sparkles className="w-4 h-4 text-brand-400 shrink-0" />
              <p className="text-sm text-slate-300">
                <span className="text-brand-300 font-medium">Grok AI: </span>
                {aiTip}
              </p>
            </div>
          </motion.div>
        )}

        {/* Roadmap */}
        <div className="max-w-6xl mx-auto px-4 py-10">
          <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-400" />
            Learning Roadmap
          </h2>

          <div className="flex flex-col gap-0 max-w-2xl">
            {roadmap.lessons.map((lesson, i) => (
              <RoadmapNode
                key={lesson.id}
                lesson={lesson}
                index={i}
                isLast={i === roadmap.lessons.length - 1}
                isActive={activeLesson?.id === lesson.id}
                isEnrolled={roadmap.is_enrolled}
                onClick={() => {
                  if (lesson.is_unlocked)
                    setActiveLesson(
                      activeLesson?.id === lesson.id ? null : lesson,
                    );
                }}
                onComplete={() => handleCompleteLesson(lesson)}
              />
            ))}
          </div>
        </div>

        {/* Certificate banner */}
        {roadmap.is_enrolled && roadmap.progress_percent === 100 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto px-4 pb-6"
          >
            <div className="glass rounded-2xl p-6 border border-emerald-500/30 flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-brand-500/20 flex items-center justify-center shrink-0">
                <Award className="w-7 h-7 text-emerald-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white">Course Completed!</h3>
                <p className="text-sm text-slate-400 mt-0.5">
                  You have mastered this course. Download your certificate now.
                </p>
              </div>
              <Link
                href={`/certificate/${id}`}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium hover:shadow-lg transition-all shrink-0"
              >
                Get Certificate
              </Link>
            </div>
          </motion.div>
        )}

        {/* Rating section */}
        {roadmap.is_enrolled && (
          <div className="max-w-6xl mx-auto px-4 pb-16">
            <div className="glass rounded-2xl p-6">
              <h2 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" /> Rate this Course
              </h2>
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onMouseEnter={() => setHoverStar(s)}
                    onMouseLeave={() => setHoverStar(0)}
                    onClick={() => setMyRating(s)}
                    title={`Rate ${s} star${s > 1 ? "s" : ""}`}
                    aria-label={`Rate ${s} star${s > 1 ? "s" : ""}`}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={cn(
                        "w-7 h-7 transition-colors",
                        s <= (hoverStar || myRating)
                          ? "text-amber-400 fill-amber-400"
                          : "text-slate-600",
                      )}
                    />
                  </button>
                ))}
                {myRating > 0 && (
                  <span className="ml-2 text-sm text-amber-400 font-medium">
                    {myRating}/5
                  </span>
                )}
              </div>
              <textarea
                value={myReview}
                onChange={(e) => setMyReview(e.target.value)}
                rows={3}
                placeholder="Share your experience with this course (optional)…"
                className="glass rounded-xl w-full px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 resize-none mb-4 transition-all"
              />
              <button
                onClick={submitRating}
                disabled={!myRating || submittingRating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-500 text-white text-sm font-medium hover:shadow-glow-sm disabled:opacity-40 transition-all"
              >
                {submittingRating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Star className="w-4 h-4" />
                )}
                Submit Rating
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lesson drawer */}
      <AnimatePresence>
        {activeLesson && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 30 }}
            className="fixed top-0 right-0 h-full w-full max-w-lg bg-dark-800 border-l border-white/5 shadow-2xl z-40 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <Badge className="mb-3">Lesson {activeLesson.order}</Badge>
                  <h2 className="text-xl font-bold text-white">
                    {activeLesson.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveLesson(null)}
                  title="Close lesson drawer"
                  aria-label="Close lesson drawer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-5 text-xs text-slate-500">
                <span className="px-2.5 py-1 rounded-full glass">
                  {activeLesson.duration_minutes} min
                </span>
                {activeLesson.is_free_preview && (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400">
                    Free preview
                  </span>
                )}
                {activeLesson.video_url && (
                  <span className="px-2.5 py-1 rounded-full bg-brand-500/15 text-brand-300">
                    Video lesson
                  </span>
                )}
              </div>
              {activeLesson.description && (
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                  {activeLesson.description}
                </p>
              )}

              {activeLesson.video_url ? (
                <LessonVideo
                  url={activeLesson.video_url}
                  title={activeLesson.title}
                />
              ) : (
                <div className="glass rounded-xl p-6 mb-6 border border-white/5 text-center">
                  <PlayCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm font-medium text-white mb-1">
                    No video attached yet
                  </p>
                  <p className="text-xs text-slate-500">
                    The teacher has not added a video for this lesson.
                  </p>
                </div>
              )}

              {activeLesson.content && (
                <div className="glass rounded-xl p-5 text-sm text-slate-300 leading-relaxed mb-6 whitespace-pre-wrap">
                  {activeLesson.content}
                </div>
              )}

              {activeLesson.materials && activeLesson.materials.length > 0 && (
                <div className="glass rounded-xl p-5 mb-6 border border-white/5">
                  <div className="flex items-center gap-2 mb-4">
                    <Paperclip className="w-4 h-4 text-brand-400" />
                    <h3 className="text-sm font-semibold text-white">
                      Lesson materials
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {activeLesson.materials.map((material) => (
                      <a
                        key={material.id}
                        href={resolveMediaUrl(material.file_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between gap-3 glass rounded-xl px-3 py-3 hover:border-brand-500/20 transition-all"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {material.title}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {material.file_name}
                          </p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-brand-400 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {!activeLesson.content && (
                <div className="glass rounded-xl p-5 text-sm text-slate-500 leading-relaxed mb-6 border border-white/5">
                  No written notes yet. Ask your teacher to add lesson content
                  here.
                </div>
              )}

              {nextUnlockedLesson && (
                <Button
                  onClick={() => setActiveLesson(nextUnlockedLesson)}
                  className="w-full mb-3"
                  variant="secondary"
                >
                  Next Lesson: {nextUnlockedLesson.title}
                </Button>
              )}

              <Button
                onClick={() => handleCompleteLesson(activeLesson)}
                className="w-full"
                variant={activeLesson.is_completed ? "secondary" : "primary"}
              >
                {activeLesson.is_completed
                  ? "Mark as Incomplete"
                  : "Mark as Complete ✓"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LessonVideo({ url, title }: { url: string; title: string }) {
  const normalizedUrl = normalizeVideoUrl(url);
  const embedUrl = getEmbedUrl(normalizedUrl);
  const mediaUrl = resolveMediaUrl(normalizedUrl);

  if (embedUrl) {
    return (
      <div className="aspect-video rounded-xl overflow-hidden mb-6 border border-white/5 bg-black">
        <iframe
          src={embedUrl}
          title={title}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <video
      controls
      className="w-full aspect-video rounded-xl bg-black mb-6 border border-white/5"
      src={mediaUrl}
    >
      Your browser does not support the video tag.
    </video>
  );
}

function getEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host.includes("youtube.com") || host.includes("youtube-nocookie.com")) {
      const videoId =
        parsed.searchParams.get("v") ||
        (parsed.pathname.startsWith("/embed/")
          ? parsed.pathname.split("/embed/")[1]?.split("/")[0]
          : null) ||
        (parsed.pathname.startsWith("/shorts/")
          ? parsed.pathname.split("/shorts/")[1]?.split("/")[0]
          : null) ||
        (parsed.pathname.startsWith("/live/")
          ? parsed.pathname.split("/live/")[1]?.split("/")[0]
          : null);
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }

    if (host === "youtu.be") {
      const videoId = parsed.pathname.replace("/", "").split("/")[0];
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
  } catch {
    return null;
  }

  return null;
}

function normalizeVideoUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("/")
  ) {
    return trimmed;
  }

  if (
    trimmed.startsWith("youtube.com") ||
    trimmed.startsWith("youtu.be") ||
    trimmed.startsWith("www.youtube.com") ||
    trimmed.startsWith("m.youtube.com") ||
    trimmed.startsWith("music.youtube.com")
  ) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

function RoadmapNode({
  lesson,
  index,
  isLast,
  isActive,
  isEnrolled,
  onClick,
  onComplete,
}: {
  lesson: LessonWithProgress;
  index: number;
  isLast: boolean;
  isActive: boolean;
  isEnrolled: boolean;
  onClick: () => void;
  onComplete: () => void;
}) {
  const state = lesson.is_completed
    ? "completed"
    : lesson.is_unlocked
      ? "unlocked"
      : "locked";

  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07 }}
      className="flex gap-4"
    >
      {/* Timeline */}
      <div className="flex flex-col items-center">
        <motion.button
          whileHover={state !== "locked" ? { scale: 1.1 } : {}}
          whileTap={state !== "locked" ? { scale: 0.95 } : {}}
          onClick={onClick}
          className={cn(
            "w-11 h-11 rounded-full flex items-center justify-center border-2 font-bold text-sm transition-all shrink-0 z-10",
            state === "completed"
              ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.3)]"
              : state === "unlocked"
                ? "bg-brand-500/20 border-brand-500 text-brand-300 shadow-glow-sm"
                : "bg-dark-600 border-dark-400 text-slate-600 cursor-not-allowed",
          )}
        >
          {state === "completed" ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : state === "locked" ? (
            <Lock className="w-4 h-4" />
          ) : (
            <PlayCircle className="w-5 h-5" />
          )}
        </motion.button>
        {!isLast && (
          <div
            className={cn(
              "w-0.5 flex-1 my-1 min-h-[32px]",
              state === "completed"
                ? "bg-gradient-to-b from-emerald-500/60 to-emerald-500/10"
                : "bg-dark-500",
            )}
          />
        )}
      </div>

      {/* Content */}
      <div className={cn("flex-1 pb-6", isLast && "pb-2")}>
        <motion.div
          animate={isActive ? { scale: 1.01 } : { scale: 1 }}
          className={cn(
            "glass rounded-xl p-4 cursor-pointer transition-all",
            state === "locked" && "opacity-50 cursor-not-allowed",
            isActive && "border-brand-500/30 shadow-glow-sm",
            state === "unlocked" && !isActive && "hover:border-brand-500/20",
          )}
          onClick={onClick}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-slate-500 font-medium">
                  Step {lesson.order}
                </span>
                {lesson.is_free_preview && (
                  <Badge variant="success" className="text-[10px] py-0">
                    Preview
                  </Badge>
                )}
              </div>
              <h3
                className={cn(
                  "font-semibold text-sm leading-snug",
                  state === "completed"
                    ? "text-emerald-400"
                    : state === "unlocked"
                      ? "text-white"
                      : "text-slate-600",
                )}
              >
                {lesson.title}
              </h3>
              {lesson.description && (
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {lesson.description}
                </p>
              )}
            </div>

            {lesson.duration_minutes > 0 && (
              <span className="text-xs text-slate-500 flex items-center gap-1 shrink-0">
                <Clock className="w-3 h-3" />
                {lesson.duration_minutes}m
              </span>
            )}
          </div>

          {isActive && state !== "locked" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between"
            >
              <span className="text-xs text-brand-300">
                Click to open lesson
              </span>
              <ChevronRight className="w-4 h-4 text-brand-400" />
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
