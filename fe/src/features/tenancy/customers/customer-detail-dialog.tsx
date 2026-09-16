import { useQuery } from "@tanstack/react-query";
import { Dialog } from "../../../components/ui/dialog";
import { Badge } from "../../../components/ui/badge";
import { DataTable, type Column } from "../../../components/ui/data-table";
import { LoadingState } from "../../../components/ui/spinner";
import { Alert } from "../../../components/ui/alert";
import { getErrorMessage } from "../../../lib/errors";
import { formatVnd } from "../../../lib/money";
import { useBranchContext } from "../../property/branch-context";
import { bookingsApi } from "../bookings/api";
import { BOOKING_STATUS_META } from "../bookings/booking-status";
import type { Booking } from "../bookings/types";
import { contractsApi } from "../contracts/api";
import { CONTRACT_STATUS_META } from "../contracts/contract-status";
import type { Contract } from "../contracts/types";
import { paymentsApi } from "../../payments/api";
import type { Payment } from "../../payments/types";
import { customersApi } from "./api";
import { CUSTOMER_STATUS_META } from "./customer-status";

const GENDER_LABEL = { MALE: "Nam", FEMALE: "Nữ", OTHER: "Khác" } as const;
const PAYMENT_METHOD_LABEL: Record<Payment["method"], string> = {
  CASH: "Tiền mặt",
  BANK_TRANSFER: "Chuyển khoản",
  VIETQR: "VietQR",
  CARD: "Thẻ",
};

/** Xem đầy đủ hồ sơ 1 khách thuê — thông tin cá nhân + lịch sử đặt chỗ/hợp đồng/thanh toán. */
export function CustomerDetailDialog({ customerId, onClose }: { customerId: string | null; onClose: () => void }) {
  const { branches } = useBranchContext();

  const { data: customer, isLoading: loadingCustomer, error: customerError } = useQuery({
    queryKey: ["customers", "detail", customerId],
    queryFn: () => customersApi.getById(customerId!),
    enabled: !!customerId,
  });

  const { data: bookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ["bookings", "byCustomer", customerId],
    queryFn: () => bookingsApi.list({ customerId: customerId! }),
    enabled: !!customerId,
  });

  const { data: contracts = [], isLoading: loadingContracts } = useQuery({
    queryKey: ["contracts", "byCustomer", customerId],
    queryFn: () => contractsApi.list({ customerId: customerId! }),
    enabled: !!customerId,
  });

  const { data: payments = [], isLoading: loadingPayments } = useQuery({
    queryKey: ["payments", "byCustomer", customerId],
    queryFn: () => paymentsApi.list({ customerId: customerId! }),
    enabled: !!customerId,
  });

  const branchName = branches.find((b) => b.id === customer?.currentBranchId)?.name;

  const bookingColumns: Column<Booking>[] = [
    { header: "Mã đặt chỗ", cell: (b) => b.bookingNo },
    { header: "Ngày vào ở dự kiến", cell: (b) => b.expectedCheckInDate },
    { header: "Trạng thái", cell: (b) => <Badge tone={BOOKING_STATUS_META[b.status].tone}>{BOOKING_STATUS_META[b.status].label}</Badge> },
  ];

  const contractColumns: Column<Contract>[] = [
    { header: "Số HĐ", cell: (c) => c.contractNo },
    { header: "Từ ngày", cell: (c) => c.startDate },
    { header: "Đến ngày", cell: (c) => c.endDate },
    { header: "Tiền thuê/tháng", cell: (c) => formatVnd(c.monthlyRent) },
    { header: "Trạng thái", cell: (c) => <Badge tone={CONTRACT_STATUS_META[c.status].tone}>{CONTRACT_STATUS_META[c.status].label}</Badge> },
  ];

  const paymentColumns: Column<Payment>[] = [
    { header: "Số phiếu thu", cell: (p) => p.paymentNo },
    { header: "Số tiền", cell: (p) => formatVnd(p.amount) },
    { header: "Hình thức", cell: (p) => PAYMENT_METHOD_LABEL[p.method] },
    { header: "Thời gian", cell: (p) => new Date(p.receivedAt).toLocaleString("vi-VN") },
  ];

  return (
    <Dialog open={!!customerId} onClose={onClose} title={customer ? `${customer.customerCode} — ${customer.fullName}` : "Hồ sơ khách thuê"} size="lg">
      {customerError && <Alert>{getErrorMessage(customerError)}</Alert>}
      {loadingCustomer || !customer ? (
        <LoadingState />
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={CUSTOMER_STATUS_META[customer.status].tone}>{CUSTOMER_STATUS_META[customer.status].label}</Badge>
            {customer.isBlacklisted && customer.blacklistReason && (
              <span className="text-xs text-red-600">Lý do: {customer.blacklistReason}</span>
            )}
          </div>

          <section className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            <Field label="Giới tính" value={GENDER_LABEL[customer.gender]} />
            <Field label="Ngày sinh" value={customer.dateOfBirth} />
            <Field label="Số CCCD/CMND" value={customer.idNumber} />
            <Field label="Số điện thoại" value={customer.phone} />
            <Field label="Email" value={customer.email} />
            <Field
              label="Nghề nghiệp"
              value={customer.occupation === "STUDENT" ? "Sinh viên" : customer.occupation === "EMPLOYEE" ? "Nhân viên" : customer.occupation === "OTHER" ? "Khác" : null}
            />
            <Field label="Trường học" value={customer.school} />
            <Field label="Công ty" value={customer.company} />
            <Field label="Số dư credit" value={formatVnd(customer.creditBalance)} />
          </section>

          {customer.emergencyContact && (
            <section>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Liên hệ khẩn cấp</h3>
              <p className="text-sm text-slate-700">
                {customer.emergencyContact.name}
                {customer.emergencyContact.relationship && ` (${customer.emergencyContact.relationship})`} —{" "}
                {customer.emergencyContact.phone}
                {customer.emergencyContact.address && ` — ${customer.emergencyContact.address}`}
              </p>
            </section>
          )}

          <section>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Đang ở</h3>
            {customer.currentBedId ? (
              <p className="text-sm text-slate-700">Chi nhánh: {branchName ?? "—"}</p>
            ) : (
              <p className="text-sm text-slate-500">Hiện không ở tại chi nhánh nào.</p>
            )}
          </section>

          <section>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Đặt chỗ ({bookings.length})</h3>
            {loadingBookings ? <LoadingState /> : <DataTable columns={bookingColumns} rows={bookings} rowKey={(b) => b.id} emptyMessage="Chưa có đặt chỗ nào" />}
          </section>

          <section>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Hợp đồng ({contracts.length})</h3>
            {loadingContracts ? <LoadingState /> : <DataTable columns={contractColumns} rows={contracts} rowKey={(c) => c.id} emptyMessage="Chưa có hợp đồng nào" />}
          </section>

          <section>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Thanh toán ({payments.length})</h3>
            {loadingPayments ? <LoadingState /> : <DataTable columns={paymentColumns} rows={payments} rowKey={(p) => p.id} emptyMessage="Chưa có thanh toán nào" />}
          </section>
        </div>
      )}
    </Dialog>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-slate-800">{value || "—"}</div>
    </div>
  );
}
