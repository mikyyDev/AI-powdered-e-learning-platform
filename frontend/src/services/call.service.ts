import api from "@/lib/api";
import type { Call } from "@/types";

export const callService = {
  async initiate(data: { callee_id: number; course_id?: number | null }): Promise<Call> {
    const res = await api.post("/calls", data);
    return res.data;
  },

  async myCalls(): Promise<Call[]> {
    const res = await api.get("/calls/my");
    return res.data;
  },

  async accept(callId: number): Promise<Call> {
    const res = await api.patch(`/calls/${callId}/accept`);
    return res.data;
  },

  async end(callId: number): Promise<Call> {
    const res = await api.patch(`/calls/${callId}/end`);
    return res.data;
  },
};