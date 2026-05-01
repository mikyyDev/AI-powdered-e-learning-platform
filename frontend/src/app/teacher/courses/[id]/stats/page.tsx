"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Users, Star, TrendingUp, BookOpen, BarChart2 } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

interface Stats {
  course_id: number;
  total_students: number;
  avg_rating: number;
  total_ratings: number;
  completion_rate: number;
}

interface CourseInfo {
  id: number;
  title: string;
  is_published: boolean;
  price: number;
  level: string;
}

interface Rating {
  id: number;
  stars: number;
  review: string | null;
  created_at: string;
  user: { id: number; full_name: string } | null;
}

function StarRow({ stars }: { stars: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn("w-3.5 h-3.5", s <= stars ? "text-amber-400 fill-amber-400" : "text-slate-600")}
        />
      ))}
    </div>
  );
}

export default function CourseStatsPage() {
  const { id } = useParams<{ id: string }>();
  const [stats, setStats] = useState<Stats | null>(null);
  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);

  useEffect(() => {
    api.get(`/teacher/courses/${id}/stats`).then((r) => setStats(r.data));
    api.get(`/courses/${id}/roadmap`).then((r) => setCourse(r.data));
    api.get(`/ratings/course/${id}`).then((r) => setRatings(r.data)).catch(() => {});
  }, [id]);

  if (!stats || !course) return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const statCards = [
    { label: "Students Enrolled", value: stats.total_students, icon: Users, color: "text-brand-400", bg: "bg-brand-500/10" },
    { label: "Average Rating", value: stats.avg_rating.toFixed(1), icon: Star, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Completion Rate", value: `${stats.completion_rate}%`, icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Total Reviews", value: stats.total_ratings, icon: BarChart2, color: "text-indigo-400", bg: "bg-indigo-500/10" },
  ];

  const starDist = [5, 4, 3, 2, 1].map((s) => ({
    stars: s,
    count: ratings.filter((r) => r.stars === s).length,
  }));

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <div className="pt-24 pb-16 px-4 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Link href="/teacher" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <BookOpen className="w-5 h-5 text-brand-400" />
              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                course.is_published ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400")}>
                {course.is_published ? "Published" : "Draft"}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white">{course.title}</h1>
            <p className="text-slate-500 text-sm mt-1 capitalize">{course.level} · {course.price === 0 ? "Free" : `${course.price} ETB`}</p>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {statCards.map(({ label, value, icon: Icon, color, bg }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="glass rounded-2xl p-5"
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", bg)}>
                  <Icon className={cn("w-5 h-5", color)} />
                </div>
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              </motion.div>
            ))}
          </div>

          {/* Rating distribution */}
          {stats.total_ratings > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="glass rounded-2xl p-6 mb-8">
              <h2 className="text-base font-semibold text-white mb-5">Rating Distribution</h2>
              <div className="flex items-center gap-6">
                {/* Big rating number */}
                <div className="text-center shrink-0">
                  <p className="text-5xl font-extrabold gradient-text">{stats.avg_rating.toFixed(1)}</p>
                  <StarRow stars={Math.round(stats.avg_rating)} />
                  <p className="text-xs text-slate-500 mt-1">{stats.total_ratings} reviews</p>
                </div>
                {/* Bars */}
                <div className="flex-1 space-y-2">
                  {starDist.map(({ stars, count }) => {
                    const pct = stats.total_ratings > 0 ? (count / stats.total_ratings) * 100 : 0;
                    return (
                      <div key={stars} className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 w-4 text-right">{stars}</span>
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                        <div className="flex-1 h-2 bg-dark-700 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 w-6">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Reviews list */}
          {ratings.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <h2 className="text-base font-semibold text-white mb-4">Student Reviews</h2>
              <div className="space-y-3">
                {ratings.map((r) => (
                  <div key={r.id} className="glass rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                          {r.user?.full_name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <span className="text-sm font-medium text-white">{r.user?.full_name ?? "Student"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StarRow stars={r.stars} />
                        <span className="text-xs text-slate-500">
                          {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                    {r.review && <p className="text-sm text-slate-300 leading-relaxed">{r.review}</p>}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {ratings.length === 0 && (
            <div className="glass rounded-2xl p-12 text-center">
              <Star className="w-10 h-10 mx-auto mb-3 text-slate-700" />
              <p className="text-slate-400 font-medium">No reviews yet</p>
              <p className="text-slate-600 text-sm mt-1">Students who complete the course can leave a review</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
