import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import axiosInstance from "../../api/axiosInstance";
import { useAuthStore } from "../../store/authStore";
import { formatDate } from "../../utils/formatDate";

const getNowText = () => {
  const now = new Date();

  return {
    date: now.toLocaleDateString("en-BD", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    }),
    time: now.toLocaleTimeString("en-BD", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    })
  };
};

const initialSummary = {
  totalEmployees: 0,
  breakdown: {
    workers: 0,
    staff: 0,
    security: 0,
    hr: 0
  },
  presentToday: {
    count: 0,
    percentage: 0
  },
  lateToday: {
    count: 0
  },
  pendingRegistrations: {
    count: 0
  },
  departmentAttendance: [],
  flaggedEvents: []
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [summary, setSummary] = useState(initialSummary);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: "", text: "" });
  const [clock, setClock] = useState(getNowText());

  const loadSummary = async () => {
    setLoading(true);

    try {
      const response = await axiosInstance.get("/dashboard/admin");
      setSummary(response.data?.data || initialSummary);
      setFeedback({ type: "", text: "" });
    } catch (error) {
      setSummary(initialSummary);
      setFeedback({
        type: "error",
        text: error.response?.data?.message || "Failed to load admin dashboard"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClock(getNowText());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const quickActions = useMemo(
    () => [
      { label: "Manage Employees", to: "/dashboard/admin/employees" },
      { label: "View Reports", to: "/dashboard/admin/reports" },
      { label: "Manage Departments", to: "/dashboard/admin/departments" },
      { label: "Review Registrations", to: "/dashboard/hr/registrations" }
    ],
    []
  );

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-amber-400/25 bg-slate-900 p-6 text-white shadow-[0_24px_45px_rgba(0,0,0,0.35)]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Admin Command Center</p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Welcome back, {user?.name || "Admin"}</h2>
            <p className="mt-2 text-sm text-slate-200">{clock.date}</p>
            <p className="text-lg font-semibold text-amber-300">{clock.time}</p>
          </div>
          <button
            type="button"
            onClick={loadSummary}
            className="rounded-lg border border-amber-300/70 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-200 transition hover:bg-amber-400/20"
          >
            Refresh Snapshot
          </button>
        </div>
      </header>

      {feedback.text && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            feedback.type === "error"
              ? "border-rose-300 bg-rose-50 text-rose-700"
              : "border-emerald-300 bg-emerald-50 text-emerald-700"
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-slate-700 bg-slate-900 p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Total Employees</p>
          <p className="mt-2 text-3xl font-bold">{summary.totalEmployees}</p>
          <p className="mt-2 text-xs text-slate-300">
            Workers {summary.breakdown.workers} | Staff {summary.breakdown.staff} | Security {summary.breakdown.security} | HR {summary.breakdown.hr}
          </p>
        </article>

        <article className="rounded-xl border border-slate-700 bg-slate-900 p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Present Today</p>
          <p className="mt-2 text-3xl font-bold">{summary.presentToday.count}</p>
          <p className="mt-2 text-xs text-slate-300">{summary.presentToday.percentage}% of operational staff</p>
        </article>

        <article className="rounded-xl border border-slate-700 bg-slate-900 p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Late Today</p>
          <p className="mt-2 text-3xl font-bold">{summary.lateToday.count}</p>
          <p className="mt-2 text-xs text-slate-300">Includes late and excessive late statuses</p>
        </article>

        <button
          type="button"
          onClick={() => navigate("/dashboard/hr/registrations")}
          className="rounded-xl border border-amber-300 bg-amber-400/90 p-5 text-left text-slate-900 transition hover:bg-amber-400"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-800">Pending Registrations</p>
          <p className="mt-2 text-3xl font-bold">{summary.pendingRegistrations.count}</p>
          <p className="mt-2 text-xs font-medium text-slate-700">Click to review now</p>
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <article className="rounded-xl border border-slate-700 bg-slate-900 p-5 text-white xl:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Department Attendance</h3>
            <span className="text-xs uppercase tracking-[0.14em] text-amber-300">Today</span>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.departmentAttendance}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                <XAxis dataKey="departmentName" tick={{ fill: "#e2e8f0", fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: "#e2e8f0", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #f59e0b", color: "#fff" }}
                  labelStyle={{ color: "#f8fafc" }}
                />
                <Bar dataKey="presentCount" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Flagged Attendance Events</h3>
            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Live</span>
          </div>

          <div className="overflow-auto">
            <table className="w-full min-w-90 text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.08em] text-slate-500">
                  <th className="pb-2">Employee</th>
                  <th className="pb-2">Flag Reason</th>
                  <th className="pb-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="py-3 text-slate-500" colSpan={3}>
                      Loading events...
                    </td>
                  </tr>
                ) : summary.flaggedEvents.length === 0 ? (
                  <tr>
                    <td className="py-3 text-slate-500" colSpan={3}>
                      No flagged events today.
                    </td>
                  </tr>
                ) : (
                  summary.flaggedEvents.map((event) => (
                    <tr key={event.id} className="border-b border-slate-100 align-top">
                      <td className="py-2 pr-2 font-medium text-slate-800">{event.employeeName}</td>
                      <td className="py-2 pr-2">
                        <span className="inline-flex rounded-full border border-rose-300 bg-rose-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.04em] text-rose-700">
                          {event.flagReason}
                        </span>
                      </td>
                      <td className="py-2 text-slate-600">{formatDate(event.time, "en-BD", { hour: "2-digit", minute: "2-digit" })}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>
      </div>

      <article className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-lg font-semibold text-slate-900">Quick Actions</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-amber-400 hover:bg-amber-50"
            >
              {action.label}
            </Link>
          ))}
        </div>
      </article>
    </section>
  );
};

export default AdminDashboard;
