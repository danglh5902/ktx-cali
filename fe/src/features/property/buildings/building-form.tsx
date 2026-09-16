import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../../../components/ui/button";
import { FormField, Input } from "../../../components/ui/input";
import { Alert } from "../../../components/ui/alert";
import type { Building, CreateBuildingInput } from "./types";

const schema = z.object({
  code: z.string().min(1, "Bắt buộc"),
  name: z.string().min(1, "Bắt buộc"),
  genderPolicy: z.enum(["MALE", "FEMALE", "MIXED"]),
  hasElevator: z.boolean(),
  monthlyRentCost: z.string().optional(),
  address: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function BuildingForm({
  branchId,
  building,
  onSubmit,
  onCancel,
  submitError,
  isSubmitting,
}: {
  branchId: string;
  building?: Building;
  onSubmit: (input: CreateBuildingInput) => void;
  onCancel: () => void;
  submitError?: string | null;
  isSubmitting?: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: building
      ? {
          code: building.code,
          name: building.name,
          genderPolicy: building.genderPolicy ?? "MIXED",
          hasElevator: building.hasElevator,
          monthlyRentCost: building.monthlyRentCost ?? undefined,
          address: building.address ?? undefined,
        }
      : { genderPolicy: "MIXED", hasElevator: false },
  });

  const submit = (values: FormValues) => {
    onSubmit({ branchId, ...values, monthlyRentCost: values.monthlyRentCost || undefined, address: values.address || undefined });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      {submitError && <Alert>{submitError}</Alert>}

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Mã tòa" required error={errors.code?.message}>
          <Input {...register("code")} disabled={!!building} placeholder="A" />
        </FormField>
        <FormField label="Tên tòa" required error={errors.name?.message}>
          <Input {...register("name")} placeholder="Tòa A" />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Chính sách giới tính" error={errors.genderPolicy?.message}>
          <select {...register("genderPolicy")} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="MIXED">Hỗn hợp</option>
            <option value="MALE">Nam</option>
            <option value="FEMALE">Nữ</option>
          </select>
        </FormField>
        <FormField label="Chi phí thuê/tháng (đồng)" error={errors.monthlyRentCost?.message}>
          <Input inputMode="numeric" {...register("monthlyRentCost")} placeholder="150000000" />
        </FormField>
      </div>

      <FormField label="Địa chỉ (nếu khác chi nhánh)" error={errors.address?.message}>
        <Input {...register("address")} />
      </FormField>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" {...register("hasElevator")} className="h-4 w-4 rounded border-slate-300" />
        Có thang máy
      </label>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Lưu
        </Button>
      </div>
    </form>
  );
}
