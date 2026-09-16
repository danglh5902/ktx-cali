import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { contractsApi } from "./api";

/** Chọn hợp đồng đang hiệu lực trong chi nhánh — dùng cho form đề nghị hoàn cọc. */
export function ContractSelect({ branchId, value, onChange }: { branchId: string; value: string | null; onChange: (contractId: string | null) => void }) {
  const { data: contracts = [] } = useQuery({
    queryKey: ["contracts", branchId],
    queryFn: () => contractsApi.list({ branchId }),
  });

  useEffect(() => {
    if (!value && contracts.length > 0) onChange(contracts[0]!.id);
  }, [contracts, value, onChange]);

  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
    >
      <option value="">— Chọn hợp đồng —</option>
      {contracts.map((c) => (
        <option key={c.id} value={c.id}>
          {c.contractNo} ({c.status})
        </option>
      ))}
    </select>
  );
}
