import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { roomsApi } from "./api";

export function RoomSelect({
  branchId,
  floorId,
  value,
  onChange,
}: {
  branchId: string | null;
  floorId: string | null;
  value: string | null;
  onChange: (roomId: string | null) => void;
}) {
  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms", branchId, floorId],
    queryFn: () => roomsApi.list({ branchId: branchId ?? undefined, floorId: floorId ?? undefined }),
    enabled: !!floorId,
  });

  useEffect(() => {
    if (!value && rooms.length > 0) onChange(rooms[0]!.id);
  }, [rooms, value, onChange]);

  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      className="rounded-md border border-slate-300 px-3 py-2 text-sm"
      disabled={!floorId}
    >
      <option value="">— Chọn phòng —</option>
      {rooms.map((r) => (
        <option key={r.id} value={r.id}>
          {r.code}
        </option>
      ))}
    </select>
  );
}
