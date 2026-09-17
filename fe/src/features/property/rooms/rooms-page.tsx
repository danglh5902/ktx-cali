import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { DataTable, type Column } from "../../../components/ui/data-table";
import { Dialog } from "../../../components/ui/dialog";
import { Alert } from "../../../components/ui/alert";
import { FormField, Input } from "../../../components/ui/input";
import { PageHeader } from "../../../components/ui/page-header";
import { getErrorMessage } from "../../../lib/errors";
import { formatVnd, parseVndInput } from "../../../lib/money";
import { useBranchContext } from "../branch-context";
import { BuildingSelect } from "../buildings/building-select";
import { FloorSelect } from "../floors/floor-select";
import { roomsApi } from "./api";
import { RoomBulkForm } from "./room-bulk-form";
import type { BulkCreateRoomsInput, Room } from "./types";
import { LoadingState } from "../../../components/ui/spinner";

const STATUS_TONE = { ACTIVE: "green", MAINTENANCE: "red", RENOVATING: "amber", INACTIVE: "slate" } as const;
const STATUS_LABEL = { ACTIVE: "Hoạt động", MAINTENANCE: "Bảo trì", RENOVATING: "Đang cải tạo", INACTIVE: "Ngừng" } as const;

export function RoomsPage() {
  const { selectedBranchId } = useBranchContext();
  const [buildingId, setBuildingId] = useState<string | null>(null);
  const [floorId, setFloorId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<Room | null>(null);
  const [priceOverride, setPriceOverride] = useState("");
  const [bunkLowerPriceOverride, setBunkLowerPriceOverride] = useState("");
  const [bunkUpperPriceOverride, setBunkUpperPriceOverride] = useState("");

  const { data: rooms = [], isLoading, error } = useQuery({
    queryKey: ["rooms", selectedBranchId, floorId],
    queryFn: () => roomsApi.list({ branchId: selectedBranchId ?? undefined, floorId: floorId ?? undefined }),
    enabled: !!selectedBranchId,
  });

  const bulkCreateMutation = useMutation({
    mutationFn: roomsApi.bulkCreate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setDialogOpen(false);
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const updatePriceMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof roomsApi.updatePrice>[1] }) =>
      roomsApi.updatePrice(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["beds"] });
      setEditingPrice(null);
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const columns: Column<Room>[] = [
    { header: "Mã phòng", cell: (r) => <span className="font-medium">{r.code}</span> },
    { header: "Sức chứa", cell: (r) => `${r.actualBedCount}/${r.capacity} giường` },
    { header: "WC riêng", cell: (r) => (r.hasPrivateToilet ? "Có" : "Không") },
    {
      header: "Giá ghi đè (chung/dưới/trên)",
      cell: (r) =>
        r.priceOverride || r.bunkLowerPriceOverride || r.bunkUpperPriceOverride
          ? `${formatVnd(r.priceOverride)} / ${formatVnd(r.bunkLowerPriceOverride)} / ${formatVnd(r.bunkUpperPriceOverride)}`
          : "— (dùng giá loại phòng)",
    },
    { header: "Trạng thái", cell: (r) => <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge> },
    {
      header: "",
      className: "text-right",
      cell: (r) => (
        <button
          onClick={() => {
            setFormError(null);
            setEditingPrice(r);
            setPriceOverride(r.priceOverride ?? "");
            setBunkLowerPriceOverride(r.bunkLowerPriceOverride ?? "");
            setBunkUpperPriceOverride(r.bunkUpperPriceOverride ?? "");
          }}
          className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
          title="Sửa giá ghi đè cho phòng này"
        >
          <Pencil size={15} />
        </button>
      ),
    },
  ];

  const submit = (input: BulkCreateRoomsInput) => {
    setFormError(null);
    bulkCreateMutation.mutate(input);
  };

  return (
    <div>
      <PageHeader
        title="Phòng"
        description="Quản lý danh sách phòng theo từng tòa và tầng, kèm giá ghi đè riêng nếu cần."
        actions={
          <Button disabled={!floorId} onClick={() => { setFormError(null); setDialogOpen(true); }}>
            <Plus size={16} /> Tạo phòng
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <BuildingSelect
          branchId={selectedBranchId}
          value={buildingId}
          onChange={(id) => {
            setBuildingId(id);
            setFloorId(null);
          }}
        />
        <FloorSelect buildingId={buildingId} value={floorId} onChange={setFloorId} />
      </div>

      {error && <Alert>{getErrorMessage(error)}</Alert>}
      {!selectedBranchId ? (
        <p className="text-sm text-slate-500">Chọn chi nhánh ở thanh trên.</p>
      ) : isLoading ? (
        <LoadingState />
      ) : (
        <DataTable
          columns={columns}
          rows={rooms}
          rowKey={(r) => r.id}
          emptyMessage={floorId ? "Tầng này chưa có phòng nào" : "Chọn tòa + tầng để xem phòng"}
        />
      )}

      {selectedBranchId && buildingId && floorId && (
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Tạo phòng (hàng loạt)">
          <RoomBulkForm
            branchId={selectedBranchId}
            buildingId={buildingId}
            floorId={floorId}
            submitError={formError}
            isSubmitting={bulkCreateMutation.isPending}
            onCancel={() => setDialogOpen(false)}
            onSubmit={submit}
          />
        </Dialog>
      )}

      <Dialog open={!!editingPrice} onClose={() => setEditingPrice(null)} title={`Ghi đè giá phòng ${editingPrice?.code}`}>
        {formError && <Alert>{formError}</Alert>}
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Bỏ trống ô nào thì giường thuộc phòng này dùng giá mặc định của loại phòng cho vị trí tương ứng.
          </p>
          <FormField label="Giá chung (giường đơn/đôi)">
            <Input inputMode="numeric" value={priceOverride} onChange={(e) => setPriceOverride(e.target.value)} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Giá giường tầng dưới">
              <Input inputMode="numeric" value={bunkLowerPriceOverride} onChange={(e) => setBunkLowerPriceOverride(e.target.value)} />
            </FormField>
            <FormField label="Giá giường tầng trên">
              <Input inputMode="numeric" value={bunkUpperPriceOverride} onChange={(e) => setBunkUpperPriceOverride(e.target.value)} />
            </FormField>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setEditingPrice(null)}>
              Hủy
            </Button>
            <Button
              loading={updatePriceMutation.isPending}
              onClick={() =>
                editingPrice &&
                updatePriceMutation.mutate({
                  id: editingPrice.id,
                  input: {
                    priceOverride: priceOverride ? parseVndInput(priceOverride) : undefined,
                    bunkLowerPriceOverride: bunkLowerPriceOverride ? parseVndInput(bunkLowerPriceOverride) : undefined,
                    bunkUpperPriceOverride: bunkUpperPriceOverride ? parseVndInput(bunkUpperPriceOverride) : undefined,
                  },
                })
              }
            >
              Lưu
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
