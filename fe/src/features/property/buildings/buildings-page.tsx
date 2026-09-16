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
import { formatVnd } from "../../../lib/money";
import { useBranchContext } from "../branch-context";
import { buildingsApi } from "./api";
import { BuildingForm } from "./building-form";
import type { Building, CreateBuildingInput } from "./types";
import { LoadingState } from "../../../components/ui/spinner";

const STATUS_TONE = { ACTIVE: "green", RENOVATING: "amber", INACTIVE: "slate" } as const;
const STATUS_LABEL = { ACTIVE: "Hoạt động", RENOVATING: "Đang cải tạo", INACTIVE: "Ngừng hoạt động" } as const;

export function BuildingsPage() {
  const { selectedBranchId, branches } = useBranchContext();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Building | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: buildings = [], isLoading, error } = useQuery({
    queryKey: ["buildings", selectedBranchId],
    queryFn: () => buildingsApi.list(selectedBranchId ?? undefined),
    enabled: !!selectedBranchId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["buildings"] });

  const createMutation = useMutation({
    mutationFn: buildingsApi.create,
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateBuildingInput }) => buildingsApi.update(id, input),
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const branchName = branches.find((b) => b.id === selectedBranchId)?.name;

  const columns: Column<Building>[] = [
    { header: "Mã", cell: (b) => <span className="font-medium">{b.code}</span> },
    { header: "Tên tòa", cell: (b) => b.name },
    { header: "Thang máy", cell: (b) => (b.hasElevator ? "Có" : "Không") },
    { header: "Chi phí thuê/tháng", cell: (b) => formatVnd(b.monthlyRentCost) },
    { header: "Trạng thái", cell: (b) => <Badge tone={STATUS_TONE[b.status]}>{STATUS_LABEL[b.status]}</Badge> },
    {
      header: "",
      className: "text-right",
      cell: (b) => (
        <button
          onClick={() => {
            setEditing(b);
            setFormError(null);
            setDialogOpen(true);
          }}
          className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
          title="Sửa"
        >
          <Pencil size={15} />
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Tòa nhà"
        description={branchName ? `Chi nhánh: ${branchName} — docs/06-module-property.md §2` : "Chọn chi nhánh ở thanh trên để xem tòa nhà"}
        actions={
          <Button
            disabled={!selectedBranchId}
            onClick={() => {
              setEditing(undefined);
              setFormError(null);
              setDialogOpen(true);
            }}
          >
            <Plus size={16} /> Thêm tòa nhà
          </Button>
        }
      />

      {error && <Alert>{getErrorMessage(error)}</Alert>}
      {isLoading ? (
        <LoadingState />
      ) : (
        <DataTable columns={columns} rows={buildings} rowKey={(b) => b.id} />
      )}

      {selectedBranchId && (
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? "Sửa tòa nhà" : "Thêm tòa nhà"}>
          <BuildingForm
            branchId={selectedBranchId}
            building={editing}
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
