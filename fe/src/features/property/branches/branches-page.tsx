import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Archive, Pencil, Plus } from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { DataTable, type Column } from "../../../components/ui/data-table";
import { Dialog } from "../../../components/ui/dialog";
import { Alert } from "../../../components/ui/alert";
import { PageHeader } from "../../../components/ui/page-header";
import { getErrorMessage } from "../../../lib/errors";
import { formatVnd } from "../../../lib/money";
import { branchesApi } from "./api";
import { BranchForm } from "./branch-form";
import type { Branch, CreateBranchInput } from "./types";
import { LoadingState } from "../../../components/ui/spinner";

const STATUS_TONE = { ACTIVE: "green", INACTIVE: "slate", ARCHIVED: "red" } as const;
const STATUS_LABEL = { ACTIVE: "Hoạt động", INACTIVE: "Tạm ngừng", ARCHIVED: "Đã lưu trữ" } as const;

export function BranchesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: branches = [], isLoading, error } = useQuery({
    queryKey: ["branches"],
    queryFn: branchesApi.list,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["branches"] });

  const createMutation = useMutation({
    mutationFn: branchesApi.create,
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateBranchInput }) => branchesApi.update(id, input),
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const archiveMutation = useMutation({
    mutationFn: branchesApi.archive,
    onSuccess: invalidate,
  });

  const openCreate = () => {
    setEditing(undefined);
    setFormError(null);
    setDialogOpen(true);
  };
  const openEdit = (branch: Branch) => {
    setEditing(branch);
    setFormError(null);
    setDialogOpen(true);
  };

  const columns: Column<Branch>[] = [
    { header: "Mã", cell: (b) => <span className="font-medium">{b.code}</span> },
    { header: "Tên chi nhánh", cell: (b) => b.name },
    { header: "Tỉnh/Thành", cell: (b) => b.address?.province ?? "—" },
    { header: "Ngày chốt kỳ", cell: (b) => `Ngày ${b.billingDayOfMonth}` },
    { header: "Giá điện", cell: (b) => formatVnd(b.electricityPrice) },
    {
      header: "Trạng thái",
      cell: (b) => <Badge tone={STATUS_TONE[b.status]}>{STATUS_LABEL[b.status]}</Badge>,
    },
    {
      header: "",
      className: "text-right",
      cell: (b) => (
        <div className="flex justify-end gap-1">
          <button
            onClick={() => openEdit(b)}
            className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
            title="Sửa"
          >
            <Pencil size={15} />
          </button>
          {b.status !== "ARCHIVED" && (
            <button
              onClick={() => {
                if (confirm(`Lưu trữ chi nhánh "${b.name}"? Hành động này không xóa dữ liệu.`)) {
                  archiveMutation.mutate(b.id);
                }
              }}
              className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
              title="Lưu trữ"
            >
              <Archive size={15} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Chi nhánh"
        description="Danh sách các chi nhánh đang vận hành. Mỗi chi nhánh có dữ liệu, báo cáo và phân quyền riêng."
        actions={
          <Button onClick={openCreate}>
            <Plus size={16} /> Thêm chi nhánh
          </Button>
        }
      />

      {error && <Alert>{getErrorMessage(error)}</Alert>}
      {isLoading ? (
        <LoadingState />
      ) : (
        <DataTable columns={columns} rows={branches} rowKey={(b) => b.id} />
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? "Sửa chi nhánh" : "Thêm chi nhánh"}>
        <BranchForm
          branch={editing}
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
    </div>
  );
}
