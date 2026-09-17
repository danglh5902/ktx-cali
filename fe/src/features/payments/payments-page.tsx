import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "../../components/ui/button";
import { DataTable, type Column } from "../../components/ui/data-table";
import { Dialog } from "../../components/ui/dialog";
import { Alert } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { PageHeader } from "../../components/ui/page-header";
import { getErrorMessage } from "../../lib/errors";
import { formatVnd } from "../../lib/money";
import { useBranchContext } from "../property/branch-context";
import { paymentsApi } from "./api";
import { PaymentForm } from "./payment-form";
import type { Payment } from "./types";
import { LoadingState } from "../../components/ui/spinner";

const METHOD_LABEL: Record<Payment["method"], string> = {
  CASH: "Tiền mặt",
  BANK_TRANSFER: "Chuyển khoản",
  VIETQR: "VietQR",
  CARD: "Thẻ",
};

export function PaymentsPage() {
  const { selectedBranchId } = useBranchContext();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: payments = [], isLoading, error } = useQuery({
    queryKey: ["payments", selectedBranchId],
    queryFn: () => paymentsApi.list({ branchId: selectedBranchId ?? undefined }),
    enabled: !!selectedBranchId,
  });

  const createMutation = useMutation({
    mutationFn: paymentsApi.record,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      setDialogOpen(false);
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const columns: Column<Payment>[] = [
    { header: "Số phiếu thu", cell: (p) => <span className="font-medium">{p.paymentNo}</span> },
    { header: "Người nộp", cell: (p) => p.payerName ?? "—" },
    { header: "Hình thức", cell: (p) => <Badge tone="blue">{METHOD_LABEL[p.method]}</Badge> },
    { header: "Số tiền", cell: (p) => formatVnd(p.amount) },
    { header: "Đã phân bổ", cell: (p) => formatVnd(p.allocatedAmount) },
    { header: "Chưa phân bổ", cell: (p) => formatVnd(p.unallocatedAmount) },
    { header: "Thời gian", cell: (p) => new Date(p.receivedAt).toLocaleString("vi-VN") },
  ];

  return (
    <div>
      <PageHeader
        title="Thanh toán"
        description="Ghi nhận các khoản khách đã thanh toán. Hệ thống tự động trừ vào hóa đơn nợ lâu nhất trước."
        actions={
          <Button
            disabled={!selectedBranchId}
            onClick={() => {
              setFormError(null);
              setDialogOpen(true);
            }}
          >
            <Plus size={16} /> Ghi nhận thanh toán
          </Button>
        }
      />

      {error && <Alert>{getErrorMessage(error)}</Alert>}
      {isLoading ? <LoadingState /> : <DataTable columns={columns} rows={payments} rowKey={(p) => p.id} />}

      {selectedBranchId && (
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Ghi nhận thanh toán">
          <PaymentForm
            branchId={selectedBranchId}
            submitError={formError}
            isSubmitting={createMutation.isPending}
            onCancel={() => setDialogOpen(false)}
            onSubmit={(input) => {
              setFormError(null);
              createMutation.mutate(input);
            }}
          />
        </Dialog>
      )}
    </div>
  );
}
