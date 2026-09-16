import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { roomTypesApi } from "./api";

export function RoomTypeSelect({
  branchId,
  value,
  onChange,
}: {
  branchId: string | null;
  value: string;
  onChange: (roomTypeId: string) => void;
}) {
  const { data: roomTypes = [] } = useQuery({
    queryKey: ["room-types", branchId],
    queryFn: () => roomTypesApi.list(branchId ?? undefined),
    enabled: !!branchId,
  });

  useEffect(() => {
    if (!value && roomTypes.length > 0) onChange(roomTypes[0]!.id);
  }, [roomTypes, value, onChange]);

  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
      <option value="">— Không chọn —</option>
      {roomTypes.map((rt) => (
        <option key={rt.id} value={rt.id}>
          {rt.name} ({rt.capacity} người)
        </option>
      ))}
    </select>
  );
}
