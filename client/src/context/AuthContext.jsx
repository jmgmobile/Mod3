import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [prestadorId, setPrestadorId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/auth/me")
      .then((data) => setPrestadorId(data.id))
      .catch(() => setPrestadorId(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const data = await api.post("/auth/login", { email, password });
    setPrestadorId(data.id);
  }

  async function registrar(email, password) {
    const data = await api.post("/auth/registro", { email, password });
    setPrestadorId(data.id);
  }

  async function logout() {
    await api.post("/auth/logout", {});
    setPrestadorId(null);
  }

  return (
    <AuthContext.Provider value={{ prestadorId, loading, login, registrar, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
