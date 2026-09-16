import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../../../components/ui/button";
import { FormField, Input } from "../../../components/ui/input";
import { Alert } from "../../../components/ui/alert";
import { parseVndInput } from "../../../lib/money";
import type { BulkCreateBedsInput } from "./types";

const schema = z.object({
  bedType: z.enum(["SINGLE", "BUNK_LOWER", "BUNK_UPPER", "DOUBLE", "BUNK_PAIR"]),
  codePrefix: z.string().min(1, "Bắt buộc — vd \"A-301-B\""),
  count: z.coerce.number().int().min(1).max(20),
  priceOverride: z.string().optional(),
  lowerPriceOverride: z.string().optional(),
  upperPriceOverride: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function BedBulkForm({
  branchId,
  buildingId,
  floorId,
  roomId,
  onSubmit,
  onCancel,
  submitError,
  isSubmitting,
}: {
  branchId: string;
  buildingId: string;
  floorId: string;
  roomId: string;
  onSubmit: (input: BulkCreateBedsInput) => void;
  onCancel: () => void;
  submitError?: string | null;
  isSubmitting?: boolean;
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { bedType: "SINGLE", count: 4 } });

  const bedType = watch("bedType");
  const isBunkPair = bedType === "BUNK_PAIR";

  const submit = (values: FormValues) =>
    onSubmit({
      branchId,
      buildingId,
      floorId,
      roomId,
      bedType: values.bedType,
      codePrefix: values.codePrefix,
      count: values.count,
      priceOverride: !isBunkPair && values.priceOverride ? parseVndInput(values.priceOverride) : undefined,
      lowerPriceOverride: isBunkPair && values.lowerPriceOverride ? parseVndInput(values.lowerPriceOverride) : undefined,
      upperPriceOverride: isBunkPair && values.upperPriceOverride ? parseVndInput(values.upperPriceOverride) : undefined,
    });

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      {submitError && <Alert>{submitError}</Alert>}
      <FormField label="Loại giường" required error={errors.bedType?.message}>
        <select {...register("bedType")} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="SINGLE">Đơn</option>
          <option value="BUNK_PAIR">Giường tầng (trên + dưới, giá khác nhau)</option>
          <option value="BUNK_LOWER">Chỉ tầng dưới</option>
          <option value="BUNK_UPPER">Chỉ tầng trên</option>
          <option value="DOUBLE">Đôi</option>
        </select>
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Tiền tố mã" required error={errors.codePrefix?.message}>
          <Input {...register("codePrefix")} placeholder="A-301-B" />
        </FormField>
        <FormField label={isBunkPair ? "Số cặp giường tầng" : "Số lượng"} required error={errors.count?.message}>
          <Input type="number" min={1} max={20} {...register("count")} />
        </FormField>
      </div>

      {isBunkPair ? (
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Giá giường tầng dưới (đ)">
            <Input inputMode="numeric" {...register("lowerPriceOverride")} placeholder="Bỏ trống = dùng giá mặc định" />
          </FormField>
          <FormField label="Giá giường tầng trên (đ)">
            <Input inputMode="numeric" {...register("upperPriceOverride")} placeholder="Bỏ trống = dùng giá mặc định" />
          </FormField>
        </div>
      ) : (
        <FormField label="Giá (đ)">
          <Input inputMode="numeric" {...register("priceOverride")} placeholder="Bỏ trống = dùng giá mặc định của phòng/loại phòng" />
        </FormField>
      )}

      {isBunkPair && (
        <p className="text-xs text-slate-500">
          Mỗi cặp sinh ra 2 giường: mã <code>{"{tiền tố}"}{"{n}"}D</code> (dưới) và <code>{"{tiền tố}"}{"{n}"}T</code> (trên).
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Đang tạo..." : "Tạo giường"}
        </Button>
      </div>
    </form>
  );
}
