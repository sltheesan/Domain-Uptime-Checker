import api from "../../app/axios";

export const settingsService = {
  async getSettings() {
    const response = await api.get("/settings");
    return response.data;
  },

  async updateSettings(payload) {
    const response = await api.patch("/settings", payload);
    return response.data;
  },

  async syncCheckerDomains() {
    const response = await api.post("/settings/sync");
    return response.data;
  }
};
