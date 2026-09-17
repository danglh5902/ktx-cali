import { useQuery } from "@tanstack/react-query";
import { DataTable, type Column } from "../../components/ui/data-table";
import { Alert } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { PageHeader } from "../../components/ui/page-header";
import { getErrorMessage } from "../../lib/errors";
import { formatVnd } from "../../lib/money";
import { useBranchContext } from "../property/branch-context";
import { debtsApi } from "./api";
import type { AgingBucket, DebtRow } from "./types";
import { LoadingState } from "../../components/ui/spinner";

const BUCKET_META: Record<AgingBucket, { label: string; tone: "green" | "amber" | "red" | "slate" }> = {
  CURRENT: { label: "Trong hạn", tone: "green" },
  "1_30": { label: "Quá hạn 1-30 ngày", tone: "amber" },
  "31_60": { label: "Quá hạn 31-60 ngày", tone: "amber" },
  "61_90": { label: "Quá hạn 61-90 ngày", tone: "red" },
  OVER_90: { label: "Quá hạn trên 90 ngày", tone: "red" },
};

export function DebtsPage() {
  const { selectedBranchId } = useBranchContext();

  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ["debts", selectedBranchId],
    queryFn: () => debtsApi.agingReport(selectedBranchId ?? undefined),
    enabled: !!selectedBranchId,
  });

  const totalDebt = rows.reduce((sum, r) => sum + BigInt(r.balance), 0n);

  const columns: Column<DebtRow>[] = [
    { header: "Mã KH", cell: (r) => r.customerCode },
    { header: "Khách thuê", cell: (r) => r.fullName },
    { header: "Số hóa đơn", cell: (r) => r.invoiceNo },
    { header: "Hạn trả", cell: (r) => r.dueDate ?? "—" },
    { header: "Còn nợ", cell: (r) => <span className="font-medium text-red-600">{formatVnd(r.balance)}</span> },
    { header: "Nhóm tuổi nợ", cell: (r) => <Badge tone={BUCKET_META[r.agingBucket].tone}>{BUCKET_META[r.agingBucket].label}</Badge> },
  ];

  return (
    <div>
      <PageHeader
        title="Công nợ"
        description="Danh sách các khoản khách còn nợ, tự động tính từ hóa đơn chưa thanh toán đủ và nhóm theo mức độ quá hạn."
      />

      {error && <Alert>{getErrorMessage(error)}</Alert>}
      {!isLoading && rows.length > 0 && (
        <p className="mb-3 text-sm text-slate-600">
          Tổng công nợ: <span className="font-semibold text-red-600">{formatVnd(totalDebt.toString())}</span> trên {rows.length} hóa đơn
        </p>
      )}
      {isLoading ? <LoadingState /> : <DataTable columns={columns} rows={rows} rowKey={(r) => r.invoiceId} emptyMessage="Không có công nợ" />}
    </div>
  );
}
