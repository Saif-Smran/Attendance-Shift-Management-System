import { Outlet } from "react-router-dom";

import Sidebar from "../components/shared/Sidebar";
import { usePageTitle } from "../hooks/usePageTitle";
import { useAuthStore } from "../store/authStore";

const AdminLayout = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  usePageTitle("Admin Dashboard");

  const links = [
    {
      to: "/dashboard/admin",
      label: "Dashboard",
      icon: "DB",
      end: true,
      className: "text-slate-200 hover:bg-[#20355a]",
      activeClassName: "bg-[#d4af37] text-[#1a2740]"
    },
    {
      to: "/dashboard/admin/employees",
      label: "Employees",
      icon: "EM",
      className: "text-slate-200 hover:bg-[#20355a]",
      activeClassName: "bg-[#d4af37] text-[#1a2740]"
    },
    {
      to: "/dashboard/admin/departments",
      label: "Departments",
      icon: "DP",
      className: "text-slate-200 hover:bg-[#20355a]",
      activeClassName: "bg-[#d4af37] text-[#1a2740]"
    },
    {
      to: "/dashboard/admin/reports",
      label: "Reports",
      icon: "RP",
      className: "text-slate-200 hover:bg-[#20355a]",
      activeClassName: "bg-[#d4af37] text-[#1a2740]"
    }
  ];

  return (
    <div className="mx-auto grid max-w-350 gap-4 px-4 py-6 md:grid-cols-[260px_1fr]">
      <Sidebar
        title="Admin"
        subtitle="Control Center"
        links={links}
        className="bg-[#16233b] text-[#f6d98b]"
      />

      <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
        <header className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Admin Panel</p>
            <h1 className="text-2xl font-bold text-slate-900">Ha-Meem Operations Control</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
              {user?.name || "Admin"}
            </span>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg bg-[#16233b] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#20355a]"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
