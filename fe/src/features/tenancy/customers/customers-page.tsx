import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Ban } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { DataTable, type Column } from "../../../components/ui/data-table";
import { Dialog } from "../../../components/ui/dialog";
import { Alert } from "../../../components/ui/alert";
import { Badge } from "../../../components/ui/badge";
import { PageHeader } from "../../../components/ui/page-header";
import { getErrorMessage } from "../../../lib/errors";
import { useBranchContext } from "../../property/branch-context";
import { customersApi } from "./api";
import { CustomerDetailDialog } from "./customer-detail-dialog";
import { CustomerForm } from "./customer-form";
import { CUSTOMER_STATUS_META } from "./customer-status";
import type { Customer } from "./types";
import { LoadingState } from "../../../components/ui/spinner";

export function CustomersPage() {
  const { selectedBranchId } = useBranchContext();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [blacklisting, setBlacklisting] = useState<Customer | null>(null);
  const [blacklistReason, setBlacklistReason] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [viewingCustomerId, setViewingCustomerId] = useState<string | null>(null);

  const { data: customers = [], isLoading, error } = useQuery({
    queryKey: ["customers", search],
    queryFn: () => customersApi.list({ search: search || undefined }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["customers"] });

  const createMutation = useMutation({
    mutationFn: customersApi.create,
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const blacklistMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => customersApi.blacklist(id, reason),
    onSuccess: () => {
      invalidate();
      setBlacklisting(null);
      setBlacklistReason("");
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const columns: Column<Customer>[] = [
    { header: "Mã KH", cell: (c) => <span className="font-medium">{c.customerCode}</span> },
    { header: "Họ tên", cell: (c) => c.fullName },
    { header: "SĐT", cell: (c) => c.phone },
    { header: "Nghề nghiệp", cell: (c) => c.school ?? c.company ?? "—" },
    {
      header: "Trạng thái",
      cell: (c) => {
        const meta = CUSTOMER_STATUS_META[c.status];
        return <Badge tone={meta.tone}>{meta.label}</Badge>;
      },
    },
    {
      header: "",
      className: "text-right",
      cell: (c) =>
        !c.isBlacklisted && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setBlacklisting(c);
              setFormError(null);
            }}
            className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
            title="Đưa vào danh sách đen"
          >
            <Ban size={15} />
          </button>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Khách thuê"
        description="docs/07-module-customers.md — hồ sơ khách thuê, tìm theo tên/SĐT."
        actions={
          <Button
            disabled={!selectedBranchId}
            onClick={() => {
              setFormError(null);
              setDialogOpen(true);
            }}
          >
            <Plus size={16} /> Thêm khách thuê
          </Button>
        }
      />

      <div className="mb-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên hoặc số điện thoại..."
          className="w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      {error && <Alert>{getErrorMessage(error)}</Alert>}
      {isLoading ? (
        <LoadingState />
      ) : (
        <DataTable columns={columns} rows={customers} rowKey={(c) => c.id} onRowClick={(c) => setViewingCustomerId(c.id)} />
      )}

      <CustomerDetailDialog customerId={viewingCustomerId} onClose={() => setViewingCustomerId(null)} />

      {selectedBranchId && (
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Thêm khách thuê">
          <CustomerForm
            branchId={selectedBranchId}
            submitError={formError}
            isSubmitting={createMutation.isPending}
            onCancel={() => setDialogOpen(false)}
            onSubmit={(input) => {
              setFormError(null);
              createMutation.mutate(input);
            }}
          />
        </Dialog>
      )}

      <Dialog open={!!blacklisting} onClose={() => setBlacklisting(null)} title={`Đưa "${blacklisting?.fullName}" vào danh sách đen`}>
        {formError && <Alert>{formError}</Alert>}
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Lý do <span className="text-red-500">*</span>
            </span>
            <textarea
              value={blacklistReason}
              onChange={(e) => setBlacklistReason(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="VD: Bỏ trốn, nợ quá hạn nhiều kỳ..."
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setBlacklisting(null)}>
              Hủy
            </Button>
            <Button
              variant="danger"
              disabled={!blacklistReason.trim() || blacklistMutation.isPending}
              onClick={() => blacklisting && blacklistMutation.mutate({ id: blacklisting.id, reason: blacklistReason })}
            >
              Xác nhận
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
