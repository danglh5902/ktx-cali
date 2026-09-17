import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Receipt, Lock } from "lucide-react";
import { Button } from "../../components/ui/button";
import { DataTable, type Column } from "../../components/ui/data-table";
import { Dialog } from "../../components/ui/dialog";
import { Alert } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { PageHeader } from "../../components/ui/page-header";
import { FormField, Input } from "../../components/ui/input";
import { getErrorMessage } from "../../lib/errors";
import { formatVnd } from "../../lib/money";
import { useBranchContext } from "../property/branch-context";
import { billingPeriodsApi } from "./api";
import type { BillingPeriod, BillingPeriodStatus } from "./types";
import { LoadingState } from "../../components/ui/spinner";

const STATUS_META: Record<BillingPeriodStatus, { label: string; tone: "green" | "amber" | "slate" | "blue" }> = {
  OPEN: { label: "Đang mở", tone: "blue" },
  GENERATING: { label: "Đang sinh hóa đơn", tone: "amber" },
  ISSUED: { label: "Đã sinh hóa đơn", tone: "green" },
  CLOSED: { label: "Đã đóng", tone: "slate" },
};

export function BillingPeriodsPage() {
  const { selectedBranchId } = useBranchContext();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [code, setCode] = useState("");
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { data: periods = [], isLoading, error } = useQuery({
    queryKey: ["billing-periods", selectedBranchId],
    queryFn: () => billingPeriodsApi.list(selectedBranchId ?? undefined),
    enabled: !!selectedBranchId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["billing-periods"] });
    queryClient.invalidateQueries({ queryKey: ["invoices"] });
  };

  const createMutation = useMutation({
    mutationFn: billingPeriodsApi.create,
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
      setCode("");
      setPeriodFrom("");
      setPeriodTo("");
      setDueDate("");
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const generateMutation = useMutation({
    mutationFn: billingPeriodsApi.generateInvoices,
    onSuccess: invalidate,
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const closeMutation = useMutation({
    mutationFn: billingPeriodsApi.close,
    onSuccess: invalidate,
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const columns: Column<BillingPeriod>[] = [
    { header: "Mã kỳ", cell: (p) => <span className="font-medium">{p.code}</span> },
    { header: "Từ ngày", cell: (p) => p.periodFrom },
    { header: "Đến ngày", cell: (p) => p.periodTo },
    { header: "Số hóa đơn", cell: (p) => p.invoiceCount },
    { header: "Tổng tiền", cell: (p) => formatVnd(p.totalAmount) },
    { header: "Trạng thái", cell: (p) => <Badge tone={STATUS_META[p.status].tone}>{STATUS_META[p.status].label}</Badge> },
    {
      header: "",
      className: "text-right",
      cell: (p) => (
        <div className="flex justify-end gap-1">
          {p.status === "OPEN" && (
            <button
              onClick={() => {
                setFormError(null);
                generateMutation.mutate(p.id);
              }}
              className="rounded p-1.5 text-blue-600 hover:bg-blue-50"
              title="Sinh hóa đơn cho các hợp đồng đang hiệu lực"
            >
              <Receipt size={15} />
            </button>
          )}
          {p.status === "ISSUED" && (
            <button
              onClick={() => {
                setFormError(null);
                closeMutation.mutate(p.id);
              }}
              className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
              title="Đóng kỳ"
            >
              <Lock size={15} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Kỳ chốt hóa đơn"
        description="Tạo kỳ tính tiền cho chi nhánh, sau đó hệ thống tự sinh hóa đơn cho toàn bộ hợp đồng đang thuê trong kỳ đó."
        actions={
          <Button
            disabled={!selectedBranchId}
            onClick={() => {
              setFormError(null);
              setDialogOpen(true);
            }}
          >
            <Plus size={16} /> Tạo kỳ mới
          </Button>
        }
      />

      {(error || formError) && <Alert>{formError ?? getErrorMessage(error)}</Alert>}
      {isLoading ? <LoadingState /> : <DataTable columns={columns} rows={periods} rowKey={(p) => p.id} />}

      {selectedBranchId && (
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Tạo kỳ chốt hóa đơn">
          <div className="space-y-4">
            <FormField label="Mã kỳ" required>
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="TD-2026-09" />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Từ ngày" required>
                <Input type="date" value={periodFrom} onChange={(e) => setPeriodFrom(e.target.value)} />
              </FormField>
              <FormField label="Đến ngày" required>
                <Input type="date" value={periodTo} onChange={(e) => setPeriodTo(e.target.value)} />
              </FormField>
            </div>
            <FormField label="Hạn thanh toán">
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setDialogOpen(false)}>
                Hủy
              </Button>
              <Button
                disabled={!code || !periodFrom || !periodTo}
                loading={createMutation.isPending}
                onClick={() =>
                  selectedBranchId &&
                  createMutation.mutate({ branchId: selectedBranchId, code, periodFrom, periodTo, dueDate: dueDate || undefined })
                }
              >
                Tạo kỳ
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
