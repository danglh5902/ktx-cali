export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "VIETQR" | "CARD";

export interface PaymentAllocation {
  invoiceId: string;
  amount: string;
}

export interface Payment {
  id: string;
  branchId: string;
  paymentNo: string;
  customerId: string;
  payerName: string | null;
  amount: string;
  method: PaymentMethod;
  bankRef: string | null;
  allocatedAmount: string;
  unallocatedAmount: string;
  status: string;
  receivedAt: string;
  allocations?: PaymentAllocation[];
}

export interface CreatePaymentInput {
  customerId: string;
  branchId: string;
  amount: string;
  method: PaymentMethod;
  payerName?: string;
  bankRef?: string;
  note?: string;
}
