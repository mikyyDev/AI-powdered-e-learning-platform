import api from "@/lib/api";

export const paymentService = {
  async initiate(courseId: number, currency = "ETB") {
    const res = await api.post("/payments/initiate", { course_id: courseId, currency });
    return res.data;
  },

  async verify(txRef: string) {
    const res = await api.get(`/payments/chapa/callback`, { params: { trx_ref: txRef } });
    return res.data;
  },

  async myPayments() {
    const res = await api.get("/payments/my");
    return res.data;
  },
};
