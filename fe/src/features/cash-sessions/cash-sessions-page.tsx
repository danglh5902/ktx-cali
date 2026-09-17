import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Lock, Plus } from "lucide-react";
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
import { cashSessionsApi } from "./api";
import type { CashSession } from "./types";
import { LoadingState } from "../../components/ui/spinner";

export function CashSessionsPage() {
  const { selectedBranchId } = useBranchContext();
  const queryClient = useQueryClient();
  const [openDialogOpen, setOpenDialogOpen] = useState(false);
  const [openingBalance, setOpeningBalance] = useState("500000");
  const [closing, setClosing] = useState<CashSession | null>(null);
  const [countedTotal, setCountedTotal] = useState("");
  const [varianceReason, setVarianceReason] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { data: sessions = [], isLoading, error } = useQuery({
    queryKey: ["cash-sessions", selectedBranchId],
    queryFn: () => cashSessionsApi.list(selectedBranchId ?? undefined),
    enabled: !!selectedBranchId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["cash-sessions"] });

  const openMutation = useMutation({
    mutationFn: () => cashSessionsApi.open(selectedBranchId!, openingBalance.replace(/[^\d]/g, "")),
    onSuccess: () => {
      invalidate();
      setOpenDialogOpen(false);
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const closeMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: { countedTotal: string; varianceReason?: string } }) => cashSessionsApi.close(id, input),
    onSuccess: () => {
      invalidate();
      setClosing(null);
      setCountedTotal("");
      setVarianceReason("");
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const columns: Column<CashSession>[] = [
    { header: "Mã ca", cell: (s) => <span className="font-medium">{s.sessionNo}</span> },
    { header: "Mở ca", cell: (s) => new Date(s.openedAt).toLocaleString("vi-VN") },
    { header: "Tồn đầu ca", cell: (s) => formatVnd(s.openingBalance) },
    { header: "Hệ thống ghi nhận", cell: (s) => formatVnd(s.systemTotal) },
    { header: "Kiểm đếm thực tế", cell: (s) => formatVnd(s.countedTotal) },
    {
      header: "Lệch quỹ",
      cell: (s) =>
        s.variance !== null ? (
          <span className={s.variance !== "0" ? "font-medium text-red-600" : "text-green-600"}>{formatVnd(s.variance)}</span>
        ) : (
          "—"
        ),
    },
    { header: "Trạng thái", cell: (s) => <Badge tone={s.status === "OPEN" ? "green" : "slate"}>{s.status === "OPEN" ? "Đang mở" : "Đã đóng"}</Badge> },
    {
      header: "",
      className: "text-right",
      cell: (s) =>
        s.status === "OPEN" && (
          <button
            onClick={() => {
              setFormError(null);
              setClosing(s);
            }}
            className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
            title="Đóng ca"
          >
            <Lock size={15} />
          </button>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Ca quỹ tiền mặt"
        description="Mỗi ca làm việc mở một phiên quỹ riêng. Khi đóng ca, phải đếm và đối chiếu tiền mặt thực tế với số hệ thống ghi nhận."
        actions={
          <Button
            disabled={!selectedBranchId}
            onClick={() => {
              setFormError(null);
              setOpenDialogOpen(true);
            }}
          >
            <Plus size={16} /> Mở ca
          </Button>
        }
      />

      {(error || formError) && <Alert>{formError ?? getErrorMessage(error)}</Alert>}
      {isLoading ? <LoadingState /> : <DataTable columns={columns} rows={sessions} rowKey={(s) => s.id} />}

      {selectedBranchId && (
        <Dialog open={openDialogOpen} onClose={() => setOpenDialogOpen(false)} title="Mở ca quỹ">
          <div className="space-y-4">
            <FormField label="Tồn quỹ đầu ca (đ)" required>
              <Input inputMode="numeric" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} />
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setOpenDialogOpen(false)}>
                Hủy
              </Button>
              <Button loading={openMutation.isPending} onClick={() => openMutation.mutate()}>
                Mở ca
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      <Dialog open={!!closing} onClose={() => setClosing(null)} title={`Đóng ca ${closing?.sessionNo}`}>
        <div className="space-y-4">
          <FormField label="Số tiền mặt kiểm đếm thực tế (đ)" required>
            <Input inputMode="numeric" value={countedTotal} onChange={(e) => setCountedTotal(e.target.value)} />
          </FormField>
          <FormField label="Lý do lệch quỹ (nếu có)">
            <textarea value={varianceReason} onChange={(e) => setVarianceReason(e.target.value)} rows={2} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setClosing(null)}>
              Hủy
            </Button>
            <Button
              disabled={!countedTotal}
              loading={closeMutation.isPending}
              onClick={() =>
                closing &&
                closeMutation.mutate({
                  id: closing.id,
                  input: { countedTotal: countedTotal.replace(/[^\d]/g, ""), varianceReason: varianceReason || undefined },
                })
              }
            >
              Xác nhận đóng ca
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
