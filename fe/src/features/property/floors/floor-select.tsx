import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { floorsApi } from "./api";

export function FloorSelect({
  buildingId,
  value,
  onChange,
}: {
  buildingId: string | null;
  value: string | null;
  onChange: (floorId: string | null) => void;
}) {
  const { data: floors = [] } = useQuery({
    queryKey: ["floors", buildingId],
    queryFn: () => floorsApi.list(buildingId ?? undefined),
    enabled: !!buildingId,
  });

  useEffect(() => {
    if (!value && floors.length > 0) onChange(floors[0]!.id);
  }, [floors, value, onChange]);

  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      className="rounded-md border border-slate-300 px-3 py-2 text-sm"
      disabled={!buildingId}
    >
      <option value="">— Chọn tầng —</option>
      {floors.map((f) => (
        <option key={f.id} value={f.id}>
          {f.name || `Tầng ${f.number}`}
        </option>
      ))}
    </select>
  );
}
