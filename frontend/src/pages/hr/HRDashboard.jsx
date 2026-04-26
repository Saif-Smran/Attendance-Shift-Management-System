import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import axiosInstance from "../../api/axiosInstance";
import { useAuthStore } from "../../store/authStore";
import { toDateKeyInZone } from "../../utils/dateTime";
import { formatDate } from "../../utils/formatDate";

const initialSummary = {
  pendingRegistrations: { count: 0 },
  pendingLeaveApplications: { count: 0 },
  presentToday: { count: 0, totalOperational: 0 },
  flaggedAttendanceToday: { count: 0 },
  weeklyTrend: [],
  recentLeaveApplications: []
};

const getBadgeClassName = (status) => {
  if (status === "PENDING") {
    return "border-amber-300 bg-amber-100 text-amber-700";
  }

  if (status === "APPROVED") {
    return "border-emerald-300 bg-emerald-100 text-emerald-700";
  }

  return "border-rose-300 bg-rose-100 text-rose-700";
};

const HRDashboard = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [summary, setSummary] = useState(initialSummary);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  const loadSummary = async () => {
    setLoading(true);

    try {
      const response = await axiosInstance.get("/dashboard/hr");
      setSummary(response.data?.data || initialSummary);
      setFeedback({ type: "", text: "" });
    } catch (error) {
      setSummary(initialSummary);
      setFeedback({
        type: "error",
        text: error.response?.data?.message || "Failed to load HR dashboard"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const handleReviewLeave = async (leaveId, action) => {
    setActionLoadingId(`${leaveId}:${action}`);

    try {
      await axiosInstance.put(`/leaves/${leaveId}/${action}`);
      setFeedback({
        type: "success",
        text: `Leave application ${action === "approve" ? "approved" : "rejected"} successfully`
      });
      await loadSummary();
    } catch (error) {
      setFeedback({
        type: "error",
        text: error.response?.data?.message || "Failed to update leave application"
      });
    } finally {
      setActionLoadingId("");
    }
  };

  const handleExportReport = () => {
    const header = ["Day", "Date", "Present", "Late", "Absent"];
    const rows = summary.weeklyTrend.map((day) => [
      day.dayLabel,
      formatDate(day.date),
      day.present,
      day.late,
      day.absent
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `hr-weekly-attendance-${toDateKeyInZone(new Date())}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const quickActions = useMemo(
    () => [
      { label: "Review Registrations", to: "/dashboard/hr/registrations" },
      { label: "Configure Rules", to: "/dashboard/hr/rules" },
      { label: "Manage Shifts", to: "/dashboard/hr/shifts" }
    ],
    []
  );

  return (
    <section className="space-y-6 rounded-2xl bg-white p-1">
      <header className="rounded-2xl border border-blue-100 bg-white p-6 shadow-[0_18px_36px_rgba(30,64,175,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">HR Dashboard</p>
        <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Welcome, {user?.name || "HR"}</h2>
          <button
            type="button"
            onClick={loadSummary}
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            Refresh
          </button>
        </div>
      </header>

      {summary.pendingLeaveApplications.count > 0 && (
        <button
          type="button"
          onClick={() => navigate("/dashboard/hr/leaves")}
          className="w-full rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-left text-sm font-semibold text-amber-800"
        >
          {summary.pendingLeaveApplications.count} leave applications pending review
        </button>
      )}

      {feedback.text && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            feedback.type === "error"
              ? "border border-rose-200 bg-rose-50 text-rose-700"
              : "border border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-blue-100 bg-blue-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Pending Registrations</p>
          <p className="mt-2 text-3xl font-bold text-blue-900">{summary.pendingRegistrations.count}</p>
        </article>

        <article className="rounded-xl border border-blue-100 bg-blue-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Pending Leave Applications</p>
          <p className="mt-2 text-3xl font-bold text-blue-900">{summary.pendingLeaveApplications.count}</p>
        </article>

        <article className="rounded-xl border border-blue-100 bg-blue-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Present Today</p>
          <p className="mt-2 text-3xl font-bold text-blue-900">{summary.presentToday.count}</p>
          <p className="mt-1 text-xs text-slate-600">Out of {summary.presentToday.totalOperational} operational employees</p>
        </article>

        <article className="rounded-xl border border-blue-100 bg-blue-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Flagged Attendance</p>
          <p className="mt-2 text-3xl font-bold text-blue-900">{summary.flaggedAttendanceToday.count}</p>
        </article>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-xl border border-blue-100 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Weekly Attendance Trend</h3>
            <span className="text-xs uppercase tracking-[0.14em] text-blue-700">Present vs Late vs Absent</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary.weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" />
                <XAxis dataKey="dayLabel" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="present" stroke="#1e40af" strokeWidth={2.5} />
                <Line type="monotone" dataKey="late" stroke="#d97706" strokeWidth={2.5} />
                <Line type="monotone" dataKey="absent" stroke="#dc2626" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-xl border border-blue-100 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Recent Leave Applications</h3>
            <span className="text-xs uppercase tracking-[0.14em] text-slate-500">Latest</span>
          </div>

          <div className="overflow-auto">
            <table className="w-full min-w-105 text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.08em] text-slate-500">
                  <th className="pb-2">Employee</th>
                  <th className="pb-2">Dates</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-3 text-slate-500">
                      Loading leave applications...
                    </td>
                  </tr>
                ) : summary.recentLeaveApplications.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-3 text-slate-500">
                      No leave applications available.
                    </td>
                  </tr>
                ) : (
                  summary.recentLeaveApplications.map((leaveApplication) => (
                    <tr key={leaveApplication.id} className="border-b border-slate-100 align-top">
                      <td className="py-2 pr-2 font-medium text-slate-800">{leaveApplication.employeeName}</td>
                      <td className="py-2 pr-2 text-slate-600">
                        {formatDate(leaveApplication.fromDate)} - {formatDate(leaveApplication.toDate)}
                      </td>
                      <td className="py-2 pr-2">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.04em] ${getBadgeClassName(
                            leaveApplication.status
                          )}`}
                        >
                          {leaveApplication.status}
                        </span>
                      </td>
                      <td className="py-2">
                        {leaveApplication.status === "PENDING" ? (
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => handleReviewLeave(leaveApplication.id, "approve")}
                              disabled={Boolean(actionLoadingId)}
                              className="rounded-md border border-emerald-300 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                            >
                              {actionLoadingId === `${leaveApplication.id}:approve` ? "..." : "Approve"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReviewLeave(leaveApplication.id, "reject")}
                              disabled={Boolean(actionLoadingId)}
                              className="rounded-md border border-rose-300 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                            >
                              {actionLoadingId === `${leaveApplication.id}:reject` ? "..." : "Reject"}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">No action</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>
      </div>

      <article className="rounded-xl border border-blue-100 bg-white p-5">
        <h3 className="text-lg font-semibold text-slate-900">Quick Actions</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800 transition hover:bg-blue-100"
            >
              {action.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={handleExportReport}
            className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-left text-sm font-semibold text-blue-800 transition hover:bg-blue-100"
          >
            Export Report
          </button>
        </div>
      </article>
    </section>
  );
};

export default HRDashboard;
