"use client";
import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BookOpen,
  Plus,
  Trash2,
  GripVertical,
  ArrowLeft,
  Sparkles,
  Gift,
  BadgeDollarSign,
} from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { courseService } from "@/services/course.service";
import Link from "next/link";
import { getErrorMessage } from "@/lib/utils";

const LEVELS = ["beginner", "intermediate", "advanced"];
const CATEGORIES = [
  "programming",
  "design",
  "business",
  "marketing",
  "data_science",
  "devops",
  "mobile",
  "other",
];

type CourseType = "free" | "paid";

interface LessonDraft {
  title: string;
  description: string;
  content: string;
  video_url: string;
  order: number;
  duration_minutes: number;
  is_free_preview: boolean;
}

export default function CreateCoursePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<"info" | "lessons">("info");
  const [courseId, setCourseId] = useState<number | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [courseType, setCourseType] = useState<CourseType>("free");
  const [form, setForm] = useState({
    title: "",
    description: "",
    short_description: "",
    price: "0",
    currency: "ETB",
    level: "beginner",
    category: "programming",
    estimated_hours: "1",
  });
  const [lessons, setLessons] = useState<LessonDraft[]>([
    {
      title: "",
      description: "",
      content: "",
      video_url: "",
      order: 1,
      duration_minutes: 10,
      is_free_preview: true,
    },
  ]);

  const upd =
    (key: keyof typeof form) =>
    (
      e: ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setForm((current) => ({ ...current, [key]: e.target.value }));

  function updateCourseType(nextType: CourseType) {
    setCourseType(nextType);
    setForm((current) => ({
      ...current,
      price:
        nextType === "free"
          ? "0"
          : current.price === "0"
            ? "100"
            : current.price,
    }));
  }

  async function saveCourseInfo() {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Title and description required");
      return;
    }

    const price = courseType === "paid" ? parseFloat(form.price) || 0 : 0;
    if (courseType === "paid" && price <= 0) {
      toast.error("Set a price greater than 0 for a paid course");
      return;
    }

    setSaving(true);
    try {
      const course = await courseService.create({
        title: form.title.trim(),
        description: form.description.trim(),
        short_description: form.short_description.trim() || undefined,
        price,
        currency: form.currency,
        level: form.level as import("@/types").CourseLevel,
        category: form.category as import("@/types").CourseCategory,
        estimated_hours: parseFloat(form.estimated_hours) || 1,
        is_free: courseType === "free",
      });

      if (thumbnailFile) {
        try {
          await courseService.uploadThumbnail(course.id, thumbnailFile);
        } catch (uploadError: any) {
          toast.error(
            getErrorMessage(
              uploadError,
              "Course created, but thumbnail upload failed",
            ),
          );
        }
      }

      setCourseId(course.id);
      setStep("lessons");
      setThumbnailFile(null);
      toast.success(
        thumbnailFile
          ? "Course info saved and thumbnail uploaded!"
          : "Course info saved! Now add lessons.",
      );
    } catch (error: any) {
      toast.error(getErrorMessage(error, "Failed to save course"));
    } finally {
      setSaving(false);
    }
  }

  async function saveLessons() {
    if (!courseId) return;
    const validLessons = lessons.filter((lesson) => lesson.title.trim());
    if (validLessons.length === 0) {
      toast.error("Add at least one lesson");
      return;
    }

    setSaving(true);
    try {
      for (const lesson of validLessons) {
        await courseService.addLesson(courseId, {
          title: lesson.title.trim(),
          description: lesson.description.trim(),
          content: lesson.content.trim(),
          video_url: lesson.video_url.trim(),
          order: lesson.order,
          duration_minutes: lesson.duration_minutes,
          is_free_preview: lesson.is_free_preview,
        });
      }
      await courseService.update(courseId, { is_published: true });
      toast.success("Course created successfully! 🎉");
      router.push("/teacher");
    } catch (error: any) {
      toast.error(getErrorMessage(error, "Failed to save lessons"));
    } finally {
      setSaving(false);
    }
  }

  function addLesson() {
    setLessons((current) => [
      ...current,
      {
        title: "",
        description: "",
        content: "",
        video_url: "",
        order: current.length + 1,
        duration_minutes: 10,
        is_free_preview: false,
      },
    ]);
  }

  function removeLesson(index: number) {
    setLessons((current) =>
      current
        .filter((_, currentIndex) => currentIndex !== index)
        .map((lesson, lessonIndex) => ({ ...lesson, order: lessonIndex + 1 })),
    );
  }

  function updateLesson(
    index: number,
    key: keyof LessonDraft,
    value: string | number | boolean,
  ) {
    setLessons((current) =>
      current.map((lesson, lessonIndex) =>
        lessonIndex === index ? { ...lesson, [key]: value } : lesson,
      ),
    );
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <div className="pt-24 pb-16 px-4 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link
            href="/teacher"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>

          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-brand-400" />
            Create New Course
          </h1>
          <p className="text-slate-400 mb-8">
            Build a structured roadmap-style learning experience
          </p>

          <div className="flex items-center gap-3 mb-8">
            {(["info", "lessons"] as const).map((currentStep, index) => (
              <div key={currentStep} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step === currentStep || (index === 0 && step === "lessons")
                      ? "bg-brand-500 text-white"
                      : "bg-dark-500 text-slate-500"
                  }`}
                >
                  {index === 0 && step === "lessons" ? "✓" : index + 1}
                </div>
                <span
                  className={`text-sm capitalize ${
                    step === currentStep
                      ? "text-white font-medium"
                      : "text-slate-500"
                  }`}
                >
                  {currentStep === "info" ? "Course Info" : "Lessons"}
                </span>
                {index === 0 && <div className="w-12 h-0.5 bg-dark-500" />}
              </div>
            ))}
          </div>

          {step === "info" ? (
            <div className="glass rounded-2xl p-8 space-y-6">
              <Input
                label="Course Title *"
                placeholder="e.g. Python for Beginners"
                value={form.title}
                onChange={upd("title")}
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">
                  Description *
                </label>
                <textarea
                  rows={4}
                  placeholder="What will students learn? Be detailed."
                  value={form.description}
                  onChange={upd("description")}
                  className="glass rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition-all resize-none"
                />
              </div>

              <Input
                label="Short Description"
                placeholder="One-liner for the course card"
                value={form.short_description}
                onChange={upd("short_description")}
              />

              <div className="space-y-3 rounded-2xl border border-white/5 bg-dark-950/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">
                      Course access
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Choose whether students can enroll for free or need to
                      pay.
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      courseType === "free"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-amber-500/15 text-amber-300"
                    }`}
                  >
                    {courseType === "free" ? "Free course" : "Paid course"}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => updateCourseType("free")}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      courseType === "free"
                        ? "border-emerald-500/40 bg-emerald-500/10 shadow-glow-sm"
                        : "border-white/5 bg-dark-900/40 hover:border-white/10 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          courseType === "free"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-white/5 text-slate-400"
                        }`}
                      >
                        <Gift className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">Free</p>
                        <p className="text-xs text-slate-500">
                          Students enroll instantly without payment.
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateCourseType("paid")}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      courseType === "paid"
                        ? "border-amber-500/40 bg-amber-500/10 shadow-glow-sm"
                        : "border-white/5 bg-dark-900/40 hover:border-white/10 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          courseType === "paid"
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-white/5 text-slate-400"
                        }`}
                      >
                        <BadgeDollarSign className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">Paid</p>
                        <p className="text-xs text-slate-500">
                          Students pay before they can access the course.
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-white/5 bg-dark-950/40 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-400" />
                  <p className="text-sm font-medium text-white">
                    Course thumbnail
                  </p>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Choose an image now. It will upload right after the course is
                  created.
                </p>
                <input
                  type="file"
                  accept="image/*"
                  title="Course thumbnail"
                  aria-label="Course thumbnail"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setThumbnailFile(file);
                  }}
                  className="w-full glass rounded-xl px-4 py-2 text-sm text-slate-400 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-500 file:px-3 file:py-1.5 file:text-white hover:file:bg-brand-400"
                />
                {thumbnailFile && (
                  <p className="text-xs text-brand-300 truncate">
                    Selected: {thumbnailFile.name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-300">
                    Level
                  </label>
                  <select
                    value={form.level}
                    onChange={upd("level")}
                    title="Course level"
                    className="glass rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition-all capitalize"
                  >
                    {LEVELS.map((level) => (
                      <option key={level} value={level} className="bg-dark-700">
                        {level}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-300">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={upd("category")}
                    title="Course category"
                    className="glass rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition-all capitalize"
                  >
                    {CATEGORIES.map((category) => (
                      <option
                        key={category}
                        value={category}
                        className="bg-dark-700"
                      >
                        {category.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {courseType === "paid" ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Input
                    label="Price"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="100"
                    value={form.price}
                    onChange={upd("price")}
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-300">
                      Currency
                    </label>
                    <select
                      value={form.currency}
                      onChange={upd("currency")}
                      title="Course currency"
                      className="glass rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition-all"
                    >
                      {["ETB", "USD", "EUR"].map((currency) => (
                        <option
                          key={currency}
                          value={currency}
                          className="bg-dark-700"
                        >
                          {currency}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 px-4 py-3">
                  <p className="text-sm font-medium text-emerald-300">
                    No payment required.
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Students will enroll immediately without checkout.
                  </p>
                </div>
              )}

              <Input
                label="Est. Hours"
                type="number"
                min="0.5"
                step="0.5"
                placeholder="1"
                value={form.estimated_hours}
                onChange={upd("estimated_hours")}
              />

              <Button
                onClick={saveCourseInfo}
                isLoading={saving}
                size="lg"
                className="w-full"
              >
                Save & Add Lessons →
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {lessons.map((lesson, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass rounded-2xl p-5"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <GripVertical className="w-4 h-4 text-slate-600" />
                    <span className="text-sm font-semibold text-brand-300">
                      Lesson {lesson.order}
                    </span>
                    <div className="flex items-center gap-2 ml-auto">
                      <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={lesson.is_free_preview}
                          onChange={(e) =>
                            updateLesson(
                              index,
                              "is_free_preview",
                              e.target.checked,
                            )
                          }
                          className="accent-brand-500"
                        />
                        Free preview
                      </label>
                      {lessons.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLesson(index)}
                          title="Remove lesson"
                          aria-label="Remove lesson"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <input
                      placeholder={`Lesson ${lesson.order} title *`}
                      value={lesson.title}
                      onChange={(e) =>
                        updateLesson(index, "title", e.target.value)
                      }
                      className="w-full glass rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition-all"
                    />
                    <input
                      placeholder="Brief description (optional)"
                      value={lesson.description}
                      onChange={(e) =>
                        updateLesson(index, "description", e.target.value)
                      }
                      className="w-full glass rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition-all"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        placeholder="Video URL (YouTube or MP4, optional)"
                        value={lesson.video_url}
                        onChange={(e) =>
                          updateLesson(index, "video_url", e.target.value)
                        }
                        title={`Lesson ${lesson.order} video URL`}
                        className="w-full glass rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition-all"
                      />
                      <input
                        type="number"
                        min="1"
                        placeholder="Duration (minutes)"
                        value={lesson.duration_minutes}
                        onChange={(e) =>
                          updateLesson(
                            index,
                            "duration_minutes",
                            parseInt(e.target.value) || 10,
                          )
                        }
                        className="w-full glass rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition-all"
                      />
                    </div>
                    <textarea
                      rows={4}
                      placeholder="Lesson content / notes (optional)"
                      value={lesson.content}
                      onChange={(e) =>
                        updateLesson(index, "content", e.target.value)
                      }
                      title={`Lesson ${lesson.order} content`}
                      className="w-full glass rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition-all resize-none"
                    />
                  </div>
                </motion.div>
              ))}

              <button
                type="button"
                onClick={addLesson}
                className="w-full glass glass-hover rounded-2xl p-4 flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white border-dashed transition-all"
              >
                <Plus className="w-4 h-4" /> Add Another Lesson
              </button>

              <Button
                onClick={saveLessons}
                isLoading={saving}
                size="lg"
                className="w-full"
              >
                Create Course
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
