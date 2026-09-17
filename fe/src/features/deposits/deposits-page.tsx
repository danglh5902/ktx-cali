import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, DollarSign, Plus } from "lucide-react";
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
import { ContractSelect } from "../tenancy/contracts/contract-select";
import { depositsApi } from "./api";
import type { DepositEntry, DepositEntryStatus } from "./types";
import { LoadingState } from "../../components/ui/spinner";

const STATUS_META: Record<DepositEntryStatus, { label: string; tone: "green" | "amber" | "red" | "slate" }> = {
  PENDING: { label: "Chờ duyệt", tone: "amber" },
  APPROVED: { label: "Đã duyệt — chờ chi", tone: "slate" },
  EXECUTED: { label: "Đã thực hiện", tone: "green" },
  REJECTED: { label: "Từ chối", tone: "red" },
};

export function DepositsPage() {
  const { selectedBranchId } = useBranchContext();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [contractId, setContractId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { data: entries = [], isLoading, error } = useQuery({
    queryKey: ["deposit-refunds-pending", selectedBranchId],
    queryFn: () => depositsApi.listPendingRefunds(selectedBranchId ?? undefined),
    enabled: !!selectedBranchId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["deposit-refunds-pending"] });

  const requestMutation = useMutation({
    mutationFn: ({ id, amount: amt, reason: r }: { id: string; amount: string; reason: string }) => depositsApi.requestRefund(id, { amount: amt, reason: r }),
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
      setContractId(null);
      setAmount("");
      setReason("");
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const approveMutation = useMutation({
    mutationFn: depositsApi.approve,
    onSuccess: invalidate,
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const executeMutation = useMutation({
    mutationFn: depositsApi.execute,
    onSuccess: invalidate,
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const columns: Column<DepositEntry>[] = [
    { header: "Mã bút toán", cell: (e) => <span className="font-medium">{e.entryNo}</span> },
    { header: "Số tiền", cell: (e) => formatVnd(e.amount) },
    { header: "Lý do", cell: (e) => e.reason ?? "—" },
    { header: "Trạng thái", cell: (e) => <Badge tone={STATUS_META[e.status].tone}>{STATUS_META[e.status].label}</Badge> },
    {
      header: "",
      className: "text-right",
      cell: (e) => (
        <div className="flex justify-end gap-1">
          {e.status === "PENDING" && (
            <button onClick={() => approveMutation.mutate(e.id)} className="rounded p-1.5 text-blue-600 hover:bg-blue-50" title="Duyệt">
              <Check size={15} />
            </button>
          )}
          {e.status === "APPROVED" && (
            <button onClick={() => executeMutation.mutate(e.id)} className="rounded p-1.5 text-green-600 hover:bg-green-50" title="Xác nhận đã chi">
              <DollarSign size={15} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Tiền cọc"
        description="Theo dõi tiền cọc của từng khách. Muốn hoàn cọc phải gửi đề nghị, chờ duyệt rồi mới chi tiền — không chi trực tiếp."
        actions={
          <Button
            disabled={!selectedBranchId}
            onClick={() => {
              setFormError(null);
              setDialogOpen(true);
            }}
          >
            <Plus size={16} /> Đề nghị hoàn cọc
          </Button>
        }
      />

      {(error || formError) && <Alert>{formError ?? getErrorMessage(error)}</Alert>}
      {isLoading ? <LoadingState /> : <DataTable columns={columns} rows={entries} rowKey={(e) => e.id} emptyMessage="Không có yêu cầu hoàn cọc nào đang chờ xử lý" />}

      {selectedBranchId && (
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Đề nghị hoàn/khấu trừ cọc">
          <div className="space-y-4">
            <FormField label="Hợp đồng" required>
              <ContractSelect branchId={selectedBranchId} value={contractId} onChange={setContractId} />
            </FormField>
            <FormField label="Số tiền hoàn (đ)" required>
              <Input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="2000000" />
            </FormField>
            <FormField label="Lý do" required>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setDialogOpen(false)}>
                Hủy
              </Button>
              <Button
                disabled={!contractId || !amount || !reason.trim()}
                loading={requestMutation.isPending}
                onClick={() => contractId && requestMutation.mutate({ id: contractId, amount: amount.replace(/[^\d]/g, ""), reason })}
              >
                Gửi đề nghị
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
