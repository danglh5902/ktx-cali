import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { NavLink } from "react-router-dom";
import { clsx } from "clsx";
import { SIDEBAR_SECTIONS, type SidebarSection } from "./sidebar-config";

function SectionRow({ section }: { section: SidebarSection }) {
  const hasImplementedChild = section.items?.some((i) => i.path) ?? false;
  const [open, setOpen] = useState(hasImplementedChild);
  const Icon = section.icon;

  if (section.path) {
    return (
      <NavLink
        to={section.path}
        end
        className={({ isActive }) =>
          clsx(
            "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium",
            isActive ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-100",
          )
        }
      >
        <Icon size={17} />
        {section.label}
      </NavLink>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
      >
        <Icon size={17} />
        <span className="flex-1">{section.label}</span>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </button>
      {open && section.items && (
        <div className="ml-[26px] mt-0.5 space-y-0.5 border-l border-slate-200 pl-3">
          {section.items.map((item) =>
            item.path ? (
              <NavLink
                key={item.label}
                to={item.path}
                className={({ isActive }) =>
                  clsx(
                    "block rounded-md px-2.5 py-1.5 text-sm",
                    isActive ? "bg-blue-50 font-medium text-blue-700" : "text-slate-600 hover:bg-slate-100",
                  )
                }
              >
                {item.label}
              </NavLink>
            ) : (
              <div
                key={item.label}
                title="Chưa có API — sẽ triển khai ở giai đoạn sau"
                className="flex cursor-not-allowed items-center justify-between rounded-md px-2.5 py-1.5 text-sm text-slate-400"
              >
                {item.label}
                <span className="text-[10px] uppercase">sắp có</span>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

/** Sidebar admin — cấu trúc theo docs/15-ux-navigation.md §2. */
export function Sidebar() {
  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white py-3">
      <div className="mb-2 px-4 py-2">
        <span className="text-lg font-bold tracking-tight text-slate-900">KTX Cali</span>
      </div>
      <nav className="flex-1 space-y-0.5 px-2">
        {SIDEBAR_SECTIONS.map((section) => (
          <SectionRow key={section.label} section={section} />
        ))}
      </nav>
    </aside>
  );
}
