import api from "@/lib/api";
import type { Course, CourseRoadmap, Lesson, LessonMaterial } from "@/types";

export const courseService = {
  async list(params?: { skip?: number; limit?: number; category?: string }): Promise<Course[]> {
    const res = await api.get("/courses", { params });
    return res.data;
  },

  async roadmap(courseId: number): Promise<CourseRoadmap> {
    const res = await api.get(`/courses/${courseId}/roadmap`);
    return res.data;
  },

  async create(data: Partial<Course>): Promise<Course> {
    const res = await api.post("/courses", data);
    return res.data;
  },

  async update(id: number, data: Partial<Course>): Promise<Course> {
    const res = await api.patch(`/courses/${id}`, data);
    return res.data;
  },

  async uploadThumbnail(courseId: number, file: File): Promise<Course> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post(`/courses/${courseId}/thumbnail`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async deleteCourse(id: number): Promise<void> {
    await api.delete(`/courses/${id}`);
  },

  async addLesson(courseId: number, data: Partial<Lesson>): Promise<Lesson> {
    const res = await api.post(`/courses/${courseId}/lessons`, data);
    return res.data;
  },

  async updateLesson(lessonId: number, data: Partial<Lesson>): Promise<Lesson> {
    const res = await api.patch(`/courses/lessons/${lessonId}`, data);
    return res.data;
  },

  async listLessonMaterials(lessonId: number): Promise<LessonMaterial[]> {
    const res = await api.get(`/courses/lessons/${lessonId}/materials`);
    return res.data;
  },

  async addLessonMaterial(lessonId: number, file: File, title?: string): Promise<LessonMaterial> {
    const formData = new FormData();
    formData.append("file", file);
    if (title?.trim()) formData.append("title", title.trim());
    const res = await api.post(`/courses/lessons/${lessonId}/materials`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async deleteLessonMaterial(materialId: number): Promise<void> {
    await api.delete(`/courses/materials/${materialId}`);
  },

  async markProgress(lessonId: number, isCompleted = true) {
    const res = await api.post("/enrollments/progress", { lesson_id: lessonId, is_completed: isCompleted });
    return res.data;
  },

  async myEnrollments() {
    const res = await api.get("/enrollments");
    return res.data;
  },

  async unenroll(courseId: number): Promise<void> {
    await api.delete(`/enrollments/${courseId}`);
  },
};
