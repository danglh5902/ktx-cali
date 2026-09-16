import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../../components/ui/button";
import { FormField, Input } from "../../components/ui/input";
import { Alert } from "../../components/ui/alert";
import { parseVndInput } from "../../lib/money";
import { CustomerSelect } from "../tenancy/customers/customer-select";
import type { CreatePaymentInput } from "./types";

const schema = z.object({
  customerId: z.string().uuid("Chọn khách thuê"),
  amount: z.string().min(1, "Bắt buộc"),
  method: z.enum(["CASH", "BANK_TRANSFER", "VIETQR", "CARD"]),
  payerName: z.string().optional(),
  bankRef: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function PaymentForm({
  branchId,
  onSubmit,
  onCancel,
  submitError,
  isSubmitting,
}: {
  branchId: string;
  onSubmit: (input: CreatePaymentInput) => void;
  onCancel: () => void;
  submitError?: string | null;
  isSubmitting?: boolean;
}) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { method: "CASH" } });

  const method = watch("method");

  const submit = (values: FormValues) =>
    onSubmit({
      branchId,
      customerId: values.customerId,
      amount: parseVndInput(values.amount),
      method: values.method,
      payerName: values.payerName || undefined,
      bankRef: values.bankRef || undefined,
    });

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      {submitError && <Alert>{submitError}</Alert>}
      <FormField label="Khách thuê" required error={errors.customerId?.message}>
        <Controller name="customerId" control={control} render={({ field }) => <CustomerSelect value={field.value ?? null} onChange={(v) => field.onChange(v)} />} />
      </FormField>
      <FormField label="Số tiền (đ)" required error={errors.amount?.message}>
        <Input inputMode="numeric" {...register("amount")} placeholder="2000000" />
      </FormField>
      <FormField label="Hình thức" required>
        <select {...register("method")} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="CASH">Tiền mặt</option>
          <option value="BANK_TRANSFER">Chuyển khoản</option>
          <option value="VIETQR">VietQR</option>
          <option value="CARD">Thẻ</option>
        </select>
      </FormField>
      <FormField label="Người nộp">
        <Input {...register("payerName")} />
      </FormField>
      {method !== "CASH" && (
        <FormField label="Mã tham chiếu ngân hàng">
          <Input {...register("bankRef")} />
        </FormField>
      )}
      <p className="text-xs text-slate-500">Số tiền sẽ tự động phân bổ theo thứ tự hóa đơn đến hạn sớm nhất trước (FIFO).</p>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Ghi nhận thanh toán
        </Button>
      </div>
    </form>
  );
}
