"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Paperclip,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { courseService } from "@/services/course.service";
import api from "@/lib/api";
import { type Course, type Lesson } from "@/types";
import { resolveMediaUrl } from "@/lib/utils";

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

export default function EditCoursePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [saving, setSaving] = useState(false);
  const [savingLessonId, setSavingLessonId] = useState<number | null>(null);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [materialTitleByLesson, setMaterialTitleByLesson] = useState<
    Record<number, string>
  >({});
  const [uploadingMaterialId, setUploadingMaterialId] = useState<number | null>(
    null,
  );

  useEffect(() => {
    courseService.roadmap(Number(id)).then((r) => {
      setCourse(r as unknown as Course);
      setLessons(r.lessons);
    });
  }, [id]);

  async function saveCourse() {
    if (!course) return;
    setSaving(true);
    try {
      await courseService.update(course.id, {
        title: course.title,
        description: course.description,
        short_description: course.short_description,
        price: course.price,
        level: course.level,
        category: course.category,
        estimated_hours: course.estimated_hours,
        is_published: course.is_published,
      });

      const lessonResults = await Promise.allSettled(
        lessons.map((lesson) =>
          courseService.updateLesson(lesson.id, {
            title: lesson.title,
            description: lesson.description,
            content: lesson.content,
            video_url: lesson.video_url,
            order: lesson.order,
            duration_minutes: lesson.duration_minutes,
            is_free_preview: lesson.is_free_preview,
          }),
        ),
      );

      const failedLessons = lessonResults.filter(
        (result): result is PromiseRejectedResult =>
          result.status === "rejected",
      );

      if (failedLessons.length > 0) {
        toast.error("Course saved, but some lessons failed to save");
      } else {
        toast.success("Changes saved!");
      }
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function uploadThumbnail(file: File) {
    if (!course) return;
    setThumbnailUploading(true);
    try {
      const updated = await courseService.uploadThumbnail(course.id, file);
      setCourse(updated);
      toast.success("Thumbnail updated");
    } catch {
      toast.error("Thumbnail upload failed");
    } finally {
      setThumbnailUploading(false);
    }
  }

  async function deleteLesson(lessonId: number) {
    await api.delete(`/courses/lessons/${lessonId}`);
    setLessons((ls) => ls.filter((l) => l.id !== lessonId));
    toast.success("Lesson deleted");
  }

  async function addLesson() {
    if (!course) return;
    const lesson = await courseService.addLesson(course.id, {
      title: "New Lesson",
      description: "",
      content: "",
      video_url: "",
      order: lessons.length + 1,
      duration_minutes: 10,
      is_free_preview: false,
    });
    setLessons((ls) => [...ls, lesson]);
    toast.success("Lesson added");
  }

  function updateLessonField(
    lessonId: number,
    field: keyof Lesson,
    value: string | number | boolean,
  ) {
    setLessons((current) =>
      current.map((lesson) =>
        lesson.id === lessonId ? { ...lesson, [field]: value } : lesson,
      ),
    );
  }

  async function saveLesson(lesson: Lesson) {
    setSavingLessonId(lesson.id);
    try {
      await courseService.updateLesson(lesson.id, {
        title: lesson.title,
        description: lesson.description,
        content: lesson.content,
        video_url: lesson.video_url,
        order: lesson.order,
        duration_minutes: lesson.duration_minutes,
        is_free_preview: lesson.is_free_preview,
      });
      toast.success("Lesson saved");
    } catch {
      toast.error("Lesson save failed");
    } finally {
      setSavingLessonId(null);
    }
  }

  async function uploadLessonMaterial(lessonId: number, file: File) {
    setUploadingMaterialId(lessonId);
    try {
      const material = await courseService.addLessonMaterial(
        lessonId,
        file,
        materialTitleByLesson[lessonId],
      );
      setLessons((current) =>
        current.map((lesson) =>
          lesson.id === lessonId
            ? {
                ...lesson,
                materials: [...(lesson.materials ?? []), material],
              }
            : lesson,
        ),
      );
      setMaterialTitleByLesson((current) => ({ ...current, [lessonId]: "" }));
      toast.success("Material uploaded");
    } catch {
      toast.error("Material upload failed");
    } finally {
      setUploadingMaterialId(null);
    }
  }

  async function deleteLessonMaterial(lessonId: number, materialId: number) {
    try {
      await courseService.deleteLessonMaterial(materialId);
      setLessons((current) =>
        current.map((lesson) =>
          lesson.id === lessonId
            ? {
                ...lesson,
                materials: (lesson.materials ?? []).filter(
                  (material) => material.id !== materialId,
                ),
              }
            : lesson,
        ),
      );
      toast.success("Material deleted");
    } catch {
      toast.error("Material delete failed");
    }
  }

  if (!course)
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  const upd =
    (k: keyof Course) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setCourse((c) => (c ? { ...c, [k]: e.target.value } : c));

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
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-white">Edit Course</h1>
            <Button onClick={saveCourse} isLoading={saving}>
              <Save className="w-4 h-4" /> Save All Changes
            </Button>
          </div>

          <div className="glass rounded-2xl p-8 space-y-6 mb-6">
            <Input label="Title" value={course.title} onChange={upd("title")} />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">
                Description
              </label>
              <textarea
                rows={4}
                value={course.description}
                title="Course description"
                placeholder="Describe what students will learn"
                onChange={(e) =>
                  setCourse((c) =>
                    c ? { ...c, description: e.target.value } : c,
                  )
                }
                className="glass rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 resize-none transition-all"
              />
            </div>
            <Input
              label="Short Description"
              value={course.short_description || ""}
              onChange={upd("short_description")}
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">
                  Level
                </label>
                <select
                  value={course.level}
                  onChange={upd("level")}
                  title="Course level"
                  className="glass rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition-all"
                >
                  {LEVELS.map((l) => (
                    <option
                      key={l}
                      value={l}
                      className="bg-dark-700 capitalize"
                    >
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">
                  Category
                </label>
                <select
                  value={course.category}
                  onChange={upd("category")}
                  title="Course category"
                  className="glass rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition-all"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-dark-700">
                      {c.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Price (ETB)"
                type="number"
                min="0"
                value={String(course.price)}
                onChange={upd("price")}
              />
              <Input
                label="Est. Hours"
                type="number"
                min="0"
                step="0.5"
                value={String(course.estimated_hours)}
                onChange={upd("estimated_hours")}
              />
            </div>

            <div className="rounded-xl border border-white/5 bg-dark-950/40 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-400" />
                <p className="text-sm font-medium text-white">
                  Course thumbnail
                </p>
              </div>

              {course.thumbnail ? (
                <div className="overflow-hidden rounded-xl border border-white/5 bg-dark-800">
                  <img
                    src={resolveMediaUrl(course.thumbnail)}
                    alt={course.title}
                    className="h-44 w-full object-cover"
                  />
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  No thumbnail uploaded yet.
                </p>
              )}

              <input
                type="file"
                accept="image/*"
                title="Upload course thumbnail"
                aria-label="Upload course thumbnail"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    void uploadThumbnail(file);
                  }
                  e.currentTarget.value = "";
                }}
                disabled={thumbnailUploading}
                className="w-full glass rounded-xl px-4 py-2 text-sm text-slate-400 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-500 file:px-3 file:py-1.5 file:text-white hover:file:bg-brand-400 disabled:opacity-60"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={course.is_published}
                onChange={(e) =>
                  setCourse((c) =>
                    c ? { ...c, is_published: e.target.checked } : c,
                  )
                }
                className="w-4 h-4 accent-brand-500"
              />
              <span className="text-sm text-slate-300">
                Published (visible to students)
              </span>
            </label>
          </div>

          {/* Lessons */}
          <div>
            <h2 className="text-lg font-bold text-white mb-4">Lessons</h2>
            <div className="space-y-3 mb-4">
              {lessons.map((lesson, i) => (
                <div key={lesson.id} className="glass rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-brand-300 w-6">
                      {lesson.order}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        {lesson.title || `Lesson ${lesson.order}`}
                      </p>
                      <p className="text-xs text-slate-500">
                        {lesson.duration_minutes}m
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteLesson(lesson.id)}
                      title="Delete lesson"
                      aria-label="Delete lesson"
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      value={lesson.title}
                      onChange={(e) =>
                        updateLessonField(lesson.id, "title", e.target.value)
                      }
                      placeholder="Lesson title"
                      title="Lesson title"
                      className="w-full glass rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition-all"
                    />
                    <input
                      value={lesson.video_url || ""}
                      onChange={(e) =>
                        updateLessonField(
                          lesson.id,
                          "video_url",
                          e.target.value,
                        )
                      }
                      placeholder="Video URL (YouTube or MP4, optional)"
                      title="Lesson video URL"
                      className="w-full glass rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition-all"
                    />
                  </div>

                  <textarea
                    rows={3}
                    value={lesson.description || ""}
                    onChange={(e) =>
                      updateLessonField(
                        lesson.id,
                        "description",
                        e.target.value,
                      )
                    }
                    placeholder="Short lesson description"
                    title="Lesson description"
                    className="w-full glass rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 resize-none transition-all"
                  />

                  <textarea
                    rows={5}
                    value={lesson.content || ""}
                    onChange={(e) =>
                      updateLessonField(lesson.id, "content", e.target.value)
                    }
                    placeholder="Lesson content, notes, code examples, or explanation"
                    title="Lesson content"
                    className="w-full glass rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 resize-none transition-all"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      min="1"
                      value={lesson.order}
                      onChange={(e) =>
                        updateLessonField(
                          lesson.id,
                          "order",
                          parseInt(e.target.value) || lesson.order,
                        )
                      }
                      placeholder="Order"
                      title="Lesson order"
                      className="w-full glass rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition-all"
                    />
                    <input
                      type="number"
                      min="0"
                      value={lesson.duration_minutes}
                      onChange={(e) =>
                        updateLessonField(
                          lesson.id,
                          "duration_minutes",
                          parseInt(e.target.value) || 0,
                        )
                      }
                      placeholder="Duration (minutes)"
                      title="Lesson duration"
                      className="w-full glass rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition-all"
                    />
                  </div>

                  <div className="rounded-xl border border-white/5 bg-dark-950/40 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-brand-400" />
                      <p className="text-sm font-medium text-white">
                        Lesson materials
                      </p>
                    </div>

                    {lesson.materials && lesson.materials.length > 0 ? (
                      <div className="space-y-2">
                        {lesson.materials.map((material) => (
                          <div
                            key={material.id}
                            className="glass rounded-xl px-3 py-2 flex items-center gap-3"
                          >
                            <a
                              href={resolveMediaUrl(material.file_url)}
                              target="_blank"
                              rel="noreferrer"
                              className="min-w-0 flex-1"
                            >
                              <p className="text-sm text-white truncate">
                                {material.title}
                              </p>
                              <p className="text-xs text-slate-500 truncate">
                                {material.file_name}
                              </p>
                            </a>
                            <button
                              type="button"
                              onClick={() =>
                                deleteLessonMaterial(lesson.id, material.id)
                              }
                              aria-label="Delete lesson material"
                              title="Delete lesson material"
                              className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">
                        No materials uploaded yet.
                      </p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                      <input
                        value={materialTitleByLesson[lesson.id] || ""}
                        onChange={(e) =>
                          setMaterialTitleByLesson((current) => ({
                            ...current,
                            [lesson.id]: e.target.value,
                          }))
                        }
                        placeholder="Material title (optional)"
                        title="Material title"
                        className="w-full glass rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition-all"
                      />
                      <input
                        type="file"
                        accept="image/*,.pdf,.txt,.zip"
                        title="Upload lesson material"
                        aria-label="Upload lesson material"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            void uploadLessonMaterial(lesson.id, file);
                          }
                          e.currentTarget.value = "";
                        }}
                        disabled={uploadingMaterialId === lesson.id}
                        className="w-full glass rounded-xl px-4 py-2 text-sm text-slate-400 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-500 file:px-3 file:py-1.5 file:text-white hover:file:bg-brand-400 disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={lesson.is_free_preview}
                        onChange={(e) =>
                          updateLessonField(
                            lesson.id,
                            "is_free_preview",
                            e.target.checked,
                          )
                        }
                        className="accent-brand-500"
                      />
                      Free preview
                    </label>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => saveLesson(lesson)}
                      isLoading={savingLessonId === lesson.id}
                    >
                      Save Lesson
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={addLesson}
              className="w-full glass glass-hover rounded-xl p-3.5 flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white transition-all border-dashed"
            >
              <Plus className="w-4 h-4" /> Add Lesson
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
