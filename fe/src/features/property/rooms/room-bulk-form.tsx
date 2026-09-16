import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "../../../components/ui/button";
import { FormField, Input } from "../../../components/ui/input";
import { Alert } from "../../../components/ui/alert";
import { RoomTypeSelect } from "../room-types/room-type-select";
import type { BulkCreateRoomsInput } from "./types";

const schema = z
  .object({
    roomTypeId: z.string().optional(),
    capacity: z.coerce.number().int().min(1),
    codePrefix: z.string().min(1, "Bắt buộc — vd \"A-3\""),
    codeFrom: z.coerce.number().int().min(0),
    codeTo: z.coerce.number().int().min(0),
    codePad: z.coerce.number().int().min(0).max(4),
  })
  .refine((v) => v.codeTo >= v.codeFrom, { message: "Số cuối phải ≥ số đầu", path: ["codeTo"] });
type FormValues = z.infer<typeof schema>;

/**
 * Tạo hàng loạt phòng — docs/06-module-property.md §4.5. Xem trước mã sinh
 * ra để tránh nhầm mẫu trước khi bấm tạo (vd "A-3" + 1..10, đệm 2 số →
 * "A-301".."A-310").
 */
export function RoomBulkForm({
  branchId,
  buildingId,
  floorId,
  onSubmit,
  onCancel,
  submitError,
  isSubmitting,
}: {
  branchId: string;
  buildingId: string;
  floorId: string;
  onSubmit: (input: BulkCreateRoomsInput) => void;
  onCancel: () => void;
  submitError?: string | null;
  isSubmitting?: boolean;
}) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { capacity: 4, codeFrom: 1, codeTo: 10, codePad: 2 },
  });

  const watched = useWatch({ control });
  const previewCodes = (() => {
    const from = Number(watched.codeFrom ?? 1);
    const to = Number(watched.codeTo ?? from);
    const pad = Number(watched.codePad ?? 2);
    const prefix = watched.codePrefix ?? "";
    if (!prefix || Number.isNaN(from) || Number.isNaN(to) || to < from) return [];
    const codes: string[] = [];
    for (let n = from; n <= Math.min(to, from + 4); n += 1) codes.push(`${prefix}${String(n).padStart(pad, "0")}`);
    if (to > from + 4) codes.push("...");
    return codes;
  })();

  const submit = (values: FormValues) =>
    onSubmit({
      branchId,
      buildingId,
      floorId,
      roomTypeId: values.roomTypeId || undefined,
      capacity: values.capacity,
      codePrefix: values.codePrefix,
      codeFrom: values.codeFrom,
      codeTo: values.codeTo,
      codePad: values.codePad,
    });

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      {submitError && <Alert>{submitError}</Alert>}

      <FormField label="Loại phòng">
        <RoomTypeSelect branchId={branchId} value={watched.roomTypeId ?? ""} onChange={(v) => setValue("roomTypeId", v)} />
      </FormField>

      <FormField label="Sức chứa mỗi phòng" required error={errors.capacity?.message}>
        <Input type="number" min={1} {...register("capacity")} />
      </FormField>

      <div className="grid grid-cols-4 gap-3">
        <FormField label="Tiền tố mã" required error={errors.codePrefix?.message}>
          <Input {...register("codePrefix")} placeholder="A-3" />
        </FormField>
        <FormField label="Từ số" required error={errors.codeFrom?.message}>
          <Input type="number" {...register("codeFrom")} />
        </FormField>
        <FormField label="Đến số" required error={errors.codeTo?.message}>
          <Input type="number" {...register("codeTo")} />
        </FormField>
        <FormField label="Đệm số 0" required error={errors.codePad?.message}>
          <Input type="number" min={0} max={4} {...register("codePad")} />
        </FormField>
      </div>

      {previewCodes.length > 0 && (
        <p className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Xem trước mã phòng: <span className="font-mono">{previewCodes.join(", ")}</span>
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Đang tạo..." : "Tạo phòng"}
        </Button>
      </div>
    </form>
  );
}
