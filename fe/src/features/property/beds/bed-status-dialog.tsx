import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { FormField, Input } from "../../../components/ui/input";
import { Alert } from "../../../components/ui/alert";
import { Dialog } from "../../../components/ui/dialog";
import { Spinner } from "../../../components/ui/spinner";
import { formatVnd } from "../../../lib/money";
import { customersApi } from "../../tenancy/customers/api";
import { CustomerDetailDialog } from "../../tenancy/customers/customer-detail-dialog";
import { BED_STATUS_META, BED_STATUS_OPTIONS } from "./bed-status";
import type { Bed, BedStatus } from "./types";

const BED_TYPE_LABEL: Record<Bed["bedType"], string> = {
  SINGLE: "Đơn",
  BUNK_LOWER: "Tầng dưới",
  BUNK_UPPER: "Tầng trên",
  DOUBLE: "Đôi",
};

/** Các trạng thái giường có khả năng đang gắn với 1 khách thuê cụ thể. */
const OCCUPANT_STATUSES: BedStatus[] = ["OCCUPIED", "RESERVED", "CHECKOUT_PENDING"];

export function BedStatusDialog({
  bed,
  onClose,
  onSubmit,
  submitError,
  isSubmitting,
}: {
  bed: Bed | null;
  onClose: () => void;
  onSubmit: (status: BedStatus, blockedReason?: string) => void;
  submitError?: string | null;
  isSubmitting?: boolean;
}) {
  const [status, setStatus] = useState<BedStatus>("AVAILABLE");
  const [reason, setReason] = useState("");
  const [viewingCustomerId, setViewingCustomerId] = useState<string | null>(null);

  // Reset về đúng trạng thái hiện tại của giường mỗi khi mở dialog cho 1 giường khác.
  useEffect(() => {
    if (bed) {
      setStatus(bed.status);
      setReason("");
    }
  }, [bed]);

  const shouldLookupOccupant = !!bed && OCCUPANT_STATUSES.includes(bed.status);
  const { data: occupants = [], isLoading: loadingOccupant } = useQuery({
    queryKey: ["customers", "byBed", bed?.id],
    queryFn: () => customersApi.list({ bedId: bed!.id }),
    enabled: shouldLookupOccupant,
  });
  const occupant = occupants[0];

  if (!bed) return null;

  return (
    <Dialog open={!!bed} onClose={onClose} title={`Giường ${bed.code}`}>
      <div className="space-y-4">
        {submitError && <Alert>{submitError}</Alert>}
        <p className="text-sm text-slate-600">
          Trạng thái hiện tại: <strong>{BED_STATUS_META[bed.status].label}</strong>
        </p>
        <p className="text-sm text-slate-600">
          Loại giường: <strong>{BED_TYPE_LABEL[bed.bedType]}</strong> · Giá hiệu lực:{" "}
          <strong>{formatVnd(bed.effectivePrice)}</strong>
          {bed.priceOverride && <span className="text-xs text-amber-600"> (đã ghi đè riêng cho giường này)</span>}
        </p>

        {shouldLookupOccupant && (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            {loadingOccupant ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Spinner size={14} /> Đang tải thông tin khách...
              </div>
            ) : occupant ? (
              <button
                type="button"
                onClick={() => setViewingCustomerId(occupant.id)}
                className="flex w-full items-center justify-between gap-2 text-left"
              >
                <span className="flex items-center gap-2 text-sm">
                  <User size={15} className="text-slate-400" />
                  <span>
                    <strong>{occupant.fullName}</strong> ({occupant.customerCode}) — {occupant.phone}
                  </span>
                </span>
                <span className="whitespace-nowrap text-xs font-medium text-blue-600 hover:underline">Xem chi tiết →</span>
              </button>
            ) : (
              <p className="text-sm text-slate-500">Không tìm thấy khách đang gắn với giường này.</p>
            )}
          </div>
        )}

        <FormField label="Trạng thái mới" required>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as BedStatus)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {BED_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {BED_STATUS_META[s].label}
              </option>
            ))}
          </select>
        </FormField>

        {status === "BLOCKED" && (
          <FormField label="Lý do khóa" required>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Sửa điện, chờ thanh lý..." />
          </FormField>
        )}

        <p className="text-xs text-slate-400">
          RESERVED/OCCUPIED chỉ đạt được qua booking/check-in (chưa xây) — không có trong danh sách này.
        </p>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="button"
            disabled={status === "BLOCKED" && !reason}
            loading={isSubmitting}
            onClick={() => onSubmit(status, reason || undefined)}
          >
            Cập nhật
          </Button>
        </div>
      </div>

      <CustomerDetailDialog customerId={viewingCustomerId} onClose={() => setViewingCustomerId(null)} />
    </Dialog>
  );
}
