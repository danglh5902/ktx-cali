import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../../../components/ui/button";
import { FormField, Input } from "../../../components/ui/input";
import { Alert } from "../../../components/ui/alert";
import type { Branch, CreateBranchInput } from "./types";

const schema = z.object({
  code: z
    .string()
    .min(1, "Bắt buộc")
    .max(10)
    .regex(/^[A-Z0-9]+$/, "Chỉ chữ hoa và số"),
  name: z.string().min(1, "Bắt buộc"),
  shortName: z.string().optional(),
  street: z.string().min(1, "Bắt buộc"),
  ward: z.string().optional(),
  district: z.string().optional(),
  province: z.string().min(1, "Bắt buộc"),
  region: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  genderPolicy: z.enum(["MALE", "FEMALE", "MIXED"]),
  billingDayOfMonth: z.coerce.number().int().min(1).max(31),
  dueDayOfMonth: z.coerce.number().int().min(1).max(31),
});
type FormValues = z.infer<typeof schema>;

function toFormValues(branch?: Branch): Partial<FormValues> {
  if (!branch) return { genderPolicy: "MIXED", billingDayOfMonth: 28, dueDayOfMonth: 10 };
  return {
    code: branch.code,
    name: branch.name,
    shortName: branch.shortName ?? undefined,
    street: branch.address?.street ?? "",
    ward: branch.address?.ward,
    district: branch.address?.district,
    province: branch.address?.province ?? "",
    region: branch.region ?? undefined,
    phone: branch.phone ?? undefined,
    email: branch.email ?? undefined,
    genderPolicy: branch.genderPolicy,
    billingDayOfMonth: branch.billingDayOfMonth,
    dueDayOfMonth: branch.dueDayOfMonth,
  };
}

export function BranchForm({
  branch,
  onSubmit,
  onCancel,
  submitError,
  isSubmitting,
}: {
  branch?: Branch;
  onSubmit: (input: CreateBranchInput) => void;
  onCancel: () => void;
  submitError?: string | null;
  isSubmitting?: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: toFormValues(branch) });

  const submit = (values: FormValues) => {
    onSubmit({
      code: values.code,
      name: values.name,
      shortName: values.shortName || undefined,
      address: { street: values.street, ward: values.ward, district: values.district, province: values.province },
      region: values.region || undefined,
      phone: values.phone || undefined,
      email: values.email || undefined,
      genderPolicy: values.genderPolicy,
      billingDayOfMonth: values.billingDayOfMonth,
      dueDayOfMonth: values.dueDayOfMonth,
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      {submitError && <Alert>{submitError}</Alert>}

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Mã chi nhánh" required error={errors.code?.message}>
          <Input {...register("code")} disabled={!!branch} placeholder="TD" className="uppercase" />
        </FormField>
        <FormField label="Tên chi nhánh" required error={errors.name?.message}>
          <Input {...register("name")} placeholder="Cali Thủ Đức" />
        </FormField>
      </div>

      <FormField label="Tên viết tắt" error={errors.shortName?.message}>
        <Input {...register("shortName")} />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Số nhà, đường" required error={errors.street?.message}>
          <Input {...register("street")} />
        </FormField>
        <FormField label="Tỉnh/Thành phố" required error={errors.province?.message}>
          <Input {...register("province")} />
        </FormField>
        <FormField label="Phường/Xã" error={errors.ward?.message}>
          <Input {...register("ward")} />
        </FormField>
        <FormField label="Quận/Huyện" error={errors.district?.message}>
          <Input {...register("district")} />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Điện thoại" error={errors.phone?.message}>
          <Input {...register("phone")} />
        </FormField>
        <FormField label="Email" error={errors.email?.message}>
          <Input type="email" {...register("email")} />
        </FormField>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <FormField label="Chính sách giới tính" required error={errors.genderPolicy?.message}>
          <select {...register("genderPolicy")} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="MIXED">Hỗn hợp</option>
            <option value="MALE">Nam</option>
            <option value="FEMALE">Nữ</option>
          </select>
        </FormField>
        <FormField label="Ngày chốt kỳ" required error={errors.billingDayOfMonth?.message}>
          <Input type="number" min={1} max={31} {...register("billingDayOfMonth")} />
        </FormField>
        <FormField label="Hạn thanh toán" required error={errors.dueDayOfMonth?.message}>
          <Input type="number" min={1} max={31} {...register("dueDayOfMonth")} />
        </FormField>
      </div>

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
