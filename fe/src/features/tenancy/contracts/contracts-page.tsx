import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { LogIn, LogOut, Plus } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { DataTable, type Column } from "../../../components/ui/data-table";
import { Dialog } from "../../../components/ui/dialog";
import { Alert } from "../../../components/ui/alert";
import { Badge } from "../../../components/ui/badge";
import { PageHeader } from "../../../components/ui/page-header";
import { getErrorMessage } from "../../../lib/errors";
import { formatVnd } from "../../../lib/money";
import { useBranchContext } from "../../property/branch-context";
import { contractsApi } from "./api";
import { ContractForm } from "./contract-form";
import { CONTRACT_STATUS_META } from "./contract-status";
import type { CheckOutContractInput, Contract } from "./types";
import { LoadingState } from "../../../components/ui/spinner";

export function ContractsPage() {
  const { selectedBranchId } = useBranchContext();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState<Contract | null>(null);
  const [terminationReason, setTerminationReason] = useState("");
  const [terminationType, setTerminationType] = useState<CheckOutContractInput["terminationType"]>("MUTUAL");
  const [formError, setFormError] = useState<string | null>(null);

  const { data: contracts = [], isLoading, error } = useQuery({
    queryKey: ["contracts", selectedBranchId],
    queryFn: () => contractsApi.list({ branchId: selectedBranchId ?? undefined }),
    enabled: !!selectedBranchId,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["contracts"] });
    queryClient.invalidateQueries({ queryKey: ["beds"] });
    queryClient.invalidateQueries({ queryKey: ["customers"] });
  };

  const createMutation = useMutation({
    mutationFn: contractsApi.create,
    onSuccess: () => {
      invalidateAll();
      setDialogOpen(false);
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const checkInMutation = useMutation({
    mutationFn: contractsApi.checkIn,
    onSuccess: invalidateAll,
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const checkOutMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CheckOutContractInput }) => contractsApi.checkOut(id, input),
    onSuccess: () => {
      invalidateAll();
      setCheckingOut(null);
      setTerminationReason("");
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const columns: Column<Contract>[] = [
    { header: "Số HĐ", cell: (c) => <span className="font-medium">{c.contractNo}</span> },
    { header: "Từ ngày", cell: (c) => c.startDate },
    { header: "Đến ngày", cell: (c) => c.endDate },
    { header: "Tiền thuê/tháng", cell: (c) => formatVnd(c.monthlyRent) },
    { header: "Tiền cọc", cell: (c) => formatVnd(c.depositAmount) },
    {
      header: "Trạng thái",
      cell: (c) => {
        const meta = CONTRACT_STATUS_META[c.status];
        return <Badge tone={meta.tone}>{meta.label}</Badge>;
      },
    },
    {
      header: "",
      className: "text-right",
      cell: (c) => (
        <div className="flex justify-end gap-1">
          {(c.status === "DRAFT" || c.status === "PENDING_APPROVAL") && (
            <button
              onClick={() => {
                setFormError(null);
                checkInMutation.mutate(c.id);
              }}
              className="rounded p-1.5 text-green-600 hover:bg-green-50"
              title="Check-in"
            >
              <LogIn size={15} />
            </button>
          )}
          {(c.status === "ACTIVE" || c.status === "EXPIRING") && (
            <button
              onClick={() => {
                setFormError(null);
                setCheckingOut(c);
              }}
              className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
              title="Check-out"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Hợp đồng"
        description="docs/08-module-contracts.md §3-4 — check-in mở giường + tạo cọc, check-out trả giường."
        actions={
          <Button
            disabled={!selectedBranchId}
            onClick={() => {
              setFormError(null);
              setDialogOpen(true);
            }}
          >
            <Plus size={16} /> Lập hợp đồng
          </Button>
        }
      />

      {(error || formError) && <Alert>{formError ?? getErrorMessage(error)}</Alert>}
      {isLoading ? <LoadingState /> : <DataTable columns={columns} rows={contracts} rowKey={(c) => c.id} />}

      {selectedBranchId && (
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Lập hợp đồng mới">
          <ContractForm
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

      <Dialog open={!!checkingOut} onClose={() => setCheckingOut(null)} title={`Check-out hợp đồng ${checkingOut?.contractNo}`}>
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Hình thức chấm dứt</span>
            <select
              value={terminationType}
              onChange={(e) => setTerminationType(e.target.value as CheckOutContractInput["terminationType"])}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="MUTUAL">Thỏa thuận hai bên</option>
              <option value="BY_TENANT">Khách chủ động</option>
              <option value="BY_LANDLORD">Chủ nhà chủ động</option>
              <option value="ABANDONMENT">Bỏ trốn</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Ghi chú</span>
            <textarea
              value={terminationReason}
              onChange={(e) => setTerminationReason(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCheckingOut(null)}>
              Hủy
            </Button>
            <Button
              loading={checkOutMutation.isPending}
              onClick={() =>
                checkingOut &&
                checkOutMutation.mutate({
                  id: checkingOut.id,
                  input: {
                    terminationType,
                    terminationReason: terminationReason || undefined,
                    checkOutDate: new Date().toISOString().slice(0, 10),
                  },
                })
              }
            >
              Xác nhận check-out
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
