import api from "../../app/axios";

export const monitoringService = {
  async getDashboardSummary() {
    const response = await api.get("/monitoring/dashboard");
    return response.data;
  },

  async runNow() {
    const response = await api.post("/monitoring/run-now");
    return response.data;
  },

  async runBrandNow(id) {
    const response = await api.post(`/monitoring/brands/${id}/run-now`);
    return response.data;
  },

  async getHistory(brandId) {
    const response = await api.get(`/monitoring/history/${brandId}`);
    return response.data;
  },

  async resolveVisitUrl(url) {
    const response = await api.get("/monitoring/resolve-visit-url", {
      params: { url }
    });
    return response.data;
  }
};
