import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../../../components/ui/button";
import { FormField, Input } from "../../../components/ui/input";
import { Alert } from "../../../components/ui/alert";
import type { CreateFloorInput, Floor } from "./types";

const schema = z.object({
  number: z.string().min(1, "Bắt buộc — vd \"1\", \"G\", \"L\""),
  sortOrder: z.coerce.number().int(),
  name: z.string().optional(),
  genderPolicy: z.enum(["MALE", "FEMALE", "MIXED"]).optional(),
});
type FormValues = z.infer<typeof schema>;

export function FloorForm({
  buildingId,
  floor,
  onSubmit,
  onCancel,
  submitError,
  isSubmitting,
}: {
  buildingId: string;
  floor?: Floor;
  onSubmit: (input: CreateFloorInput) => void;
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
    defaultValues: floor
      ? { number: floor.number, sortOrder: floor.sortOrder, name: floor.name ?? undefined, genderPolicy: floor.genderPolicy ?? undefined }
      : { sortOrder: 0 },
  });

  const submit = (values: FormValues) => onSubmit({ buildingId, ...values, name: values.name || undefined });

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      {submitError && <Alert>{submitError}</Alert>}
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Số tầng" required error={errors.number?.message}>
          <Input {...register("number")} disabled={!!floor} placeholder='1, G, L...' />
        </FormField>
        <FormField label="Thứ tự sắp xếp" required error={errors.sortOrder?.message}>
          <Input type="number" {...register("sortOrder")} />
        </FormField>
      </div>
      <FormField label="Tên hiển thị" error={errors.name?.message}>
        <Input {...register("name")} placeholder="Tầng 1" />
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
