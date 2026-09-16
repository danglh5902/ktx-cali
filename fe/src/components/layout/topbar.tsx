import { Bell, LogOut, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/auth-context";
import { useBranchContext } from "../../features/property/branch-context";

/** Thanh trên cùng — docs/15-ux-navigation.md §3. */
export function Topbar() {
  const { user, logout } = useAuth();
  const { branches, selectedBranchId, setSelectedBranchId } = useBranchContext();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
      <div className="flex items-center gap-3">
        {branches.length > 1 && (
          <select
            value={selectedBranchId ?? ""}
            onChange={(e) => setSelectedBranchId(e.target.value || null)}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                Chi nhánh: {b.name}
              </option>
            ))}
          </select>
        )}

        {/* Tìm kiếm toàn cục (Ctrl+K) — chưa có endpoint search, đặt chỗ theo
            đúng vị trí docs/15 §4 để không phải dựng lại layout sau này. */}
        <div
          className="flex w-64 cursor-not-allowed items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-400"
          title="Tìm kiếm toàn cục — chưa có API, sẽ bổ sung sau"
        >
          <Search size={15} />
          <span className="flex-1">Tìm khách, phòng, hóa đơn...</span>
          <kbd className="rounded border border-slate-300 bg-white px-1 text-[10px]">Ctrl K</kbd>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          className="cursor-not-allowed rounded-full p-2 text-slate-400"
          title="Thông báo — chưa có API"
        >
          <Bell size={18} />
        </button>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-700">{user?.email ?? "—"}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 rounded-md px-2 py-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            title="Đăng xuất"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
