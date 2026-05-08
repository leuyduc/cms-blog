import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "../lib/api";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "AUTHOR" | "READER";
}

interface AuthCtx {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx>(null as any);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [user, setUser] = useState<User | null>(() => {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  });

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  const login = async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password });
    setToken(data.token);
    setUser(data.user);
  };
  const register = async (email: string, password: string, name: string) => {
    const { data } = await api.post("/auth/register", { email, password, name });
    setToken(data.token);
    setUser(data.user);
  };
  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return <Ctx.Provider value={{ user, token, login, register, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
