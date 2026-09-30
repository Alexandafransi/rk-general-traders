"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AuthUser, RoleDef, RoleKey } from "../../dashboard/types";
import { apiFetch, clearTokens, getAccessToken, setTokens } from "./apiFetch";
import { buildRoleModulesMap, canAccessModule } from "./permissions";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

type LoginResult = { ok: true } | { ok: false; error: string };

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  roles: RoleDef[];
  login: (identifier: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  hasRole: (...roles: RoleKey[]) => boolean;
  can: (module: string) => boolean;
  refreshRoles: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<RoleDef[]>([]);

  function loadRoles() {
    apiFetch(`${API_URL}/api/roles/`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((json) => setRoles(json.results || json))
      .catch(() => {});
  }

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }
    apiFetch(`${API_URL}/api/auth/me/`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((json: AuthUser) => {
        setUser(json);
        loadRoles();
      })
      .catch(() => {
        clearTokens();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(identifier: string, password: string): Promise<LoginResult> {
    try {
      const res = await fetch(`${API_URL}/api/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: identifier, password }),
      });
      if (!res.ok) {
        return { ok: false, error: res.status === 401 ? "auth.login.invalidCredentials" : "auth.login.genericError" };
      }
      const json = await res.json();
      setTokens(json.access, json.refresh);
      setUser(json.user);
      return { ok: true };
    } catch {
      return { ok: false, error: "auth.login.networkError" };
    }
  }

  async function logout() {
    try {
      await apiFetch(`${API_URL}/api/auth/logout/`, { method: "POST" });
    } catch {
      // best-effort — still log the user out locally even if this fails
    }
    clearTokens();
    setUser(null);
    if (typeof window !== "undefined") window.location.href = "/login";
  }

  function hasRole(...roleKeys: RoleKey[]) {
    return !!user && roleKeys.includes(user.role);
  }

  const roleModulesMap = useMemo(() => buildRoleModulesMap(roles), [roles]);

  function can(module: string) {
    return canAccessModule(user?.role, roleModulesMap, module);
  }

  const value = useMemo(
    () => ({ user, loading, roles, login, logout, hasRole, can, refreshRoles: loadRoles }),
    [user, loading, roles, roleModulesMap]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
