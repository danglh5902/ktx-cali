import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { DataTable, type Column } from "../../../components/ui/data-table";
import { Dialog } from "../../../components/ui/dialog";
import { Alert } from "../../../components/ui/alert";
import { Badge } from "../../../components/ui/badge";
import { PageHeader } from "../../../components/ui/page-header";
import { getErrorMessage } from "../../../lib/errors";
import { formatVnd } from "../../../lib/money";
import { useBranchContext } from "../../property/branch-context";
import { BookingForm } from "./booking-form";
import { BOOKING_STATUS_META } from "./booking-status";
import { bookingsApi } from "./api";
import type { Booking } from "./types";
import { LoadingState } from "../../../components/ui/spinner";

export function BookingsPage() {
  const { selectedBranchId } = useBranchContext();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { data: bookings = [], isLoading, error } = useQuery({
    queryKey: ["bookings", selectedBranchId],
    queryFn: () => bookingsApi.list({ branchId: selectedBranchId ?? undefined }),
    enabled: !!selectedBranchId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["bookings"] });

  const createMutation = useMutation({
    mutationFn: bookingsApi.create,
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["beds"] });
      setDialogOpen(false);
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => bookingsApi.cancel(id, reason),
    onSuccess: () => {
      invalidate();
      setCancelling(null);
      setCancelReason("");
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const columns: Column<Booking>[] = [
    { header: "Mã đặt chỗ", cell: (b) => <span className="font-medium">{b.bookingNo}</span> },
    { header: "Ngày vào ở dự kiến", cell: (b) => b.expectedCheckInDate },
    { header: "Giá báo", cell: (b) => formatVnd(b.quotedPrice) },
    { header: "Giữ đến", cell: (b) => new Date(b.holdUntil).toLocaleString("vi-VN") },
    {
      header: "Trạng thái",
      cell: (b) => {
        const meta = BOOKING_STATUS_META[b.status];
        return <Badge tone={meta.tone}>{meta.label}</Badge>;
      },
    },
    {
      header: "",
      className: "text-right",
      cell: (b) =>
        (b.status === "NEW" || b.status === "CONFIRMED" || b.status === "DEPOSIT_PAID") && (
          <button
            onClick={() => {
              setCancelling(b);
              setFormError(null);
            }}
            className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
            title="Hủy đặt chỗ"
          >
            <X size={15} />
          </button>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Đặt chỗ"
        description="docs/08-module-contracts.md §2 — giữ giường tạm thời trước khi lập hợp đồng."
        actions={
          <Button
            disabled={!selectedBranchId}
            onClick={() => {
              setFormError(null);
              setDialogOpen(true);
            }}
          >
            <Plus size={16} /> Tạo đặt chỗ
          </Button>
        }
      />

      {error && <Alert>{getErrorMessage(error)}</Alert>}
      {isLoading ? <LoadingState /> : <DataTable columns={columns} rows={bookings} rowKey={(b) => b.id} />}

      {selectedBranchId && (
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Tạo đặt chỗ">
          <BookingForm
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

      <Dialog open={!!cancelling} onClose={() => setCancelling(null)} title={`Hủy đặt chỗ ${cancelling?.bookingNo}`}>
        {formError && <Alert>{formError}</Alert>}
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Lý do <span className="text-red-500">*</span>
            </span>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCancelling(null)}>
              Đóng
            </Button>
            <Button
              variant="danger"
              disabled={!cancelReason.trim()}
              loading={cancelMutation.isPending}
              onClick={() => cancelling && cancelMutation.mutate({ id: cancelling.id, reason: cancelReason })}
            >
              Xác nhận hủy
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
