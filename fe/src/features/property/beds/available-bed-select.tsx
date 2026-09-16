import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { bedsApi } from "./api";

/** Chọn 1 giường còn trống — dùng cho form đặt chỗ. */
export function AvailableBedSelect({
  branchId,
  value,
  onChange,
}: {
  branchId: string;
  value: string | null;
  onChange: (bedId: string | null) => void;
}) {
  const { data: beds = [] } = useQuery({
    queryKey: ["beds", branchId],
    queryFn: () => bedsApi.list({ branchId }),
  });
  const available = beds.filter((b) => b.status === "AVAILABLE");

  useEffect(() => {
    if (!value && available.length > 0) onChange(available[0]!.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `available` is derived fresh every render; length is the real dependency
  }, [available.length, value, onChange]);

  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
    >
      <option value="">— Chọn giường còn trống —</option>
      {available.map((b) => (
        <option key={b.id} value={b.id}>
          {b.code}
        </option>
      ))}
    </select>
  );
}

/** Chọn nhiều giường còn trống — dùng cho form lập hợp đồng (D1: đơn vị bán là giường). */
export function AvailableBedMultiSelect({
  branchId,
  value,
  onChange,
}: {
  branchId: string;
  value: string[];
  onChange: (bedIds: string[]) => void;
}) {
  const { data: beds = [] } = useQuery({
    queryKey: ["beds", branchId],
    queryFn: () => bedsApi.list({ branchId }),
  });
  const available = beds.filter((b) => b.status === "AVAILABLE");

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  if (available.length === 0) {
    return <p className="text-sm text-slate-500">Không còn giường trống ở chi nhánh này.</p>;
  }

  return (
    <div className="grid max-h-40 grid-cols-3 gap-2 overflow-y-auto rounded-md border border-slate-200 p-2">
      {available.map((b) => (
        <label key={b.id} className="flex items-center gap-1.5 text-sm">
          <input type="checkbox" checked={value.includes(b.id)} onChange={() => toggle(b.id)} />
          {b.code}
        </label>
      ))}
    </div>
  );
}
