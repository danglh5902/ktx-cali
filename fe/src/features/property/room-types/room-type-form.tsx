import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../../../components/ui/button";
import { FormField, Input } from "../../../components/ui/input";
import { Alert } from "../../../components/ui/alert";
import { parseVndInput } from "../../../lib/money";
import type { CreateRoomTypeInput, RoomType } from "./types";

const schema = z.object({
  code: z.string().min(1, "Bắt buộc"),
  name: z.string().min(1, "Bắt buộc"),
  capacity: z.coerce.number().int().min(1),
  basePrice: z.string().min(1, "Bắt buộc"),
  bunkLowerPrice: z.string().optional(),
  bunkUpperPrice: z.string().optional(),
  wholeRoomPrice: z.string().optional(),
  description: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function RoomTypeForm({
  branchId,
  roomType,
  onSubmit,
  onCancel,
  submitError,
  isSubmitting,
}: {
  branchId: string;
  roomType?: RoomType;
  onSubmit: (input: CreateRoomTypeInput) => void;
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
    defaultValues: roomType
      ? {
          code: roomType.code,
          name: roomType.name,
          capacity: roomType.capacity,
          basePrice: roomType.basePrice,
          bunkLowerPrice: roomType.bunkLowerPrice ?? undefined,
          bunkUpperPrice: roomType.bunkUpperPrice ?? undefined,
          wholeRoomPrice: roomType.wholeRoomPrice ?? undefined,
          description: roomType.description ?? undefined,
        }
      : { capacity: 4 },
  });

  const submit = (values: FormValues) =>
    onSubmit({
      branchId,
      code: values.code,
      name: values.name,
      capacity: values.capacity,
      basePrice: parseVndInput(values.basePrice),
      bunkLowerPrice: values.bunkLowerPrice ? parseVndInput(values.bunkLowerPrice) : undefined,
      bunkUpperPrice: values.bunkUpperPrice ? parseVndInput(values.bunkUpperPrice) : undefined,
      wholeRoomPrice: values.wholeRoomPrice ? parseVndInput(values.wholeRoomPrice) : undefined,
      description: values.description || undefined,
    });

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      {submitError && <Alert>{submitError}</Alert>}
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Mã loại phòng" required error={errors.code?.message}>
          <Input {...register("code")} disabled={!!roomType} placeholder="P4-DH" />
        </FormField>
        <FormField label="Tên loại phòng" required error={errors.name?.message}>
          <Input {...register("name")} placeholder="Phòng 4 người có điều hòa" />
        </FormField>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <FormField label="Sức chứa" required error={errors.capacity?.message}>
          <Input type="number" min={1} {...register("capacity")} />
        </FormField>
        <FormField label="Giá giường cơ bản (đ)" required error={errors.basePrice?.message}>
          <Input inputMode="numeric" {...register("basePrice")} placeholder="2000000" />
        </FormField>
        <FormField label="Giá nguyên phòng (đ)" error={errors.wholeRoomPrice?.message}>
          <Input inputMode="numeric" {...register("wholeRoomPrice")} />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Giá giường tầng dưới (đ)" error={errors.bunkLowerPrice?.message}>
          <Input inputMode="numeric" {...register("bunkLowerPrice")} placeholder="Bỏ trống = dùng giá cơ bản" />
        </FormField>
        <FormField label="Giá giường tầng trên (đ)" error={errors.bunkUpperPrice?.message}>
          <Input inputMode="numeric" {...register("bunkUpperPrice")} placeholder="Bỏ trống = dùng giá cơ bản" />
        </FormField>
      </div>
      <FormField label="Mô tả" error={errors.description?.message}>
        <Input {...register("description")} />
      </FormField>
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
