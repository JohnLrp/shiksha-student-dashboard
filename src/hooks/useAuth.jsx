import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/apiClient";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;

  useEffect(() => {
    async function bootstrap() {
      try {
        const res = await api.get("/me/");
        setUser(res.data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, []);

  const logout = async () => {
    try {
      await api.post("/logout/");
    } catch {}
    setUser(null);
    window.location.href = (import.meta.env.VITE_HOME_URL || "https://www.shikshacom.com") + "/login";
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthenticated, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
