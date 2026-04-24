import { useEffect, useMemo, useState } from "react";

import axiosInstance from "../../api/axiosInstance";
import Badge from "../../components/ui/Badge";

const SHIFT_TYPE_COLORS = {
  GENERAL_DAY: "bg-sky-50 text-sky-700 border border-sky-200",
  RAMADAN_DAY: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  NIGHT: "bg-slate-100 text-slate-700 border border-slate-300",
  RAMADAN_NIGHT: "bg-violet-50 text-violet-700 border border-violet-200",
  SECURITY_DAY: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  SECURITY_NIGHT: "bg-amber-50 text-amber-700 border border-amber-200",
  FRIDAY: "bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200"
};

const Shifts = () => {
  const [shifts, setShifts] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  const sortedShifts = useMemo(() => {
    return [...shifts].sort((a, b) => a.name.localeCompare(b.name));
  }, [shifts]);

  const loadShifts = async () => {
    setLoading(true);

    try {
      const response = await axiosInstance.get("/shifts");
      const items = response.data?.data?.items || [];
      setShifts(items);

      const nextDrafts = {};
      items.forEach((item) => {
        nextDrafts[item.id] = {
          startTime: item.startTime,
          endTime: item.endTime,
          breakDurationMinutes: String(item.breakDurationMinutes)
        };
      });
      setDrafts(nextDrafts);
    } catch (error) {
      setShifts([]);
      setFeedback({
        type: "error",
        text: error.response?.data?.message || "Failed to load shifts"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShifts();
  }, []);

  const updateDraftField = (id, field, value) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [field]: value
      }
    }));
  };

  const handleSave = async (shift) => {
    const draft = drafts[shift.id];

    if (!draft?.startTime || !draft?.endTime) {
      setFeedback({ type: "error", text: "Start and end time are required" });
      return;
    }

    const breakDurationMinutes = Number.parseInt(draft.breakDurationMinutes, 10);

    if (!Number.isFinite(breakDurationMinutes) || breakDurationMinutes < 0) {
      setFeedback({ type: "error", text: "Break duration must be a valid number" });
      return;
    }

    setSavingId(shift.id);

    try {
      const payload = {
        startTime: draft.startTime,
        endTime: draft.endTime,
        breakDurationMinutes
      };

      const response = await axiosInstance.put(`/shifts/${shift.id}`, payload);
      const updated = response.data?.data;

      setShifts((prev) => prev.map((item) => (item.id === shift.id ? updated : item)));
      setFeedback({ type: "success", text: `${shift.name} updated successfully` });
    } catch (error) {
      setFeedback({
        type: "error",
        text: error.response?.data?.message || "Failed to update shift"
      });
    } finally {
      setSavingId("");
    }
  };

  return (
    <section className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">HR Panel</p>
        <h2 className="text-2xl font-bold text-brand-900">Shift Settings</h2>
        <p className="mt-1 text-sm text-slate-600">Manage start/end times and break duration for each shift.</p>
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

      <article className="overflow-hidden rounded-xl border border-brand-100 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <thead className="bg-brand-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-brand-700">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-brand-700">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-brand-700">Start</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-brand-700">End</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-brand-700">Break Duration (min)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-brand-700">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Loading shifts...
                  </td>
                </tr>
              ) : sortedShifts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No shifts found.
                  </td>
                </tr>
              ) : (
                sortedShifts.map((shift) => {
                  const draft = drafts[shift.id] || {};
                  return (
                    <tr key={shift.id} className="border-t border-brand-50">
                      <td className="px-4 py-3 font-semibold text-slate-800">{shift.name}</td>
                      <td className="px-4 py-3">
                        <Badge
                          label={shift.type}
                          className={SHIFT_TYPE_COLORS[shift.type] || "border border-slate-300 bg-slate-50 text-slate-700"}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="time"
                          value={draft.startTime || ""}
                          onChange={(event) => updateDraftField(shift.id, "startTime", event.target.value)}
                          className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="time"
                          value={draft.endTime || ""}
                          onChange={(event) => updateDraftField(shift.id, "endTime", event.target.value)}
                          className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          value={draft.breakDurationMinutes || ""}
                          onChange={(event) =>
                            updateDraftField(shift.id, "breakDurationMinutes", event.target.value)
                          }
                          className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleSave(shift)}
                          disabled={savingId === shift.id}
                          className="rounded-lg bg-brand-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingId === shift.id ? "Saving..." : "Save"}
                        </button>
                      </td>
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

export default Shifts;
