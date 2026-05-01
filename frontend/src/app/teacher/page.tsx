"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Users,
  Star,
  TrendingUp,
  Plus,
  Eye,
  EyeOff,
  Pencil,
  BarChart3,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { courseService } from "@/services/course.service";
import { type Course } from "@/types";
import {
  CATEGORY_ICONS,
  LEVEL_COLORS,
  formatCurrency,
  resolveMediaUrl,
} from "@/lib/utils";
import toast from "react-hot-toast";

interface DashboardData {
  total_courses: number;
  published_courses: number;
  draft_courses: number;
  total_students: number;
  courses: Course[];
}

export default function TeacherDashboard() {
  const { user, initialize } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingCourseId, setDeletingCourseId] = useState<number | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!user) return;
    api
      .get("/teacher/dashboard")
      .then((r) => {
        setData(r.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  async function togglePublish(course: Course) {
    try {
      await api.patch(`/courses/${course.id}`, {
        is_published: !course.is_published,
      });
      toast.success(
        course.is_published ? "Course unpublished" : "Course published!",
      );
      const r = await api.get("/teacher/dashboard");
      setData(r.data);
    } catch {
      toast.error("Failed to update");
    }
  }

  function requestDeleteCourse(course: Course) {
    setCourseToDelete(course);
  }

  async function confirmDeleteCourse() {
    if (!courseToDelete) return;

    setDeletingCourseId(courseToDelete.id);
    try {
      await courseService.deleteCourse(courseToDelete.id);
      toast.success("Course deleted");
      setCourseToDelete(null);
      const r = await api.get("/teacher/dashboard");
      setData(r.data);
    } catch {
      toast.error("Failed to delete course");
    } finally {
      setDeletingCourseId(null);
    }
  }

  const stats = data
    ? [
        {
          label: "Total Courses",
          value: data.total_courses,
          icon: BookOpen,
          color: "from-brand-500 to-indigo-500",
        },
        {
          label: "Published",
          value: data.published_courses,
          icon: Eye,
          color: "from-emerald-500 to-teal-500",
        },
        {
          label: "Drafts",
          value: data.draft_courses,
          icon: EyeOff,
          color: "from-amber-500 to-orange-500",
        },
        {
          label: "Students",
          value: data.total_students,
          icon: Users,
          color: "from-violet-500 to-purple-500",
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <div className="pt-24 pb-16 px-4 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-10"
        >
          <div>
            <h1 className="text-3xl font-bold text-white">Teacher Dashboard</h1>
            <p className="text-slate-400 mt-1">
              Manage your courses and track student progress
            </p>
          </div>
          <Link href="/teacher/courses/new">
            <Button size="lg">
              <Plus className="w-4 h-4" /> Create Course
            </Button>
          </Link>
        </motion.div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
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

        {/* Course list */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-400" /> My Courses
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="glass rounded-xl h-20 shimmer" />
              ))}
            </div>
          ) : !data || data.courses.length === 0 ? (
            <div className="glass rounded-2xl p-16 text-center">
              <BookOpen className="w-14 h-14 mx-auto mb-4 text-slate-700" />
              <p className="text-slate-400 text-lg mb-2">No courses yet</p>
              <p className="text-slate-600 text-sm mb-6">
                Create your first course to start teaching
              </p>
              <Link href="/teacher/courses/new">
                <Button>Create First Course</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {data.courses.map((course, i) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="glass glass-hover rounded-2xl p-5 flex items-center gap-5"
                >
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br from-brand-900/60 to-indigo-900/60 flex items-center justify-center">
                    {course.thumbnail ? (
                      <img
                        src={resolveMediaUrl(course.thumbnail)}
                        alt={course.title}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl">
                        {CATEGORY_ICONS[course.category]}
                      </span>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-900/40 to-transparent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white truncate">
                        {course.title}
                      </h3>
                      <Badge
                        variant={course.is_published ? "success" : "warning"}
                      >
                        {course.is_published ? "Published" : "Draft"}
                      </Badge>
                      <Badge className={LEVEL_COLORS[course.level]}>
                        {course.level}
                      </Badge>
                      <Badge variant={course.is_free ? "success" : "info"}>
                        {course.is_free
                          ? "Free"
                          : formatCurrency(course.price, course.currency)}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">
                      {course.short_description || course.description}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-2">
                      <Link href={`/teacher/courses/${course.id}/edit`}>
                        <button
                          title="Edit course"
                          aria-label="Edit course"
                          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </Link>
                      <Link href={`/teacher/courses/${course.id}/stats`}>
                        <button
                          title="View course stats"
                          aria-label="View course stats"
                          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </button>
                      </Link>
                      <button
                        onClick={() => requestDeleteCourse(course)}
                        disabled={deletingCourseId === course.id}
                        title="Delete course"
                        aria-label="Delete course"
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all disabled:opacity-50"
                      >
                        {deletingCourseId === course.id ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => togglePublish(course)}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                      >
                        {course.is_published ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {courseToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
            onClick={() => {
              if (!deletingCourseId) setCourseToDelete(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg glass rounded-3xl p-6 border border-rose-500/20 shadow-2xl"
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/20 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-rose-400" />
              </div>

              <h3 className="text-xl font-bold text-white mb-2">
                Delete this course?
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                <span className="text-white font-medium">
                  {courseToDelete.title}
                </span>{" "}
                will be permanently removed. This also deletes its lessons,
                enrollments, payments, ratings, and attached materials.
              </p>

              <div className="mt-6 flex items-center justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setCourseToDelete(null)}
                  disabled={!!deletingCourseId}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={confirmDeleteCourse}
                  isLoading={deletingCourseId === courseToDelete.id}
                >
                  Delete course
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
