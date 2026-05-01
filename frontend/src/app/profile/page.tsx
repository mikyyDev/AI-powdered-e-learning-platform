"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Camera,
  Save,
  BookOpen,
  Award,
  TrendingUp,
  Edit3,
  Check,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { courseService } from "@/services/course.service";
import api from "@/lib/api";
import { cn, getInitials, resolveMediaUrl } from "@/lib/utils";
import toast from "react-hot-toast";
import { type Enrollment, type CourseRoadmap } from "@/types";

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser, initialize, isLoading } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<CourseRoadmap[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: "", bio: "" });
  const avatarInputRef = useRef<HTMLInputElement>(null);

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
    setForm({ full_name: user.full_name, bio: user.bio ?? "" });
    courseService
      .myEnrollments()
      .then(async (enrollments: Enrollment[]) => {
        const roadmaps = await Promise.all(
          enrollments.map((e) =>
            courseService.roadmap(e.course_id).catch(() => null),
          ),
        );
        setEnrolledCourses(roadmaps.filter(Boolean) as CourseRoadmap[]);
      })
      .catch(() => {});
  }, [user]);

  async function saveProfile() {
    setSaving(true);
    try {
      const res = await api.patch("/users/me", {
        full_name: form.full_name,
        bio: form.bio || null,
      });
      setUser(res.data);
      localStorage.setItem("user", JSON.stringify(res.data));
      setEditing(false);
      toast.success("Profile updated!");
    } catch {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await api.post("/users/me/avatar", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUser(res.data);
      localStorage.setItem("user", JSON.stringify(res.data));
      toast.success("Avatar updated!");
    } catch {
      toast.error("Upload failed");
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center text-slate-400">
        <div className="glass rounded-2xl px-6 py-4 text-sm">
          Loading profile...
        </div>
      </div>
    );
  }

  if (!user) return null;

  const completedCount = enrolledCourses.filter(
    (c) => c.progress_percent === 100,
  ).length;
  const inProgressCount = enrolledCourses.filter(
    (c) => c.progress_percent > 0 && c.progress_percent < 100,
  ).length;
  const totalProgress = enrolledCourses.length
    ? Math.round(
        enrolledCourses.reduce((sum, c) => sum + c.progress_percent, 0) /
          enrolledCourses.length,
      )
    : 0;

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <div className="pt-24 pb-16 px-4 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Profile card */}
          <div className="glass rounded-2xl p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-400 to-indigo-500 flex items-center justify-center text-3xl font-bold text-white overflow-hidden">
                  {user.avatar ? (
                    <img
                      src={resolveMediaUrl(user.avatar)}
                      alt={user.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitials(user.full_name)
                  )}
                </div>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  aria-label="Upload avatar"
                  title="Upload avatar"
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center text-white hover:bg-brand-400 transition-colors shadow-lg"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  aria-label="Upload avatar file"
                  title="Upload avatar file"
                />
              </div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                {editing ? (
                  <div className="space-y-3">
                    <input
                      value={form.full_name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, full_name: e.target.value }))
                      }
                      className="glass rounded-xl px-4 py-2 text-lg font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 w-full sm:w-80"
                      placeholder="Your name"
                    />
                    <textarea
                      value={form.bio}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, bio: e.target.value }))
                      }
                      rows={3}
                      className="glass rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 resize-none w-full sm:w-80"
                      placeholder="Tell students about yourself…"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={saveProfile}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-500 text-white text-sm font-medium hover:shadow-glow-sm disabled:opacity-60 transition-all"
                      >
                        {saving ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditing(false);
                          setForm({
                            full_name: user.full_name,
                            bio: user.bio ?? "",
                          });
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl glass text-slate-400 hover:text-white text-sm transition-all"
                      >
                        <X className="w-3.5 h-3.5" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                      <h1 className="text-2xl font-bold text-white">
                        {user.full_name}
                      </h1>
                      <button
                        onClick={() => setEditing(true)}
                        aria-label="Edit profile"
                        title="Edit profile"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 transition-all"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-sm text-slate-400 mb-2">{user.email}</p>
                    <span
                      className={cn(
                        "text-xs px-2.5 py-1 rounded-full font-medium capitalize",
                        user.role === "teacher"
                          ? "bg-amber-500/20 text-amber-400"
                          : user.role === "admin"
                            ? "bg-rose-500/20 text-rose-400"
                            : "bg-brand-500/20 text-brand-400",
                      )}
                    >
                      {user.role}
                    </span>
                    {user.bio && (
                      <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                        {user.bio}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                label: "Enrolled",
                value: enrolledCourses.length,
                icon: BookOpen,
                color: "text-brand-400",
                bg: "bg-brand-500/10",
              },
              {
                label: "Completed",
                value: completedCount,
                icon: Award,
                color: "text-emerald-400",
                bg: "bg-emerald-500/10",
              },
              {
                label: "Avg Progress",
                value: `${totalProgress}%`,
                icon: TrendingUp,
                color: "text-indigo-400",
                bg: "bg-indigo-500/10",
              },
            ].map(({ label, value, icon: Icon, color, bg }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}
                className="glass rounded-2xl p-5 text-center"
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3",
                    bg,
                  )}
                >
                  <Icon className={cn("w-5 h-5", color)} />
                </div>
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              </motion.div>
            ))}
          </div>

          {/* My courses */}
          {enrolledCourses.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-base font-semibold text-white mb-4">
                My Courses
              </h2>
              <div className="space-y-3">
                {enrolledCourses.map((course) => (
                  <Link href={`/courses/${course.id}`} key={course.id}>
                    <div className="glass glass-hover rounded-xl p-4 flex items-center gap-4 transition-all">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/20 to-indigo-500/20 flex items-center justify-center shrink-0">
                        <BookOpen className="w-5 h-5 text-brand-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {course.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <progress
                            value={course.progress_percent}
                            max={100}
                            aria-label={`${course.title} progress`}
                            className="flex-1 h-1.5 overflow-hidden rounded-full bg-dark-700 accent-brand-500"
                          />
                          <span className="text-xs text-slate-500 shrink-0">
                            {course.progress_percent}%
                          </span>
                        </div>
                      </div>
                      {course.progress_percent === 100 && (
                        <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

          {enrolledCourses.length === 0 && (
            <div className="glass rounded-2xl p-12 text-center">
              <BookOpen className="w-10 h-10 mx-auto mb-3 text-slate-700" />
              <p className="text-slate-400 font-medium">No courses yet</p>
              <Link
                href="/courses"
                className="inline-block mt-4 px-5 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-500 text-white text-sm font-medium hover:shadow-glow-sm transition-all"
              >
                Browse Courses
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
