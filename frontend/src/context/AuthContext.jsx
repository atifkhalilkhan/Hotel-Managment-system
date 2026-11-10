/* Authentication state, token persistence, and session restoration. */
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/axios.js";
import { navigate } from "../router.js";
import AuthContext from "./authContext.js";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem("luxurystay-token")));

  useEffect(() => {
    const token = localStorage.getItem("luxurystay-token");
    if (!token) return undefined;
    let active = true;

    api.get("/auth/me")
      .then((profile) => { if (active) setUser(profile); })
      .catch(() => {
        localStorage.removeItem("luxurystay-token");
        if (active) setUser(null);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      navigate("/login", true);
    };
    window.addEventListener("luxurystay:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("luxurystay:unauthorized", handleUnauthorized);
  }, []);

  const saveSession = useCallback((session) => {
    localStorage.setItem("luxurystay-token", session.token);
    setUser(session);
    navigate("/dashboard", true);
  }, []);

  const login = useCallback(async (credentials) => {
    const session = await api.post("/auth/login", credentials);
    saveSession(session);
  }, [saveSession]);

  const register = useCallback(async (details) => {
    const session = await api.post("/auth/register", details);
    saveSession(session);
  }, [saveSession]);

  const logout = useCallback(async () => {
    try {
      if (localStorage.getItem("luxurystay-token")) await api.post("/auth/logout");
    } catch (error) {
      window.dispatchEvent(new CustomEvent("luxurystay:logout-error", { detail: error.message }));
    } finally {
      localStorage.removeItem("luxurystay-token");
      setUser(null);
      navigate("/login", true);
    }
  }, []);

  const value = useMemo(() => ({ user, loading, token: localStorage.getItem("luxurystay-token"), login, register, logout, setUser }), [user, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
