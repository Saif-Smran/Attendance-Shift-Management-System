import { NavLink, Outlet } from "react-router-dom";

import { usePageTitle } from "../hooks/usePageTitle";
import { useAuthStore } from "../store/authStore";

const EmployeeLayout = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  usePageTitle("Employee Dashboard");

  const navClass = ({ isActive }) =>
    `rounded-md px-3 py-2 text-sm font-semibold transition ${
      isActive ? "bg-white text-teal-700" : "text-white/90 hover:bg-teal-500"
    }`;

  return (
    <div className="min-h-screen bg-[#fffdf8]">
      <header className="border-b border-teal-700/20 bg-teal-600 px-4 py-3 text-white shadow-sm">
        <div className="mx-auto flex max-w-325 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-extrabold text-teal-700">
              HM
            </div>
            <div>
              <p className="text-sm font-semibold">Ha-Meem Group</p>
              <p className="text-xs text-teal-50">{user?.name || "Employee"}</p>
            </div>
          </div>

          <nav className="flex flex-wrap gap-2">
            <NavLink to="/dashboard/employee" end className={navClass}>
              Dashboard
            </NavLink>
            <NavLink to="/dashboard/employee/my-attendance" className={navClass}>
              My Attendance
            </NavLink>
            <NavLink to="/dashboard/employee/my-leaves" className={navClass}>
              My Leaves
            </NavLink>
            <NavLink to="/dashboard/employee/my-shift" className={navClass}>
              My Shift
            </NavLink>
            <button
              type="button"
              onClick={logout}
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-50"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-325 px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default EmployeeLayout;
