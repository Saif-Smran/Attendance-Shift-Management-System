import { useEffect, useMemo, useState } from "react";

import axiosInstance from "../../api/axiosInstance";
import { usePageTitle } from "../../hooks/usePageTitle";
import { toDateInputInZone, toDateKeyInZone } from "../../utils/dateTime";
import { formatDate } from "../../utils/formatDate";

const toMonthInput = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const parseMonth = (monthValue) => {
  const [yearRaw, monthRaw] = String(monthValue || "").split("-");
  const year = Number.parseInt(yearRaw, 10);
  const month = Number.parseInt(monthRaw, 10);

  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);

  return {
    year,
    month,
    first,
    last
  };
};

const MyShift = () => {
  usePageTitle("My Shift");

  const [month, setMonth] = useState(toMonthInput(new Date()));
  const [loading, setLoading] = useState(true);
  const [rosterItems, setRosterItems] = useState([]);
  const [attendanceByDate, setAttendanceByDate] = useState({});
  const [feedback, setFeedback] = useState("");

  const loadRoster = async (targetMonth = month) => {
    setLoading(true);

    try {
      const { first, last } = parseMonth(targetMonth);
      const [rosterResponse, attendanceResponse] = await Promise.all([
        axiosInstance.get("/roster/me"),
        axiosInstance.get("/attendance/me", {
          params: {
            from: toDateInputInZone(first),
            to: toDateInputInZone(last),
            page: 1,
            limit: 100
          }
        })
      ]);

      setRosterItems(rosterResponse.data?.data?.items || []);
      const attendanceMap = (attendanceResponse.data?.data?.items || []).reduce(
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
      setFeedback("");
    } catch (error) {
      setRosterItems([]);
      setAttendanceByDate({});
      setFeedback(error.response?.data?.message || "Failed to load roster details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoster(month);
  }, []);

  useEffect(() => {
    loadRoster(month);
  }, [month]);

  const currentShift = useMemo(() => {
    const todayKey = toDateKeyInZone(new Date());

    const todayItem = rosterItems.find((item) => toDateKeyInZone(new Date(item.date)) === todayKey);
    if (todayItem) {
      return todayItem;
    }

    const todayDate = new Date();
    const workedFriday =
      todayDate.getDay() === 5 &&
      !todayItem &&
      Boolean(attendanceByDate[todayKey]?.clockIn);

    if (workedFriday) {
      return {
        shiftName: "Worked Friday",
        date: todayDate,
        shiftStart: attendanceByDate[todayKey]?.clockIn,
        shiftEnd: attendanceByDate[todayKey]?.clockOut
      };
    }

    return rosterItems.find((item) => new Date(item.date).getTime() >= Date.now()) || null;
  }, [attendanceByDate, rosterItems]);

  const monthCalendar = useMemo(() => {
    const { first, last } = parseMonth(month);
    const firstWeekday = (first.getDay() + 6) % 7;
    const totalDays = last.getDate();

    const workingDays = new Map();
    rosterItems.forEach((item) => {
      const key = toDateKey(new Date(item.date));
      workingDays.set(key, item);
    });

    const cells = [];

    for (let index = 0; index < firstWeekday; index += 1) {
      cells.push({ type: "blank", key: `blank-${index}` });
    }

    for (let day = 1; day <= totalDays; day += 1) {
      const date = new Date(first.getFullYear(), first.getMonth(), day);
      const key = toDateKeyInZone(date);
      const roster = workingDays.get(key);
      const attendance = attendanceByDate[key];
      const workedFriday = !roster && date.getDay() === 5 && Boolean(attendance?.clockIn);

      cells.push({
        type: "day",
        key,
        day,
        roster,
        workedFriday
      });
    }

    return cells;
  }, [attendanceByDate, month, rosterItems]);

  return (
    <section className="space-y-5">
      <header className="rounded-xl border border-teal-100 bg-white px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-600">Employee Panel</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">My Shift</h2>
      </header>

      {feedback && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {feedback}
        </div>
      )}

      <article className="rounded-xl border border-teal-100 bg-white p-5">
        <h3 className="text-lg font-bold text-slate-900">Current Assigned Shift</h3>

        {loading ? (
          <p className="mt-3 text-sm text-slate-500">Loading current shift...</p>
        ) : !currentShift ? (
          <p className="mt-3 text-sm text-slate-500">No active or upcoming roster assignment found.</p>
        ) : (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Shift Name</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{currentShift.shiftName}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Date</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{formatDate(currentShift.date)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Start</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{currentShift.shiftStart ? new Date(currentShift.shiftStart).toLocaleTimeString("en-BD", { hour: "2-digit", minute: "2-digit" }) : "-"}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">End</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{currentShift.shiftEnd ? new Date(currentShift.shiftEnd).toLocaleTimeString("en-BD", { hour: "2-digit", minute: "2-digit" }) : "-"}</p>
            </div>
          </div>
        )}
      </article>

      <article className="rounded-xl border border-teal-100 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-slate-900">Monthly Roster Calendar</h3>
          <label className="grid gap-1 text-sm text-slate-700">
            Month
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
          <span>Sun</span>
        </div>

        <div className="mt-2 grid grid-cols-7 gap-2">
          {monthCalendar.map((cell) => {
            if (cell.type === "blank") {
              return <div key={cell.key} className="h-20 rounded-lg bg-transparent" />;
            }

            const isWorking = Boolean(cell.roster) || Boolean(cell.workedFriday);

            return (
              <div
                key={cell.key}
                className={`h-20 rounded-lg border p-2 text-left ${
                  isWorking
                    ? "border-teal-200 bg-teal-50"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <p className="text-sm font-semibold text-slate-700">{cell.day}</p>
                  <p className={`mt-1 text-[11px] font-medium ${isWorking ? "text-teal-700" : "text-slate-500"}`}>
                  {cell.roster ? cell.roster.shiftName : cell.workedFriday ? "Worked Friday" : "Rest"}
                </p>
              </div>
            );
          })}
        </div>
      </article>
    </section>
  );
};

export default MyShift;
