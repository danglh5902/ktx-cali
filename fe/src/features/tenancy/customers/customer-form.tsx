import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../../../components/ui/button";
import { FormField, Input } from "../../../components/ui/input";
import { Alert } from "../../../components/ui/alert";
import type { CreateCustomerInput } from "./types";

const schema = z.object({
  fullName: z.string().min(1, "Bắt buộc"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  phone: z.string().min(1, "Bắt buộc"),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  idNumber: z.string().optional(),
  emergencyContactName: z.string().min(1, "Bắt buộc"),
  emergencyContactPhone: z.string().min(1, "Bắt buộc"),
  // Select rỗng gửi lên value="" (không phải undefined) — z.enum(...).optional()
  // một mình sẽ coi "" là giá trị không hợp lệ và chặn submit trong im lặng
  // (FormField này không hiển thị lỗi), nên phải chấp nhận cả "" rồi coi như
  // "không chọn" khi submit.
  occupation: z.enum(["STUDENT", "EMPLOYEE", "OTHER"]).optional().or(z.literal("")),
  school: z.string().optional(),
  company: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function CustomerForm({
  branchId,
  onSubmit,
  onCancel,
  submitError,
  isSubmitting,
}: {
  branchId: string;
  onSubmit: (input: CreateCustomerInput) => void;
  onCancel: () => void;
  submitError?: string | null;
  isSubmitting?: boolean;
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { gender: "MALE" } });

  const occupation = watch("occupation");

  const submit = (values: FormValues) =>
    onSubmit({
      branchId,
      fullName: values.fullName,
      gender: values.gender,
      phone: values.phone,
      email: values.email || undefined,
      idNumber: values.idNumber || undefined,
      idType: values.idNumber ? "CCCD" : undefined,
      emergencyContact: { name: values.emergencyContactName, phone: values.emergencyContactPhone },
      occupation: values.occupation || undefined,
      school: values.school || undefined,
      company: values.company || undefined,
    });

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      {submitError && <Alert>{submitError}</Alert>}
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Họ tên" required error={errors.fullName?.message}>
          <Input {...register("fullName")} placeholder="Nguyễn Văn A" />
        </FormField>
        <FormField label="Giới tính" required>
          <select {...register("gender")} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="MALE">Nam</option>
            <option value="FEMALE">Nữ</option>
            <option value="OTHER">Khác</option>
          </select>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Số điện thoại" required error={errors.phone?.message}>
          <Input {...register("phone")} placeholder="09xxxxxxxx" />
        </FormField>
        <FormField label="Email" error={errors.email?.message}>
          <Input type="email" {...register("email")} />
        </FormField>
      </div>
      <FormField label="Số CCCD/CMND" error={errors.idNumber?.message}>
        <Input {...register("idNumber")} />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Tên người liên hệ khẩn cấp" required error={errors.emergencyContactName?.message}>
          <Input {...register("emergencyContactName")} />
        </FormField>
        <FormField label="SĐT người liên hệ khẩn cấp" required error={errors.emergencyContactPhone?.message}>
          <Input {...register("emergencyContactPhone")} />
        </FormField>
      </div>
      <FormField label="Nghề nghiệp">
        <select {...register("occupation")} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="">— Không chọn —</option>
          <option value="STUDENT">Sinh viên</option>
          <option value="EMPLOYEE">Nhân viên</option>
          <option value="OTHER">Khác</option>
        </select>
      </FormField>
      {occupation === "STUDENT" && (
        <FormField label="Trường học">
          <Input {...register("school")} />
        </FormField>
      )}
      {occupation === "EMPLOYEE" && (
        <FormField label="Công ty">
          <Input {...register("company")} />
        </FormField>
      )}
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
