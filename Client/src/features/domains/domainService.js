import api from "../../app/axios";

export const domainService = {
  async getDomains(params = {}) {
    const response = await api.get("/domains", { params });
    return response.data;
  },

  async getAvailableDomains() {
    const response = await api.get("/domains/available");
    return response.data;
  },

  async createDomain(payload) {
    const response = await api.post("/domains", payload);
    return response.data;
  },

  async updateDomain(id, payload) {
    const response = await api.patch(`/domains/${id}`, payload);
    return response.data;
  },

  async deleteDomain(id) {
    const response = await api.delete(`/domains/${id}`);
    return response.data;
  },

  async assignDomainToBrand(domainId, brandId) {
    const response = await api.patch(`/domains/${domainId}/assign`, { brandId });
    return response.data;
  },

  async unassignDomainFromBrand(domainId) {
    const response = await api.patch(`/domains/${domainId}/unassign`);
    return response.data;
  },

  async replaceDomain(currentDomainId, newDomainId) {
    const response = await api.patch(`/domains/${currentDomainId}/replace`, {
      newDomainId
    });
    return response.data;
  },

  async importCsv(file) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/domains/import/csv", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });

    return response.data;
  }
};