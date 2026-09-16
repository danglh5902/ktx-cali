import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../../../components/ui/button";
import { FormField, Input } from "../../../components/ui/input";
import { Alert } from "../../../components/ui/alert";
import { parseVndInput } from "../../../lib/money";
import { AvailableBedMultiSelect } from "../../property/beds/available-bed-select";
import { CustomerSelect } from "../customers/customer-select";
import type { CreateContractInput } from "./types";

const schema = z.object({
  customerId: z.string().uuid("Chọn khách thuê"),
  bedIds: z.array(z.string().uuid()).min(1, "Chọn ít nhất 1 giường"),
  startDate: z.string().min(1, "Bắt buộc"),
  durationMonths: z.coerce.number().int().min(1),
  monthlyRent: z.string().min(1, "Bắt buộc"),
  depositAmount: z.string().min(1, "Bắt buộc"),
  billingCycle: z.enum(["MONTHLY", "QUARTERLY", "SEMESTER", "YEARLY"]),
  termsSnapshot: z.string().min(1, "Bắt buộc — toàn văn điều khoản tại thời điểm ký"),
});
type FormValues = z.infer<typeof schema>;

function addMonthsIso(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export function ContractForm({
  branchId,
  onSubmit,
  onCancel,
  submitError,
  isSubmitting,
}: {
  branchId: string;
  onSubmit: (input: CreateContractInput) => void;
  onCancel: () => void;
  submitError?: string | null;
  isSubmitting?: boolean;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      bedIds: [],
      durationMonths: 12,
      billingCycle: "MONTHLY",
      monthlyRent: "2000000",
      depositAmount: "2000000",
      termsSnapshot: "Hợp đồng thuê giường theo bảng giá niêm yết của chi nhánh.",
    },
  });

  const submit = (values: FormValues) =>
    onSubmit({
      branchId,
      customerId: values.customerId,
      bedIds: values.bedIds,
      startDate: values.startDate,
      endDate: addMonthsIso(values.startDate, values.durationMonths),
      durationMonths: values.durationMonths,
      monthlyRent: parseVndInput(values.monthlyRent),
      depositAmount: parseVndInput(values.depositAmount),
      billingCycle: values.billingCycle,
      termsSnapshot: values.termsSnapshot,
    });

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      {submitError && <Alert>{submitError}</Alert>}
      <FormField label="Khách thuê" required error={errors.customerId?.message}>
        <Controller name="customerId" control={control} render={({ field }) => <CustomerSelect value={field.value ?? null} onChange={(v) => field.onChange(v)} />} />
      </FormField>
      <FormField label="Chọn giường" required error={errors.bedIds?.message}>
        <Controller name="bedIds" control={control} render={({ field }) => <AvailableBedMultiSelect branchId={branchId} value={field.value} onChange={field.onChange} />} />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Ngày bắt đầu" required error={errors.startDate?.message}>
          <Input type="date" {...register("startDate")} />
        </FormField>
        <FormField label="Thời hạn (tháng)" required error={errors.durationMonths?.message}>
          <Input type="number" min={1} {...register("durationMonths")} />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Tiền thuê/tháng (đ)" required error={errors.monthlyRent?.message}>
          <Input inputMode="numeric" {...register("monthlyRent")} />
        </FormField>
        <FormField label="Tiền cọc (đ)" required error={errors.depositAmount?.message}>
          <Input inputMode="numeric" {...register("depositAmount")} />
        </FormField>
      </div>
      <FormField label="Chu kỳ thanh toán" required>
        <select {...register("billingCycle")} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="MONTHLY">Hàng tháng</option>
          <option value="QUARTERLY">Hàng quý</option>
          <option value="SEMESTER">Nửa năm</option>
          <option value="YEARLY">Hàng năm</option>
        </select>
      </FormField>
      <FormField label="Điều khoản hợp đồng" required error={errors.termsSnapshot?.message}>
        <textarea {...register("termsSnapshot")} rows={3} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </FormField>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Lập hợp đồng
        </Button>
      </div>
    </form>
  );
}
