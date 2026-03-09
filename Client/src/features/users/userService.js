import api from "../../app/axios";

export const userService = {
  async getUsers() {
    const response = await api.get("/users");
    return response.data;
  },

  async createUser(payload) {
    const response = await api.post("/users", payload);
    return response.data;
  },

  async updateUser(id, payload) {
    const response = await api.patch(`/users/${id}`, payload);
    return response.data;
  }
};