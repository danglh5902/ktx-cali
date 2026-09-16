export type BookingStatus = "NEW" | "CONFIRMED" | "DEPOSIT_PAID" | "CHECKED_IN" | "CANCELLED" | "EXPIRED" | "NO_SHOW";

export interface Booking {
  id: string;
  branchId: string;
  bookingNo: string;
  customerId: string;
  bedId: string | null;
  roomId: string | null;
  expectedCheckInDate: string;
  quotedPrice: string | null;
  depositRequired: string | null;
  depositPaid: string | null;
  holdUntil: string;
  status: BookingStatus;
  contractId: string | null;
  cancelReason: string | null;
}

export interface CreateBookingInput {
  branchId: string;
  customerId: string;
  bedId?: string;
  expectedCheckInDate: string;
  expectedDurationMonths?: number;
  quotedPrice?: string;
  depositRequired?: string;
  holdHours: number;
  source?: string;
}
