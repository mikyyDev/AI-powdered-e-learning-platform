"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Clock,
  BookOpen,
  ArrowRight,
  Sparkles,
  Target,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Badge from "@/components/ui/Badge";
import { courseService } from "@/services/course.service";
import { type Course } from "@/types";
import {
  CATEGORY_ICONS,
  LEVEL_COLORS,
  formatCurrency,
  cn,
  getErrorMessage,
  resolveMediaUrl,
} from "@/lib/utils";

const CATEGORIES: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "programming", label: "Programming" },
  { value: "design", label: "Design" },
  { value: "data_science", label: "Data Science" },
  { value: "devops", label: "DevOps" },
  { value: "business", label: "Business" },
  { value: "mobile", label: "Mobile" },
];

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filtered, setFiltered] = useState<Course[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const freeCount = courses.filter((course) => course.is_free).length;
  const paidCount = courses.length - freeCount;

  useEffect(() => {
    setLoading(true);
    setError(null);

    courseService
      .list()
      .then((data) => {
        setCourses(data);
        setFiltered(data);
      })
      .catch((err) => {
        setCourses([]);
        setFiltered([]);
        setError(getErrorMessage(err, "Failed to load courses"));
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let result = courses;
    if (category) result = result.filter((c) => c.category === category);
    if (search)
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(search.toLowerCase()) ||
          c.description.toLowerCase().includes(search.toLowerCase()),
      );
    setFiltered(result);
  }, [search, category, courses]);

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/10 px-3 py-1.5 text-xs font-medium text-brand-200 mb-4">
              <Target className="h-3.5 w-3.5" /> Roadmap learning paths
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Explore <span className="gradient-text">Courses</span>
            </h1>
            <p className="max-w-2xl text-slate-400 leading-relaxed">
              Discover your next skill. Courses are arranged as guided learning
              routes instead of traditional cards.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                <Sparkles className="h-3.5 w-3.5 text-brand-300" />{" "}
                {courses.length} paths
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                <Clock className="h-3.5 w-3.5 text-brand-300" /> {freeCount}{" "}
                free
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                <BookOpen className="h-3.5 w-3.5 text-brand-300" /> {paidCount}{" "}
                paid via Chapa
              </span>
            </div>
          </motion.div>

          {/* Search & Filter */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col sm:flex-row gap-4 mb-8"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                className="w-full glass rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition-all"
                placeholder="Search courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={cn(
                    "whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                    category === cat.value
                      ? "bg-gradient-to-r from-brand-500 to-indigo-500 text-white shadow-glow-sm"
                      : "glass text-slate-400 hover:text-white hover:border-brand-500/25",
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Roadmap list */}
          {loading ? (
            <div className="relative space-y-4">
              <div className="absolute left-7 top-2 bottom-2 hidden w-px bg-gradient-to-b from-brand-500/35 via-white/10 to-transparent lg:block" />
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="relative rounded-[28px] border border-white/5 bg-white/[0.03] px-5 py-6 pl-16 lg:pl-20"
                >
                  <div className="absolute left-4 top-6 h-10 w-10 rounded-full shimmer bg-white/5 lg:left-5 lg:h-12 lg:w-12" />
                  <div className="space-y-3">
                    <div className="h-3.5 w-40 rounded-full shimmer bg-white/5" />
                    <div className="h-4 w-3/5 rounded-full shimmer bg-white/5" />
                    <div className="h-3 w-11/12 rounded-full shimmer bg-white/5" />
                    <div className="flex gap-3 pt-2">
                      <div className="h-8 w-24 rounded-full shimmer bg-white/5" />
                      <div className="h-8 w-20 rounded-full shimmer bg-white/5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="glass rounded-3xl border border-rose-500/20 bg-rose-500/5 p-8 text-center max-w-2xl mx-auto">
              <p className="text-lg font-semibold text-white mb-2">
                Unable to load courses
              </p>
              <p className="text-sm text-slate-400 leading-relaxed">
                {error}. Check that the backend is running at{" "}
                <span className="text-slate-200">localhost:8000</span> and try
                again.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24 text-slate-500">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg">No courses found</p>
              <p className="text-sm mt-1">
                Try adjusting your search or filter
              </p>
            </div>
          ) : (
            <div className="relative space-y-4">
              <div className="absolute left-7 top-2 bottom-2 hidden w-px bg-gradient-to-b from-brand-500/35 via-white/10 to-transparent lg:block" />
              {filtered.map((course, i) => (
                <RoadmapCourseRow key={course.id} course={course} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RoadmapCourseRow({
  course,
  index,
}: {
  course: Course;
  index: number;
}) {
  const pathLabel = `Path ${String(index + 1).padStart(2, "0")}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <Link
        href={`/courses/${course.id}`}
        className="group relative block rounded-[28px] border border-white/5 bg-white/[0.03] px-5 py-5 pl-16 transition-all hover:border-brand-500/25 hover:bg-white/[0.05] lg:px-6 lg:pl-20"
      >
        <div className="absolute left-4 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-brand-500/30 bg-dark-900 text-xs font-bold text-white shadow-[0_0_0_8px_rgba(59,130,246,0.04)] lg:left-5 lg:h-12 lg:w-12">
          {String(index + 1).padStart(2, "0")}
        </div>

        <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={LEVEL_COLORS[course.level]}>
                {course.level}
              </Badge>
              <span className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
                {pathLabel}
              </span>
              <span
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.22em]",
                  course.is_free
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                    : "border-amber-500/20 bg-amber-500/10 text-amber-300",
                )}
              >
                {course.is_free ? "Free access" : "Paid via Chapa"}
              </span>
            </div>

            <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-start">
              <div className="hidden h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-white/5 bg-dark-800 md:block">
                {course.thumbnail ? (
                  <img
                    src={resolveMediaUrl(course.thumbnail)}
                    alt={course.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl">
                    {CATEGORY_ICONS[course.category] || "📚"}
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <h3 className="text-xl font-semibold text-white transition-colors group-hover:text-brand-300">
                  {course.title}
                </h3>
                <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-relaxed text-slate-400">
                  {course.short_description || course.description}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-1.5 capitalize">
                <BookOpen className="h-4 w-4 text-brand-400" />
                {course.category.replace("_", " ")}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-brand-400" />
                {course.estimated_hours}h roadmap
              </span>
              <span className="flex items-center gap-1.5 font-medium text-brand-200">
                <Sparkles className="h-4 w-4" />
                {course.is_free
                  ? "Starts instantly"
                  : formatCurrency(course.price, course.currency)}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 xl:pl-6">
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Open route
              </p>
              <p className="mt-1 text-sm font-medium text-white">
                Step into the roadmap
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-brand-500/25 bg-brand-500/10 text-brand-200 transition-all group-hover:translate-x-0.5 group-hover:bg-brand-500/20 group-hover:text-white">
              <ArrowRight className="h-5 w-5" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
