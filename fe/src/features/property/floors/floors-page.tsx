import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { DataTable, type Column } from "../../../components/ui/data-table";
import { Dialog } from "../../../components/ui/dialog";
import { Alert } from "../../../components/ui/alert";
import { PageHeader } from "../../../components/ui/page-header";
import { getErrorMessage } from "../../../lib/errors";
import { useBranchContext } from "../branch-context";
import { BuildingSelect } from "../buildings/building-select";
import { floorsApi } from "./api";
import { FloorForm } from "./floor-form";
import type { CreateFloorInput, Floor } from "./types";
import { LoadingState } from "../../../components/ui/spinner";

const STATUS_TONE = { ACTIVE: "green", RENOVATING: "amber", INACTIVE: "slate" } as const;
const STATUS_LABEL = { ACTIVE: "Hoạt động", RENOVATING: "Đang cải tạo", INACTIVE: "Ngừng hoạt động" } as const;

export function FloorsPage() {
  const { selectedBranchId } = useBranchContext();
  const [buildingId, setBuildingId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Floor | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: floors = [], isLoading, error } = useQuery({
    queryKey: ["floors", buildingId],
    queryFn: () => floorsApi.list(buildingId ?? undefined),
    enabled: !!buildingId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["floors"] });

  const createMutation = useMutation({
    mutationFn: floorsApi.create,
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateFloorInput }) => floorsApi.update(id, input),
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const columns: Column<Floor>[] = [
    { header: "Tầng", cell: (f) => <span className="font-medium">{f.name || f.number}</span> },
    { header: "Thứ tự", cell: (f) => f.sortOrder },
    { header: "Trạng thái", cell: (f) => <Badge tone={STATUS_TONE[f.status]}>{STATUS_LABEL[f.status]}</Badge> },
    {
      header: "",
      className: "text-right",
      cell: (f) => (
        <button
          onClick={() => {
            setEditing(f);
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
        title="Tầng"
        description="Quản lý các tầng thuộc từng tòa nhà."
        actions={
          <Button
            disabled={!buildingId}
            onClick={() => {
              setEditing(undefined);
              setFormError(null);
              setDialogOpen(true);
            }}
          >
            <Plus size={16} /> Thêm tầng
          </Button>
        }
      />

      <div className="mb-4">
        <BuildingSelect branchId={selectedBranchId} value={buildingId} onChange={setBuildingId} />
      </div>

      {error && <Alert>{getErrorMessage(error)}</Alert>}
      {!buildingId ? (
        <p className="text-sm text-slate-500">Chọn tòa nhà để xem danh sách tầng.</p>
      ) : isLoading ? (
        <LoadingState />
      ) : (
        <DataTable columns={columns} rows={floors} rowKey={(f) => f.id} />
      )}

      {buildingId && (
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? "Sửa tầng" : "Thêm tầng"}>
          <FloorForm
            buildingId={buildingId}
            floor={editing}
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
