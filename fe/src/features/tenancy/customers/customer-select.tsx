import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { customersApi } from "./api";

/** Chọn khách thuê — có ô tìm theo tên/SĐT vì danh sách khách có thể dài. */
export function CustomerSelect({ value, onChange }: { value: string | null; onChange: (customerId: string | null) => void }) {
  const [search, setSearch] = useState("");
  const { data: customers = [] } = useQuery({
    queryKey: ["customers", search],
    queryFn: () => customersApi.list({ search: search || undefined }),
  });

  // Chỉ tự chọn khi CHƯA có lựa chọn nào — một khi đã chọn 1 khách, gõ tìm
  // tiếp không được âm thầm đổi sang khách khác (đây là dữ liệu gắn với giao
  // dịch tiền/hợp đồng thật, không phải bộ lọc hiển thị).
  useEffect(() => {
    if (!value && customers.length > 0) onChange(customers[0]!.id);
  }, [customers, value, onChange]);

  return (
    <div className="space-y-1">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Tìm theo tên/SĐT..."
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      >
        <option value="">— Chọn khách thuê —</option>
        {customers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.customerCode} — {c.fullName} ({c.phone})
          </option>
        ))}
      </select>
    </div>
  );
}
