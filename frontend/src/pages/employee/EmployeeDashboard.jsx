import { useEffect, useMemo, useState } from "react";

import axiosInstance from "../../api/axiosInstance";
import Badge from "../../components/ui/Badge";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useAuthStore } from "../../store/authStore";
import { toDateKeyInZone, toMonthKeyInZone } from "../../utils/dateTime";
import { formatDate } from "../../utils/formatDate";

const formatTime = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleTimeString("en-BD", {
    hour: "2-digit",
    minute: "2-digit"
  });
};

const formatDuration = (minutes) => {
  if (!Number.isFinite(minutes) || minutes < 0) {
    return "0h 0m";
  }

  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  return `${h}h ${m}m`;
};

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 17) {
    return "Good afternoon";
  }

  return "Good evening";
};

const getWeekStart = (baseDate) => {
  const date = new Date(baseDate);
  const day = date.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + offset);
  date.setHours(0, 0, 0, 0);
  return date;
};

const EmployeeDashboard = () => {
  const user = useAuthStore((state) => state.user);
  usePageTitle("Employee Dashboard");

  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: "", text: "" });
  const [tick, setTick] = useState(Date.now());
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [summary, setSummary] = useState({
    presentDays: 0,
    lateDays: 0,
    absentDays: 0,
    otHours: 0
  });
  const [rosterItems, setRosterItems] = useState([]);
  const [myLeaves, setMyLeaves] = useState([]);
  const [attendanceByDate, setAttendanceByDate] = useState({});
  const [leaveForm, setLeaveForm] = useState({
    fromDate: "",
    toDate: "",
    reason: ""
  });
  const [submittingLeave, setSubmittingLeave] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTick(Date.now());
    }, 60000);

    return () => window.clearInterval(timer);
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);

    const now = new Date();
    const today = toDateKeyInZone(now);
    const month = toMonthKeyInZone(now);
    const weekStart = getWeekStart(now);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    try {
      const [todayResponse, summaryResponse, rosterResponse, leavesResponse, weekAttendanceResponse] = await Promise.all([
        axiosInstance.get("/attendance/me", {
          params: {
            date: today,
            page: 1,
            limit: 1
          }
        }),
        axiosInstance.get("/attendance/me/summary", {
          params: {
            month
          }
        }),
        axiosInstance.get("/roster/me"),
        axiosInstance.get("/leaves/me", {
          params: {
            page: 1,
            limit: 3
          }
        }),
        axiosInstance.get("/attendance/me", {
          params: {
            from: toDateKeyInZone(weekStart),
            to: toDateKeyInZone(weekEnd),
            page: 1,
            limit: 100
          }
        })
      ]);

      const todayItem = todayResponse.data?.data?.items?.[0] || null;

      setTodayAttendance(todayItem);
      setSummary(summaryResponse.data?.data || {
        presentDays: 0,
        lateDays: 0,
        absentDays: 0,
        otHours: 0
      });
      setRosterItems(rosterResponse.data?.data?.items || []);
      setMyLeaves(leavesResponse.data?.data?.items || []);
      const attendanceMap = (weekAttendanceResponse.data?.data?.items || []).reduce(
        (accumulator, item) => {
          const key = toDateKeyInZone(item.date);
          if (key) {
            accumulator[key] = item;
          }
          return accumulator;
        },
        {}
      );
      setAttendanceByDate(attendanceMap);
      setFeedback({ type: "", text: "" });
    } catch (error) {
      setFeedback({
        type: "error",
        text: error.response?.data?.message || "Failed to load dashboard data"
      });
      setTodayAttendance(null);
      setSummary({ presentDays: 0, lateDays: 0, absentDays: 0, otHours: 0 });
      setRosterItems([]);
      setMyLeaves([]);
      setAttendanceByDate({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const weekRows = useMemo(() => {
    const today = new Date();
    const weekStart = getWeekStart(today);

    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + index);
      const key = toDateKeyInZone(day);

      const item = rosterItems.find((entry) => toDateKeyInZone(new Date(entry.date)) === key);
      const attendance = attendanceByDate[key];
      const hasWorkedFriday = !item && day.getDay() === 5 && Boolean(attendance?.clockIn);

      return {
        key,
        dayLabel: day.toLocaleDateString("en-BD", { weekday: "short" }),
        shiftName: hasWorkedFriday ? "Worked Friday" : item?.shiftName || "Rest Day",
        start: hasWorkedFriday ? formatTime(attendance.clockIn) : item?.shiftStart || "-",
        end: hasWorkedFriday ? formatTime(attendance.clockOut) : item?.shiftEnd || "-",
        isToday: key === toDateKeyInZone(new Date())
      };
    });
  }, [attendanceByDate, rosterItems]);

  const todayWorkMinutes = useMemo(() => {
    if (!todayAttendance?.clockIn) {
      return 0;
    }

    const start = new Date(todayAttendance.clockIn).getTime();
    const end = todayAttendance.clockOut
      ? new Date(todayAttendance.clockOut).getTime()
      : new Date(tick).getTime();

    const minutes = (end - start) / (1000 * 60);
    return Math.max(0, minutes);
  }, [todayAttendance, tick]);

  const todayCard = useMemo(() => {
    if (!todayAttendance) {
      return {
        title: "Not yet clocked in today",
        subtitle: "Please clock in from gate terminal when your shift starts.",
        badge: "ABSENT"
      };
    }

    if (todayAttendance.clockIn && !todayAttendance.clockOut) {
      return {
        title: `Clocked in at ${formatTime(todayAttendance.clockIn)}`,
        subtitle: `Duration so far: ${formatDuration(todayWorkMinutes)}`,
        badge: todayAttendance.status || "PRESENT"
      };
    }

    return {
      title: `${formatTime(todayAttendance.clockIn)} - ${formatTime(todayAttendance.clockOut)}`,
      subtitle: `Total: ${formatDuration(todayWorkMinutes)} | OT: ${Number(
        todayAttendance.otHours || 0
      ).toFixed(2)}h`,
      badge: todayAttendance.status || "PRESENT"
    };
  }, [todayAttendance, todayWorkMinutes]);

  const submitLeave = async (event) => {
    event.preventDefault();

    if (!leaveForm.fromDate || !leaveForm.toDate || !leaveForm.reason.trim()) {
      setFeedback({ type: "error", text: "From date, to date, and reason are required" });
      return;
    }

    setSubmittingLeave(true);

    try {
      await axiosInstance.post("/leaves", leaveForm);
      setLeaveForm({ fromDate: "", toDate: "", reason: "" });
      setFeedback({ type: "success", text: "Leave application submitted" });
      await loadDashboardData();
    } catch (error) {
      setFeedback({
        type: "error",
        text: error.response?.data?.message || "Failed to submit leave"
      });
    } finally {
      setSubmittingLeave(false);
    }
  };

  return (
    <section className="space-y-6 text-slate-800">
      <header className="rounded-2xl border border-teal-100 bg-white px-6 py-5 shadow-[0_16px_30px_rgba(13,148,136,0.08)]">
        <p className="text-sm font-semibold text-teal-600">{getGreeting()}, {user?.name || "Employee"}</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">Your Attendance Snapshot</h2>
        <p className="mt-2 text-sm text-slate-600">
          Employee ID: <span className="font-semibold text-slate-800">{user?.employeeCode || "-"}</span>
          <span className="mx-2">|</span>
          Department: <span className="font-semibold text-slate-800">{todayAttendance?.departmentName || user?.departmentId || "-"}</span>
        </p>
      </header>

      {feedback.text && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            feedback.type === "error"
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {feedback.text}
        </div>
      )}

      <article className="rounded-2xl border border-teal-200 bg-linear-to-r from-white via-teal-50 to-white p-6 shadow-[0_20px_40px_rgba(13,148,136,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-600">Today Status</p>
            <h3 className="mt-2 text-2xl font-bold text-slate-900">{todayCard.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{todayCard.subtitle}</p>
          </div>
          <Badge value={todayCard.badge} className="text-sm" />
        </div>
      </article>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-teal-100 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600">Present Days</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{summary.presentDays || 0}</p>
        </article>
        <article className="rounded-xl border border-teal-100 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600">Late Days</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{summary.lateDays || 0}</p>
        </article>
        <article className="rounded-xl border border-teal-100 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600">Absent Days</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{summary.absentDays || 0}</p>
        </article>
        <article className="rounded-xl border border-teal-100 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600">OT Hours</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{Number(summary.otHours || 0).toFixed(2)}</p>
        </article>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-xl border border-teal-100 bg-white p-5">
          <h3 className="text-lg font-bold text-slate-900">This Week Shift Schedule</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-105 text-sm">
              <thead>
                <tr className="border-b border-teal-100 text-left text-xs uppercase tracking-[0.08em] text-teal-700">
                  <th className="pb-2">Day</th>
                  <th className="pb-2">Shift Name</th>
                  <th className="pb-2">Start</th>
                  <th className="pb-2">End</th>
                </tr>
              </thead>
              <tbody>
                {weekRows.map((row) => (
                  <tr
                    key={row.key}
                    className={`border-b border-slate-100 ${
                      row.isToday ? "bg-teal-50" : "bg-transparent"
                    }`}
                  >
                    <td className="py-2 pr-3 font-semibold text-slate-800">{row.dayLabel}</td>
                    <td className="py-2 pr-3 text-slate-700">{row.shiftName}</td>
                    <td className="py-2 pr-3 text-slate-600">{row.start}</td>
                    <td className="py-2 text-slate-600">{row.end}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-xl border border-teal-100 bg-white p-5">
          <h3 className="text-lg font-bold text-slate-900">Apply Leave</h3>
          <form onSubmit={submitLeave} className="mt-4 grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm text-slate-700">
                From date
                <input
                  type="date"
                  value={leaveForm.fromDate}
                  onChange={(e) => setLeaveForm((prev) => ({ ...prev, fromDate: e.target.value }))}
                  className="rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="grid gap-1 text-sm text-slate-700">
                To date
                <input
                  type="date"
                  value={leaveForm.toDate}
                  onChange={(e) => setLeaveForm((prev) => ({ ...prev, toDate: e.target.value }))}
                  className="rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
            </div>
            <label className="grid gap-1 text-sm text-slate-700">
              Reason
              <textarea
                rows={3}
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm((prev) => ({ ...prev, reason: e.target.value }))}
                className="rounded-lg border border-slate-300 px-3 py-2"
                placeholder="Write a short reason"
              />
            </label>
            <button
              type="submit"
              disabled={submittingLeave}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submittingLeave ? "Submitting..." : "Submit"}
            </button>
          </form>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600">Last 3 applications</p>
            <div className="mt-2 space-y-2">
              {loading ? (
                <p className="text-sm text-slate-500">Loading leave history...</p>
              ) : myLeaves.length === 0 ? (
                <p className="text-sm text-slate-500">No leave applications yet.</p>
              ) : (
                myLeaves.map((leave) => (
                  <div key={leave.id} className="rounded-lg border border-slate-200 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-slate-700">
                        {formatDate(leave.fromDate)} - {formatDate(leave.toDate)}
                      </p>
                      <Badge value={leave.status} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{leave.reason}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
};

export default EmployeeDashboard;
