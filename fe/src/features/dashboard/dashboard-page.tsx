import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "../../components/ui/page-header";
import { DataTable, type Column } from "../../components/ui/data-table";
import { Badge } from "../../components/ui/badge";
import { LoadingState } from "../../components/ui/spinner";
import { formatVnd } from "../../lib/money";
import { useBranchContext } from "../property/branch-context";
import { buildingsApi } from "../property/buildings/api";
import { roomsApi } from "../property/rooms/api";
import { bedsApi } from "../property/beds/api";
import { BED_STATUS_META } from "../property/beds/bed-status";
import { debtsApi } from "../debts/api";
import type { DebtRow } from "../debts/types";
import { CustomerDetailDialog } from "../tenancy/customers/customer-detail-dialog";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

const UPCOMING_WINDOW_DAYS = 7;

function daysUntil(dueDate: string): number {
  const ms = new Date(dueDate).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function dueSoonLabel(days: number): { text: string; tone: "green" | "amber" | "red" } {
  if (days < 0) return { text: `Quá hạn ${-days} ngày`, tone: "red" };
  if (days === 0) return { text: "Hôm nay", tone: "red" };
  if (days <= 3) return { text: `Còn ${days} ngày`, tone: "amber" };
  return { text: `Còn ${days} ngày`, tone: "green" };
}

/**
 * Tổng quan — bản rút gọn. Owner cần thấy tỷ lệ lấp đầy và các khoản khách
 * sắp phải đóng tiền trong 10 giây; báo cáo doanh thu/P&L đầy đủ sẽ bổ sung
 * sau khi có thêm dữ liệu vận hành thực tế.
 */
export function DashboardPage() {
  const { selectedBranchId, branches } = useBranchContext();
  const [viewingCustomerId, setViewingCustomerId] = useState<string | null>(null);

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
  const { data: debtRows = [], isLoading: loadingDebts } = useQuery({
    queryKey: ["debts", selectedBranchId],
    queryFn: () => debtsApi.agingReport(selectedBranchId ?? undefined),
    enabled: !!selectedBranchId,
  });

  const occupied = beds.filter((b) => b.status === "OCCUPIED").length;
  const occupancyRate = beds.length > 0 ? Math.round((occupied / beds.length) * 100) : 0;
  const branchName = branches.find((b) => b.id === selectedBranchId)?.name;

  // "Sắp phải đóng tiền" = hóa đơn chưa trả đủ, chưa quá hạn, hạn trả trong
  // vòng UPCOMING_WINDOW_DAYS ngày tới — khác với trang Công nợ (liệt kê CẢ
  // những khoản đã quá hạn), ở đây chỉ nhắc trước cho lễ tân/kế toán.
  const upcoming = debtRows
    .filter((r) => r.dueDate && r.agingBucket === "CURRENT" && daysUntil(r.dueDate) <= UPCOMING_WINDOW_DAYS)
    .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1));
  const overdueCount = debtRows.filter((r) => r.agingBucket !== "CURRENT").length;

  const columns: Column<DebtRow>[] = [
    { header: "Khách thuê", cell: (r) => <span className="font-medium">{r.fullName}</span> },
    { header: "Số hóa đơn", cell: (r) => r.invoiceNo },
    { header: "Hạn thanh toán", cell: (r) => r.dueDate ?? "—" },
    {
      header: "Còn bao lâu",
      cell: (r) => {
        const meta = dueSoonLabel(daysUntil(r.dueDate!));
        return <Badge tone={meta.tone}>{meta.text}</Badge>;
      },
    },
    { header: "Số tiền", cell: (r) => <span className="font-medium">{formatVnd(r.balance)}</span> },
  ];

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

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">
            Sắp phải đóng tiền (trong {UPCOMING_WINDOW_DAYS} ngày tới)
          </h2>
          {overdueCount > 0 && (
            <span className="text-xs text-red-600">
              Ngoài ra có <strong>{overdueCount}</strong> hóa đơn đã quá hạn — xem ở mục Công nợ.
            </span>
          )}
        </div>
        {loadingDebts ? (
          <LoadingState />
        ) : (
          <DataTable
            columns={columns}
            rows={upcoming}
            rowKey={(r) => r.invoiceId}
            emptyMessage="Không có khoản nào sắp đến hạn trong thời gian tới."
            onRowClick={(r) => setViewingCustomerId(r.customerId)}
          />
        )}
      </div>

      <CustomerDetailDialog customerId={viewingCustomerId} onClose={() => setViewingCustomerId(null)} />
    </div>
  );
}
