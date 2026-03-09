import api from "../../app/axios";

export const brandService = {
  async getBrands(params = {}) {
    const response = await api.get("/brands", { params });
    return response.data;
  },

  async getBrandById(id) {
    const response = await api.get(`/brands/${id}`);
    return response.data;
  },

  async createBrand(payload) {
    const response = await api.post("/brands", payload);
    return response.data;
  },

  async updateBrand(id, payload) {
    const response = await api.patch(`/brands/${id}`, payload);
    return response.data;
  },

  async toggleMonitoring(id, monitoringEnabled) {
    const response = await api.patch(`/brands/${id}/monitoring`, {
      monitoringEnabled
    });
    return response.data;
  },

  async deleteBrand(id) {
    const response = await api.delete(`/brands/${id}`);
    return response.data;
  }
};