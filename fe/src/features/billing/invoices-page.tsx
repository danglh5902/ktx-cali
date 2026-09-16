import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Send } from "lucide-react";
import { DataTable, type Column } from "../../components/ui/data-table";
import { Alert } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { PageHeader } from "../../components/ui/page-header";
import { getErrorMessage } from "../../lib/errors";
import { formatVnd } from "../../lib/money";
import { useBranchContext } from "../property/branch-context";
import { invoicesApi } from "./api";
import type { Invoice, InvoiceStatus } from "./types";
import { LoadingState } from "../../components/ui/spinner";

const STATUS_META: Record<InvoiceStatus, { label: string; tone: "green" | "amber" | "red" | "slate" | "blue" }> = {
  DRAFT: { label: "Nháp", tone: "slate" },
  ISSUED: { label: "Đã phát hành", tone: "blue" },
  PARTIAL: { label: "Trả một phần", tone: "amber" },
  PAID: { label: "Đã trả đủ", tone: "green" },
  OVERDUE: { label: "Quá hạn", tone: "red" },
  VOID: { label: "Đã hủy", tone: "slate" },
};

export function InvoicesPage() {
  const { selectedBranchId } = useBranchContext();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);

  const { data: invoices = [], isLoading, error } = useQuery({
    queryKey: ["invoices", selectedBranchId],
    queryFn: () => invoicesApi.list({ branchId: selectedBranchId ?? undefined }),
    enabled: !!selectedBranchId,
  });

  const issueMutation = useMutation({
    mutationFn: invoicesApi.issue,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoices"] }),
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const columns: Column<Invoice>[] = [
    { header: "Số hóa đơn", cell: (i) => <span className="font-medium">{i.invoiceNo}</span> },
    { header: "Kỳ", cell: (i) => `${i.periodFrom} → ${i.periodTo}` },
    { header: "Hạn trả", cell: (i) => i.dueDate ?? "—" },
    { header: "Tổng tiền", cell: (i) => formatVnd(i.grandTotal) },
    { header: "Đã trả", cell: (i) => formatVnd(i.paidAmount) },
    { header: "Còn nợ", cell: (i) => <span className={i.balance !== "0" ? "font-medium text-red-600" : ""}>{formatVnd(i.balance)}</span> },
    { header: "Trạng thái", cell: (i) => <Badge tone={STATUS_META[i.status].tone}>{STATUS_META[i.status].label}</Badge> },
    {
      header: "",
      className: "text-right",
      cell: (i) =>
        i.status === "DRAFT" && (
          <button
            onClick={() => {
              setFormError(null);
              issueMutation.mutate(i.id);
            }}
            className="rounded p-1.5 text-blue-600 hover:bg-blue-50"
            title="Phát hành hóa đơn"
          >
            <Send size={15} />
          </button>
        ),
    },
  ];

  return (
    <div>
      <PageHeader title="Hóa đơn" description="docs/09-module-billing.md §2-3 — hóa đơn sinh từ kỳ chốt, phát hành trước khi thu tiền." />
      {(error || formError) && <Alert>{formError ?? getErrorMessage(error)}</Alert>}
      {isLoading ? <LoadingState /> : <DataTable columns={columns} rows={invoices} rowKey={(i) => i.id} />}
    </div>
  );
}
