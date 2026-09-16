import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { buildingsApi } from "./api";

/** Dùng lại ở floors/rooms/beds — các cấp con đều cần chọn tòa trước. */
export function BuildingSelect({
  branchId,
  value,
  onChange,
}: {
  branchId: string | null;
  value: string | null;
  onChange: (buildingId: string | null) => void;
}) {
  const { data: buildings = [] } = useQuery({
    queryKey: ["buildings", branchId],
    queryFn: () => buildingsApi.list(branchId ?? undefined),
    enabled: !!branchId,
  });

  // Mặc định chọn tòa đầu tiên khi danh sách tải xong, tránh để trống buộc
  // người dùng phải tự bấm chọn cho một danh sách gần như luôn có sẵn lựa chọn.
  useEffect(() => {
    if (!value && buildings.length > 0) onChange(buildings[0]!.id);
  }, [buildings, value, onChange]);

  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      className="rounded-md border border-slate-300 px-3 py-2 text-sm"
    >
      <option value="">— Chọn tòa nhà —</option>
      {buildings.map((b) => (
        <option key={b.id} value={b.id}>
          {b.name} ({b.code})
        </option>
      ))}
    </select>
  );
}
