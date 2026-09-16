import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api-client";
import type { Branch } from "./branches/types";

interface BranchContextValue {
  branches: Branch[];
  isLoading: boolean;
  selectedBranchId: string | null;
  setSelectedBranchId: (id: string | null) => void;
}

const BranchContext = createContext<BranchContextValue | null>(null);

const STORAGE_KEY = "ktx.selectedBranchId";

/**
 * Chi nhánh đang chọn ở topbar (docs/15 §3) — dùng để lọc danh sách
 * buildings/rooms/beds. "Tất cả chi nhánh" (selectedBranchId = null) tương
 * đương scope=ALL phía BE; RLS vẫn là lớp chặn thật, context này chỉ là
 * tiện ích UX, không phải kiểm soát bảo mật.
 */
export function BranchProvider({ children }: { children: ReactNode }) {
  const { data: branches = [], isLoading } = useQuery({
    queryKey: ["branches"],
    queryFn: () => api.get<Branch[]>("/branches"),
  });

  const [selectedBranchId, setSelectedBranchIdState] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY),
  );

  useEffect(() => {
    if (selectedBranchId === null && branches.length > 0) {
      setSelectedBranchIdState(branches[0]!.id);
    }
  }, [branches, selectedBranchId]);

  const setSelectedBranchId = (id: string | null) => {
    setSelectedBranchIdState(id);
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(
    () => ({ branches, isLoading, selectedBranchId, setSelectedBranchId }),
    [branches, isLoading, selectedBranchId],
  );

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

export function useBranchContext(): BranchContextValue {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error("useBranchContext must be used within BranchProvider");
  return ctx;
}
