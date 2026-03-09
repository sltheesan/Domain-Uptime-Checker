import { createContext, useEffect, useMemo, useState } from "react";
import api from "../app/axios";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("duc_token"));
  const [loading, setLoading] = useState(true);

  const login = async (usernameOrEmail, password) => {
    const response = await api.post("/auth/login", {
      usernameOrEmail,
      password
    });

    const { token: newToken, user: loggedUser } = response.data;

    localStorage.setItem("duc_token", newToken);
    setToken(newToken);
    setUser(loggedUser);

    return loggedUser;
  };

  const logout = () => {
    localStorage.removeItem("duc_token");
    setToken(null);
    setUser(null);
  };

  const fetchMe = async () => {
    try {
      if (!localStorage.getItem("duc_token")) {
        setLoading(false);
        return;
      }

      const response = await api.get("/auth/me");
      setUser(response.data.user);
    } catch {
      localStorage.removeItem("duc_token");
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: !!user,
      login,
      logout,
      setUser
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}