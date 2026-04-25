import { Link, NavLink, Outlet } from "react-router-dom";

import { useAuthStore } from "../store/authStore";

const HRLayout = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="page-shell">
      <div className="surface p-6">
        <header className="flex flex-col gap-4 border-b border-brand-100 pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
              HR DASHBOARD
            </p>
            <h1 className="text-2xl font-bold text-brand-900">People & Shift Operations</h1>
            <p className="mt-1 text-sm text-slate-600">Signed in as {user?.name || "HR"}</p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/gate"
              className="rounded-lg border border-brand-300 px-4 py-2 text-sm font-medium text-brand-700"
            >
              Gate
            </Link>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-600"
            >
              Logout
            </button>
          </div>
        </header>
        <nav className="mt-4 flex flex-wrap gap-2 border-b border-brand-100 pb-4">
          <NavLink
            to="/dashboard/hr"
            end
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 text-sm font-semibold transition ${
                isActive
                  ? "bg-brand-700 text-white"
                  : "border border-brand-300 text-brand-700 hover:bg-brand-50"
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/dashboard/hr/registrations"
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 text-sm font-semibold transition ${
                isActive
                  ? "bg-brand-700 text-white"
                  : "border border-brand-300 text-brand-700 hover:bg-brand-50"
              }`
            }
          >
            Registrations
          </NavLink>
          <NavLink
            to="/dashboard/hr/leaves"
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 text-sm font-semibold transition ${
                isActive
                  ? "bg-brand-700 text-white"
                  : "border border-brand-300 text-brand-700 hover:bg-brand-50"
              }`
            }
          >
            Leaves
          </NavLink>
          <NavLink
            to="/dashboard/hr/shifts"
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 text-sm font-semibold transition ${
                isActive
                  ? "bg-brand-700 text-white"
                  : "border border-brand-300 text-brand-700 hover:bg-brand-50"
              }`
            }
          >
            Shifts
          </NavLink>
          <NavLink
            to="/dashboard/hr/rules"
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 text-sm font-semibold transition ${
                isActive
                  ? "bg-brand-700 text-white"
                  : "border border-brand-300 text-brand-700 hover:bg-brand-50"
              }`
            }
          >
            Rules
          </NavLink>
          <NavLink
            to="/dashboard/hr/roster"
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 text-sm font-semibold transition ${
                isActive
                  ? "bg-brand-700 text-white"
                  : "border border-brand-300 text-brand-700 hover:bg-brand-50"
              }`
            }
          >
            Roster
          </NavLink>
        </nav>
        <main className="pt-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default HRLayout;
