import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { DataTable, type Column } from "../../../components/ui/data-table";
import { Dialog } from "../../../components/ui/dialog";
import { Alert } from "../../../components/ui/alert";
import { PageHeader } from "../../../components/ui/page-header";
import { getErrorMessage } from "../../../lib/errors";
import { formatVnd } from "../../../lib/money";
import { useBranchContext } from "../branch-context";
import { roomTypesApi } from "./api";
import { RoomTypeForm } from "./room-type-form";
import type { CreateRoomTypeInput, RoomType } from "./types";
import { LoadingState } from "../../../components/ui/spinner";

export function RoomTypesPage() {
  const { selectedBranchId } = useBranchContext();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RoomType | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: roomTypes = [], isLoading, error } = useQuery({
    queryKey: ["room-types", selectedBranchId],
    queryFn: () => roomTypesApi.list(selectedBranchId ?? undefined),
    enabled: !!selectedBranchId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["room-types"] });

  const createMutation = useMutation({
    mutationFn: roomTypesApi.create,
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateRoomTypeInput }) => roomTypesApi.update(id, input),
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const columns: Column<RoomType>[] = [
    { header: "Mã", cell: (rt) => <span className="font-medium">{rt.code}</span> },
    { header: "Tên loại phòng", cell: (rt) => rt.name },
    { header: "Sức chứa", cell: (rt) => `${rt.capacity} người` },
    { header: "Giá giường", cell: (rt) => formatVnd(rt.basePrice) },
    { header: "Giá tầng dưới", cell: (rt) => formatVnd(rt.bunkLowerPrice ?? rt.basePrice) },
    { header: "Giá tầng trên", cell: (rt) => formatVnd(rt.bunkUpperPrice ?? rt.basePrice) },
    { header: "Giá nguyên phòng", cell: (rt) => formatVnd(rt.wholeRoomPrice) },
    {
      header: "",
      className: "text-right",
      cell: (rt) => (
        <button
          onClick={() => {
            setEditing(rt);
            setFormError(null);
            setDialogOpen(true);
          }}
          className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
        >
          <Pencil size={15} />
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Bảng giá (loại phòng)"
        description="Thiết lập bảng giá theo từng loại phòng. Mọi thay đổi giá đều được lưu lại lịch sử."
        actions={
          <Button
            disabled={!selectedBranchId}
            onClick={() => {
              setEditing(undefined);
              setFormError(null);
              setDialogOpen(true);
            }}
          >
            <Plus size={16} /> Thêm loại phòng
          </Button>
        }
      />

      {error && <Alert>{getErrorMessage(error)}</Alert>}
      {isLoading ? (
        <LoadingState />
      ) : (
        <DataTable columns={columns} rows={roomTypes} rowKey={(rt) => rt.id} />
      )}

      {selectedBranchId && (
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? "Sửa loại phòng" : "Thêm loại phòng"}>
          <RoomTypeForm
            branchId={selectedBranchId}
            roomType={editing}
            submitError={formError}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
            onCancel={() => setDialogOpen(false)}
            onSubmit={(input) => {
              setFormError(null);
              if (editing) updateMutation.mutate({ id: editing.id, input });
              else createMutation.mutate(input);
            }}
          />
        </Dialog>
      )}
    </div>
  );
}
