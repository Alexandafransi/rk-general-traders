"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Branch } from "../types";
import { apiFetch } from "../../lib/auth/apiFetch";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8010";
const STORAGE_KEY = "rkgt-dashboard-branch";

type BranchContextValue = {
  branches: Branch[];
  branchId: string;
  setBranchId: (id: string) => void;
  currentBranch: Branch | null;
  refreshBranches: () => void;
};

const BranchContext = createContext<BranchContextValue | null>(null);

export function BranchProvider({ children }: { children: ReactNode }) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchIdState] = useState("all");

  function load() {
    apiFetch(`${API_URL}/api/branches/`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((json) => setBranches(json.results || json))
      .catch(() => {});
  }

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) setBranchIdState(stored);
    load();
  }, []);

  function setBranchId(id: string) {
    setBranchIdState(id);
    window.localStorage.setItem(STORAGE_KEY, id);
  }

  const currentBranch = useMemo(
    () => branches.find((b) => String(b.id) === branchId) ?? null,
    [branches, branchId]
  );

  const value = useMemo(
    () => ({ branches, branchId, setBranchId, currentBranch, refreshBranches: load }),
    [branches, branchId, currentBranch]
  );

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error("useBranch must be used within BranchProvider");
  return ctx;
}
