import { useEffect, useMemo, useState } from "react";

import axiosInstance from "../../api/axiosInstance";
import { formatDate } from "../../utils/formatDate";

const defaultForm = {
  lateThresholdMinutes: "15",
  excessiveLateAfterMinutes: "15",
  tiffinBreakMinutes: "60",
  earlyExitFlagStartMinutes: "60",
  earlyExitFlagEndMinutes: "30",
  maxRosterDays: "14",
  ramadanActive: false,
  ramadanStartDate: "",
  ramadanEndDate: "",
  iftarTime: "",
  sehriStart: "04:00",
  sehriEnd: "05:00",
  iftarConflictStart: "05:30",
  iftarConflictEnd: "06:30"
};

const toDateInput = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
};

const Rules = () => {
  const [activeRule, setActiveRule] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  const lastUpdatedBy = useMemo(() => {
    if (!activeRule?.updatedBy) {
      return "System";
    }

    return `${activeRule.updatedBy.name} (${activeRule.updatedBy.employeeCode})`;
  }, [activeRule]);

  const loadRule = async () => {
    setLoading(true);

    try {
      const response = await axiosInstance.get("/rules");
      const rule = response.data?.data || null;
      setActiveRule(rule);

      if (rule) {
        setForm({
          lateThresholdMinutes: String(rule.lateThresholdMinutes ?? 15),
          excessiveLateAfterMinutes: String(rule.excessiveLateAfterMinutes ?? 15),
          tiffinBreakMinutes: String(rule.tiffinBreakMinutes ?? 60),
          earlyExitFlagStartMinutes: String(rule.earlyExitFlagStartMinutes ?? 60),
          earlyExitFlagEndMinutes: String(rule.earlyExitFlagEndMinutes ?? 30),
          maxRosterDays: String(rule.maxRosterDays ?? 14),
          ramadanActive: Boolean(rule.ramadanActive),
          ramadanStartDate: toDateInput(rule.ramadanStartDate),
          ramadanEndDate: toDateInput(rule.ramadanEndDate),
          iftarTime: rule.iftarTime || "",
          sehriStart: rule.sehriStart || "04:00",
          sehriEnd: rule.sehriEnd || "05:00",
          iftarConflictStart: rule.iftarConflictStart || "05:30",
          iftarConflictEnd: rule.iftarConflictEnd || "06:30"
        });
      } else {
        setForm(defaultForm);
      }
    } catch (error) {
      setFeedback({
        type: "error",
        text: error.response?.data?.message || "Failed to load rule settings"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRule();
  }, []);

  const setField = (name, value) => {
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const numberValue = (field, fallback) => {
    const parsed = Number.parseInt(form[field], 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const saveRule = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = {
        lateThresholdMinutes: numberValue("lateThresholdMinutes", 15),
        excessiveLateAfterMinutes: numberValue("excessiveLateAfterMinutes", 15),
        tiffinBreakMinutes: numberValue("tiffinBreakMinutes", 60),
        earlyExitFlagStartMinutes: numberValue("earlyExitFlagStartMinutes", 60),
        earlyExitFlagEndMinutes: numberValue("earlyExitFlagEndMinutes", 30),
        maxRosterDays: numberValue("maxRosterDays", 14),
        ramadanActive: Boolean(form.ramadanActive),
        ramadanStartDate: form.ramadanActive && form.ramadanStartDate ? form.ramadanStartDate : null,
        ramadanEndDate: form.ramadanActive && form.ramadanEndDate ? form.ramadanEndDate : null,
        iftarTime: form.ramadanActive && form.iftarTime ? form.iftarTime : null,
        sehriStart: form.sehriStart,
        sehriEnd: form.sehriEnd,
        iftarConflictStart: form.iftarConflictStart,
        iftarConflictEnd: form.iftarConflictEnd
      };

      let response;
      if (activeRule?.id) {
        response = await axiosInstance.put(`/rules/${activeRule.id}`, payload);
      } else {
        response = await axiosInstance.post("/rules", payload);
      }

      setActiveRule(response.data?.data || null);
      setFeedback({ type: "success", text: "Rules saved successfully" });
      await loadRule();
    } catch (error) {
      setFeedback({
        type: "error",
        text: error.response?.data?.message || "Failed to save rule settings"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-600">Loading rules...</p>;
  }

  return (
    <section className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">HR Panel</p>
        <h2 className="text-2xl font-bold text-brand-900">Attendance Rule Configuration</h2>
        <p className="mt-1 text-sm text-slate-600">
          Last updated {activeRule?.updatedAt ? formatDate(activeRule.updatedAt) : "-"} by {lastUpdatedBy}
        </p>
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

      <form onSubmit={saveRule} className="space-y-4">
        <article className="rounded-xl border border-brand-100 bg-white p-4">
          <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-brand-700">Section 1 - Late Rules</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm text-slate-700">
              Late threshold (minutes)
              <input type="number" min="0" value={form.lateThresholdMinutes} onChange={(e) => setField("lateThresholdMinutes", e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <label className="grid gap-1 text-sm text-slate-700">
              Excessive late after (minutes)
              <input type="number" min="0" value={form.excessiveLateAfterMinutes} onChange={(e) => setField("excessiveLateAfterMinutes", e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" />
            </label>
          </div>
        </article>

        <article className="rounded-xl border border-brand-100 bg-white p-4">
          <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-brand-700">Section 2 - Break Rules</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm text-slate-700">
              Tiffin break duration (minutes)
              <input type="number" min="0" value={form.tiffinBreakMinutes} onChange={(e) => setField("tiffinBreakMinutes", e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" />
            </label>
          </div>
        </article>

        <article className="rounded-xl border border-brand-100 bg-white p-4">
          <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-brand-700">Section 3 - Early Exit</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm text-slate-700">
              Early exit flag start (minutes before shift end)
              <input type="number" min="0" value={form.earlyExitFlagStartMinutes} onChange={(e) => setField("earlyExitFlagStartMinutes", e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <label className="grid gap-1 text-sm text-slate-700">
              Early exit flag end (minutes before shift end)
              <input type="number" min="0" value={form.earlyExitFlagEndMinutes} onChange={(e) => setField("earlyExitFlagEndMinutes", e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" />
            </label>
          </div>
          <p className="mt-2 text-xs text-slate-500">Beyond 1 hour early is flagged and missed hours are recorded.</p>
        </article>

        <article className="rounded-xl border border-brand-100 bg-white p-4">
          <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-brand-700">Section 4 - Roster</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm text-slate-700">
              Max continuous days
              <input type="number" min="1" value={form.maxRosterDays} onChange={(e) => setField("maxRosterDays", e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" />
            </label>
          </div>
        </article>

        <article className="rounded-xl border border-brand-100 bg-white p-4">
          <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-brand-700">Section 5 - OT</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              Method: After 8 hours work + break
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              Security OT: Disabled
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-brand-100 bg-white p-4">
          <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-brand-700">Section 6 - Ramadan Settings</h3>
          <div className="mt-3 space-y-3">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={form.ramadanActive} onChange={(e) => setField("ramadanActive", e.target.checked)} />
              Ramadan Mode ON/OFF
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-sm text-slate-700">
                Ramadan start date
                <input type="date" value={form.ramadanStartDate} onChange={(e) => setField("ramadanStartDate", e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" disabled={!form.ramadanActive} />
              </label>
              <label className="grid gap-1 text-sm text-slate-700">
                Ramadan end date
                <input type="date" value={form.ramadanEndDate} onChange={(e) => setField("ramadanEndDate", e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" disabled={!form.ramadanActive} />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-sm text-slate-700">
                Iftar time
                <input type="time" value={form.iftarTime} onChange={(e) => setField("iftarTime", e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" disabled={!form.ramadanActive} />
              </label>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                Iftar conflict window: {form.iftarConflictStart} to {form.iftarConflictEnd}
                <p className="mt-1 text-xs text-slate-500">Display-only window used to flag attendance edge cases.</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-sm text-slate-700">
                Sehri break start
                <input type="time" value={form.sehriStart} onChange={(e) => setField("sehriStart", e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" />
              </label>
              <label className="grid gap-1 text-sm text-slate-700">
                Sehri break end
                <input type="time" value={form.sehriEnd} onChange={(e) => setField("sehriEnd", e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" />
              </label>
            </div>
          </div>
        </article>

        <button type="submit" disabled={saving} className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60">
          {saving ? "Saving..." : "Save"}
        </button>
      </form>
    </section>
  );
};

export default Rules;
