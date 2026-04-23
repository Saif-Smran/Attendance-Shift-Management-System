import { Link } from "react-router-dom";

const Gate = () => {
  return (
    <div className="page-shell">
      <div className="surface overflow-hidden">
        <div className="bg-brand-900 px-6 py-8 text-brand-50">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-200">Ha-Meem Group</p>
          <h1 className="mt-2 text-3xl font-bold">Attendance & Shift Management System</h1>
          <p className="mt-2 max-w-2xl text-sm text-brand-100">
            Centralized attendance, roster, and leave operations for Admin, HR, Employees, and Security.
          </p>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-3">
          <Link
            to="/login"
            className="rounded-xl border border-brand-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-brand-400"
          >
            <h2 className="text-lg font-semibold text-brand-900">Login</h2>
            <p className="mt-1 text-sm text-slate-600">Authenticate with your assigned role and continue.</p>
          </Link>

          <Link
            to="/register"
            className="rounded-xl border border-brand-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-brand-400"
          >
            <h2 className="text-lg font-semibold text-brand-900">Register</h2>
            <p className="mt-1 text-sm text-slate-600">Submit a registration request for HR/Admin review.</p>
          </Link>

          <div className="rounded-xl border border-brand-200 bg-brand-50 p-5">
            <h2 className="text-lg font-semibold text-brand-900">Dashboards</h2>
            <p className="mt-1 text-sm text-slate-600">
              Protected routes are available at /dashboard/admin, /dashboard/hr, and /dashboard/employee.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Gate;
