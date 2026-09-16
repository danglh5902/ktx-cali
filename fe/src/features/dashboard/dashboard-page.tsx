import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "../../components/ui/page-header";
import { useBranchContext } from "../property/branch-context";
import { buildingsApi } from "../property/buildings/api";
import { roomsApi } from "../property/rooms/api";
import { bedsApi } from "../property/beds/api";
import { BED_STATUS_META } from "../property/beds/bed-status";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

/**
 * Tổng quan — bản rút gọn. docs/02-vision-personas.md khuyến nghị Owner cần
 * thấy tỷ lệ lấp đầy trong 10 giây; ở đây mới có số đếm cơ bản vì báo cáo
 * doanh thu/công nợ/P&L cần module hóa đơn-thanh toán (chưa xây).
 */
export function DashboardPage() {
  const { selectedBranchId, branches } = useBranchContext();

  const { data: buildings = [] } = useQuery({
    queryKey: ["buildings", selectedBranchId],
    queryFn: () => buildingsApi.list(selectedBranchId ?? undefined),
    enabled: !!selectedBranchId,
  });
  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms", selectedBranchId, null],
    queryFn: () => roomsApi.list({ branchId: selectedBranchId ?? undefined }),
    enabled: !!selectedBranchId,
  });
  const { data: beds = [] } = useQuery({
    queryKey: ["beds", selectedBranchId],
    queryFn: () => bedsApi.list({ branchId: selectedBranchId ?? undefined }),
    enabled: !!selectedBranchId,
  });

  const occupied = beds.filter((b) => b.status === "OCCUPIED").length;
  const occupancyRate = beds.length > 0 ? Math.round((occupied / beds.length) * 100) : 0;
  const branchName = branches.find((b) => b.id === selectedBranchId)?.name;

  return (
    <div>
      <PageHeader title="Tổng quan" description={branchName ? `Chi nhánh: ${branchName}` : undefined} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Tòa nhà" value={buildings.length} />
        <StatCard label="Phòng" value={rooms.length} />
        <StatCard label="Giường" value={beds.length} />
        <StatCard label="Tỷ lệ lấp đầy" value={`${occupancyRate}%`} />
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Trạng thái giường</h2>
        <div className="flex flex-wrap gap-4">
          {Object.entries(BED_STATUS_META).map(([key, meta]) => {
            const count = beds.filter((b) => b.status === key).length;
            return (
              <div key={key} className="flex items-center gap-2 text-sm">
                <span className={`flex h-6 w-6 items-center justify-center rounded border text-xs ${meta.className}`}>
                  {meta.symbol}
                </span>
                <span className="text-slate-600">
                  {meta.label}: <strong>{count}</strong>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-6 text-xs text-slate-400">
        Báo cáo doanh thu/công nợ/lấp đầy theo thời gian sẽ bổ sung cùng module hóa đơn-thanh toán — xem
        docs/05-dashboards.md.
      </p>
    </div>
  );
}
