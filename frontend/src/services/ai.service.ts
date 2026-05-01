import api from "@/lib/api";
import type { AIRecommendation } from "@/types";

export const aiService = {
  async recommendations(): Promise<AIRecommendation[]> {
    const res = await api.get("/ai/recommendations");
    return res.data;
  },

  async learningPath(courseId: number) {
    const res = await api.get(`/ai/learning-path/${courseId}`);
    return res.data;
  },
};
