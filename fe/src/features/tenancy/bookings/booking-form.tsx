import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../../../components/ui/button";
import { FormField, Input } from "../../../components/ui/input";
import { Alert } from "../../../components/ui/alert";
import { parseVndInput } from "../../../lib/money";
import { AvailableBedSelect } from "../../property/beds/available-bed-select";
import { CustomerSelect } from "../customers/customer-select";
import type { CreateBookingInput } from "./types";

const schema = z.object({
  customerId: z.string().uuid("Chọn khách thuê"),
  bedId: z.string().uuid().nullable(),
  expectedCheckInDate: z.string().min(1, "Bắt buộc"),
  expectedDurationMonths: z.coerce.number().int().min(1).optional(),
  quotedPrice: z.string().optional(),
  depositRequired: z.string().optional(),
  holdHours: z.coerce.number().int().min(1).max(168),
});
type FormValues = z.infer<typeof schema>;

export function BookingForm({
  branchId,
  onSubmit,
  onCancel,
  submitError,
  isSubmitting,
}: {
  branchId: string;
  onSubmit: (input: CreateBookingInput) => void;
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
    defaultValues: { bedId: null, holdHours: 48, expectedDurationMonths: 12 },
  });

  const submit = (values: FormValues) =>
    onSubmit({
      branchId,
      customerId: values.customerId,
      bedId: values.bedId ?? undefined,
      expectedCheckInDate: values.expectedCheckInDate,
      expectedDurationMonths: values.expectedDurationMonths,
      quotedPrice: values.quotedPrice ? parseVndInput(values.quotedPrice) : undefined,
      depositRequired: values.depositRequired ? parseVndInput(values.depositRequired) : undefined,
      holdHours: values.holdHours,
    });

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      {submitError && <Alert>{submitError}</Alert>}
      <FormField label="Khách thuê" required error={errors.customerId?.message}>
        <Controller name="customerId" control={control} render={({ field }) => <CustomerSelect value={field.value ?? null} onChange={(v) => field.onChange(v)} />} />
      </FormField>
      <FormField label="Giường muốn giữ">
        <Controller name="bedId" control={control} render={({ field }) => <AvailableBedSelect branchId={branchId} value={field.value} onChange={field.onChange} />} />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Ngày dự kiến vào ở" required error={errors.expectedCheckInDate?.message}>
          <Input type="date" {...register("expectedCheckInDate")} />
        </FormField>
        <FormField label="Thời hạn dự kiến (tháng)">
          <Input type="number" min={1} {...register("expectedDurationMonths")} />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Giá báo (đ)">
          <Input inputMode="numeric" {...register("quotedPrice")} placeholder="2000000" />
        </FormField>
        <FormField label="Cọc yêu cầu (đ)">
          <Input inputMode="numeric" {...register("depositRequired")} placeholder="2000000" />
        </FormField>
      </div>
      <FormField label="Giữ chỗ trong (giờ)" required error={errors.holdHours?.message}>
        <Input type="number" min={1} max={168} {...register("holdHours")} />
      </FormField>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Giữ chỗ
        </Button>
      </div>
    </form>
  );
}
