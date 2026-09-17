import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Alert } from "../../../components/ui/alert";
import { PageHeader } from "../../../components/ui/page-header";
import { Dialog } from "../../../components/ui/dialog";
import { getErrorMessage } from "../../../lib/errors";
import { formatVnd } from "../../../lib/money";
import { useBranchContext } from "../branch-context";
import { BuildingSelect } from "../buildings/building-select";
import { FloorSelect } from "../floors/floor-select";
import { RoomSelect } from "../rooms/room-select";
import { roomsApi } from "../rooms/api";
import { bedsApi } from "./api";
import { BedBulkForm } from "./bed-bulk-form";
import { BedStatusDialog } from "./bed-status-dialog";
import { BED_STATUS_META } from "./bed-status";
import type { Bed, BedStatus } from "./types";
import { LoadingState } from "../../../components/ui/spinner";

/** Sơ đồ giường — docs/15-ux-navigation.md §5 (bản rút gọn: nhóm theo phòng). */
export function BedsPage() {
  const { selectedBranchId } = useBranchContext();
  const [buildingId, setBuildingId] = useState<string | null>(null);
  const [floorId, setFloorId] = useState<string | null>(null);
  const [bulkRoomId, setBulkRoomId] = useState<string | null>(null);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [editingBed, setEditingBed] = useState<Bed | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms", selectedBranchId, floorId],
    queryFn: () => roomsApi.list({ branchId: selectedBranchId ?? undefined, floorId: floorId ?? undefined }),
    enabled: !!selectedBranchId,
  });

  const { data: beds = [], isLoading, error } = useQuery({
    queryKey: ["beds", selectedBranchId],
    queryFn: () => bedsApi.list({ branchId: selectedBranchId ?? undefined }),
    enabled: !!selectedBranchId,
  });

  const bedsByRoom = useMemo(() => {
    const map = new Map<string, Bed[]>();
    for (const bed of beds) {
      const list = map.get(bed.roomId) ?? [];
      list.push(bed);
      map.set(bed.roomId, list);
    }
    return map;
  }, [beds]);

  const visibleRooms = floorId ? rooms.filter((r) => r.floorId === floorId) : rooms;

  const bulkCreateMutation = useMutation({
    mutationFn: bedsApi.bulkCreate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["beds"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setBulkDialogOpen(false);
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, blockedReason }: { id: string; status: BedStatus; blockedReason?: string }) =>
      bedsApi.updateStatus(id, { status, blockedReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["beds"] });
      setEditingBed(null);
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  return (
    <div>
      <PageHeader
        title="Sơ đồ giường"
        description="Xem tình trạng từng giường theo thời gian thực: trống, đang ở, đang giữ chỗ, chờ dọn, đang sửa hoặc đã khóa."
        actions={
          <Button
            onClick={() => {
              setFormError(null);
              setBulkRoomId(null);
              setBulkDialogOpen(true);
            }}
          >
            <Plus size={16} /> Tạo giường
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

      {/* Chú giải — luôn kèm ký hiệu + chữ, không chỉ màu (docs/15 §5, §10). */}
      <div className="mb-4 flex flex-wrap gap-3 text-xs text-slate-600">
        {Object.entries(BED_STATUS_META).map(([key, meta]) => (
          <span key={key} className="flex items-center gap-1">
            <span className={`flex h-5 w-5 items-center justify-center rounded border text-[10px] ${meta.className}`}>
              {meta.symbol}
            </span>
            {meta.label}
          </span>
        ))}
      </div>

      {error && <Alert>{getErrorMessage(error)}</Alert>}
      {!selectedBranchId ? (
        <p className="text-sm text-slate-500">Chọn chi nhánh ở thanh trên.</p>
      ) : isLoading ? (
        <LoadingState />
      ) : visibleRooms.length === 0 ? (
        <p className="text-sm text-slate-500">Chưa có phòng nào (chọn tòa/tầng, hoặc tạo phòng ở mục "Phòng").</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleRooms.map((room) => {
            const roomBeds = bedsByRoom.get(room.id) ?? [];
            const occupied = roomBeds.filter((b) => b.status === "OCCUPIED").length;
            return (
              <div key={room.id} className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium text-slate-900">{room.code}</span>
                  <span className="text-xs text-slate-500">
                    {occupied}/{roomBeds.length}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {roomBeds.map((bed) => {
                    const meta = BED_STATUS_META[bed.status];
                    return (
                      <button
                        key={bed.id}
                        title={`${bed.code} — ${meta.label} — ${formatVnd(bed.effectivePrice)}`}
                        onClick={() => setEditingBed(bed)}
                        className={`flex h-10 flex-col items-center justify-center rounded border text-[11px] leading-tight hover:opacity-80 ${meta.className}`}
                      >
                        <span>{meta.symbol}</span>
                      </button>
                    );
                  })}
                  {roomBeds.length === 0 && (
                    <button
                      onClick={() => {
                        setFormError(null);
                        setBulkRoomId(room.id);
                        setBulkDialogOpen(true);
                      }}
                      className="col-span-4 rounded border border-dashed border-slate-300 py-2 text-[11px] text-slate-400 hover:border-blue-400 hover:text-blue-600"
                    >
                      + Thêm giường
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedBranchId && buildingId && floorId && (
        <Dialog open={bulkDialogOpen} onClose={() => setBulkDialogOpen(false)} title="Tạo giường (hàng loạt)">
          {bulkRoomId ? (
            <BedBulkForm
              branchId={selectedBranchId}
              buildingId={buildingId}
              floorId={floorId}
              roomId={bulkRoomId}
              submitError={formError}
              isSubmitting={bulkCreateMutation.isPending}
              onCancel={() => setBulkDialogOpen(false)}
              onSubmit={(input) => bulkCreateMutation.mutate(input)}
            />
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">Chọn phòng cần thêm giường:</p>
              <RoomSelect branchId={selectedBranchId} floorId={floorId} value={bulkRoomId} onChange={setBulkRoomId} />
            </div>
          )}
        </Dialog>
      )}

      <BedStatusDialog
        bed={editingBed}
        submitError={formError}
        isSubmitting={statusMutation.isPending}
        onClose={() => setEditingBed(null)}
        onSubmit={(status, blockedReason) => {
          if (!editingBed) return;
          setFormError(null);
          statusMutation.mutate({ id: editingBed.id, status, blockedReason });
        }}
      />
    </div>
  );
}
