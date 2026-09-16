export interface Column<T> {
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
}

/**
 * Bảng danh sách dùng chung — theo mẫu bố cục docs/15 §7.1: cột hành động
 * luôn ở cuối, trạng thái dùng badge (truyền qua `cell`), không phân trang
 * ở lần đầu này (số dòng còn nhỏ — buildings/rooms/beds ở quy mô demo).
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyMessage = "Chưa có dữ liệu",
  onRowClick,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
  /** Cả hàng có thể bấm được (vd mở chi tiết) — con trỏ tay + hover rõ hơn để gợi ý. */
  onRowClick?: (row: T) => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 py-12 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {columns.map((col) => (
              <th key={col.header} className={`px-4 py-3 font-medium ${col.className ?? ""}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`hover:bg-slate-50 ${onRowClick ? "cursor-pointer" : ""}`}
            >
              {columns.map((col) => (
                <td key={col.header} className={`px-4 py-3 ${col.className ?? ""}`}>
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
