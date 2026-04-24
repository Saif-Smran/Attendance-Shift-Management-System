import { useEffect, useMemo, useState } from "react";

import axiosInstance from "../../api/axiosInstance";
import Badge from "../../components/ui/Badge";
import { formatDate } from "../../utils/formatDate";

const SHIFT_TYPE_COLORS = {
  GENERAL_DAY: "bg-sky-50 text-sky-700 border border-sky-200",
  RAMADAN_DAY: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  NIGHT: "bg-slate-100 text-slate-700 border border-slate-300",
  RAMADAN_NIGHT: "bg-violet-50 text-violet-700 border border-violet-200",
  SECURITY_DAY: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  SECURITY_NIGHT: "bg-amber-50 text-amber-700 border border-amber-200",
  FRIDAY: "bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200"
};

const toDateInput = (date) => date.toISOString().slice(0, 10);

const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const buildWeekDays = (start) => {
  const days = [];
  for (let index = 0; index < 7; index += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + index);
    days.push(d);
  }
  return days;
};

const Roster = () => {
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));
  const [rosters, setRosters] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", text: "" });
  const [department, setDepartment] = useState("");

  const [assignForm, setAssignForm] = useState({
    userId: "",
    shiftId: "",
    startDate: toDateInput(new Date()),
    endDate: toDateInput(new Date())
  });

  const weekDays = useMemo(() => buildWeekDays(weekStart), [weekStart]);

  const rosterMap = useMemo(() => {
    const map = new Map();
    rosters.forEach((item) => {
      const key = `${item.userId}::${new Date(item.date).toISOString().slice(0, 10)}`;
      map.set(key, item);
    });
    return map;
  }, [rosters]);

  const visibleEmployees = useMemo(() => {
    if (!department) {
      return employees;
    }

    return employees.filter((employee) => {
      const name = (employee.departmentName || "").toLowerCase();
      return name.includes(department.toLowerCase());
    });
  }, [employees, department]);

  const loadStaticData = async () => {
    const [employeeResponse, shiftResponse] = await Promise.all([
      axiosInstance.get("/employees", {
        params: {
          page: 1,
          limit: 100,
          role: "EMPLOYEE"
        }
      }),
      axiosInstance.get("/shifts")
    ]);

    setEmployees(employeeResponse.data?.data?.items || []);
    setShifts(shiftResponse.data?.data?.items || []);
  };

  const loadRoster = async () => {
    setLoading(true);

    try {
      const rangeStart = toDateInput(weekDays[0]);
      const rangeEnd = toDateInput(weekDays[6]);

      const response = await axiosInstance.get("/roster", {
        params: {
          date: toDateInput(weekStart),
          startDate: rangeStart,
          endDate: rangeEnd,
          department
        }
      });

      setRosters(response.data?.data?.items || []);
    } catch (error) {
      setFeedback({
        type: "error",
        text: error.response?.data?.message || "Failed to load roster"
      });
      setRosters([]);
    } finally {
      setLoading(false);
    }
  };

  const initialize = async () => {
    setLoading(true);

    try {
      await loadStaticData();
      await loadRoster();
    } catch (error) {
      setFeedback({
        type: "error",
        text: error.response?.data?.message || "Failed to initialize roster page"
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    loadRoster();
  }, [weekStart, department]);

  const moveWeek = (offset) => {
    setWeekStart((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + offset * 7);
      return getWeekStart(next);
    });
  };

  const assignRoster = async (event) => {
    event.preventDefault();

    if (!assignForm.userId || !assignForm.shiftId || !assignForm.startDate || !assignForm.endDate) {
      setFeedback({ type: "error", text: "User, shift, start date, and end date are required" });
      return;
    }

    setAssigning(true);

    try {
      const response = await axiosInstance.post("/roster", {
        userId: assignForm.userId,
        shiftId: assignForm.shiftId,
        dateRange: {
          startDate: assignForm.startDate,
          endDate: assignForm.endDate
        }
      });

      const warning = response.data?.data?.warning;

      setFeedback({
        type: warning ? "error" : "success",
        text: warning || "Roster assigned successfully"
      });

      await loadRoster();
    } catch (error) {
      setFeedback({
        type: "error",
        text: error.response?.data?.message || "Failed to assign roster"
      });
    } finally {
      setAssigning(false);
    }
  };

  return (
    <section className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">HR Panel</p>
        <h2 className="text-2xl font-bold text-brand-900">Weekly Roster</h2>
      </div>

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

      <article className="rounded-xl border border-brand-100 bg-white p-4">
        <div className="flex flex-wrap items-end gap-3">
          <button type="button" onClick={() => moveWeek(-1)} className="rounded-lg border border-brand-300 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50">
            Previous Week
          </button>
          <button type="button" onClick={() => moveWeek(1)} className="rounded-lg border border-brand-300 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50">
            Next Week
          </button>
          <label className="grid gap-1 text-sm text-slate-700">
            Week start
            <input type="date" value={toDateInput(weekStart)} onChange={(e) => setWeekStart(getWeekStart(new Date(e.target.value)))} className="rounded-lg border border-slate-300 px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm text-slate-700">
            Filter department
            <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Search department" className="rounded-lg border border-slate-300 px-3 py-2" />
          </label>
        </div>
      </article>

      <article className="rounded-xl border border-brand-100 bg-white p-4">
        <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-brand-700">Assign Shift</h3>
        <form onSubmit={assignRoster} className="mt-3 grid gap-3 md:grid-cols-5">
          <label className="grid gap-1 text-sm text-slate-700 md:col-span-2">
            Employee
            <select value={assignForm.userId} onChange={(e) => setAssignForm((prev) => ({ ...prev, userId: e.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2">
              <option value="">Select employee</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.employeeCode} - {employee.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm text-slate-700">
            Shift
            <select value={assignForm.shiftId} onChange={(e) => setAssignForm((prev) => ({ ...prev, shiftId: e.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2">
              <option value="">Select shift</option>
              {shifts.map((shift) => (
                <option key={shift.id} value={shift.id}>
                  {shift.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm text-slate-700">
            Start date
            <input type="date" value={assignForm.startDate} onChange={(e) => setAssignForm((prev) => ({ ...prev, startDate: e.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2" />
          </label>

          <label className="grid gap-1 text-sm text-slate-700">
            End date
            <input type="date" value={assignForm.endDate} onChange={(e) => setAssignForm((prev) => ({ ...prev, endDate: e.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2" />
          </label>

          <div className="md:col-span-5">
            <button type="submit" disabled={assigning} className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60">
              {assigning ? "Assigning..." : "Assign"}
            </button>
          </div>
        </form>
      </article>

      <article className="overflow-hidden rounded-xl border border-brand-100 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-245 border-collapse text-sm">
            <thead className="bg-brand-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-brand-700">Employee</th>
                {weekDays.map((day) => (
                  <th key={day.toISOString()} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-brand-700">
                    {formatDate(day)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    Loading roster...
                  </td>
                </tr>
              ) : visibleEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No employees found.
                  </td>
                </tr>
              ) : (
                visibleEmployees.map((employee) => {
                  const warningRecord = rosters.find(
                    (entry) => entry.userId === employee.id && entry.nearLimitWarning
                  );

                  return (
                    <tr key={employee.id} className="border-t border-brand-50">
                      <td className="px-4 py-3 align-top">
                        <div className="font-semibold text-slate-800">{employee.name}</div>
                        <div className="text-xs text-slate-500">{employee.employeeCode}</div>
                        {warningRecord && (
                          <div className="mt-1 text-xs font-semibold text-amber-700">
                            Warning: {warningRecord.consecutiveDays}+ consecutive days
                          </div>
                        )}
                      </td>

                      {weekDays.map((day) => {
                        const key = `${employee.id}::${toDateInput(day)}`;
                        const record = rosterMap.get(key);

                        return (
                          <td key={key} className="px-4 py-3 align-top">
                            {record ? (
                              <Badge
                                label={record.shiftName}
                                className={SHIFT_TYPE_COLORS[record.shiftType] || "border border-slate-300 bg-slate-50 text-slate-700"}
                              />
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
};

export default Roster;
