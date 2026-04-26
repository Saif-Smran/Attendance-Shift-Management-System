import { Outlet } from "react-router-dom";

import Sidebar from "../components/shared/Sidebar";
import { usePageTitle } from "../hooks/usePageTitle";
import { useAuthStore } from "../store/authStore";

const HRLayout = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  usePageTitle("HR Dashboard");

  const links = [
    {
      to: "/dashboard/hr",
      label: "Dashboard",
      icon: "DB",
      end: true,
      className: "text-blue-900 hover:bg-blue-50",
      activeClassName: "bg-blue-700 text-white"
    },
    {
      to: "/dashboard/hr/registrations",
      label: "Registrations",
      icon: "RG",
      className: "text-blue-900 hover:bg-blue-50",
      activeClassName: "bg-blue-700 text-white"
    },
    {
      to: "/dashboard/hr/shifts",
      label: "Shifts",
      icon: "SH",
      className: "text-blue-900 hover:bg-blue-50",
      activeClassName: "bg-blue-700 text-white"
    },
    {
      to: "/dashboard/hr/rules",
      label: "Rules",
      icon: "RL",
      className: "text-blue-900 hover:bg-blue-50",
      activeClassName: "bg-blue-700 text-white"
    },
    {
      to: "/dashboard/hr/roster",
      label: "Roster",
      icon: "RS",
      className: "text-blue-900 hover:bg-blue-50",
      activeClassName: "bg-blue-700 text-white"
    },
    {
      to: "/dashboard/hr/leaves",
      label: "Leaves",
      icon: "LV",
      className: "text-blue-900 hover:bg-blue-50",
      activeClassName: "bg-blue-700 text-white"
    },
    {
      to: "/dashboard/hr/reports",
      label: "Reports",
      icon: "RP",
      className: "text-blue-900 hover:bg-blue-50",
      activeClassName: "bg-blue-700 text-white"
    }
  ];

  return (
    <div className="mx-auto grid max-w-350 gap-4 px-4 py-6 md:grid-cols-[260px_1fr]">
      <Sidebar
        title="HR Workspace"
        subtitle="People Operations"
        links={links}
        className="border border-blue-100 bg-white text-blue-900"
      />

      <div className="rounded-2xl border border-blue-100 bg-white shadow-[0_16px_40px_rgba(30,64,175,0.08)]">
        <header className="flex flex-col gap-3 border-b border-blue-100 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">HR Dashboard</p>
            <h1 className="text-2xl font-bold text-slate-900">People & Shift Operations</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-800">
              {user?.name || "HR"}
            </span>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
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

export default HRLayout;
