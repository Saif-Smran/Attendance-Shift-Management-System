import { useEffect, useState } from "react";

import axiosInstance from "../../api/axiosInstance";
import { formatDate } from "../../utils/formatDate";

const Leaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  const loadLeaves = async () => {
    setLoading(true);

    try {
      const response = await axiosInstance.get("/leaves", {
        params: {
          page: 1,
          limit: 20
        }
      });

      setLeaves(response.data?.data?.items || []);
      setFeedback({ type: "", text: "" });
    } catch (error) {
      setLeaves([]);
      setFeedback({
        type: "error",
        text: error.response?.data?.message || "Failed to load leave applications"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, []);

  const reviewLeave = async (leaveId, action) => {
    setActionLoadingId(`${leaveId}:${action}`);

    try {
      await axiosInstance.put(`/leaves/${leaveId}/${action}`);
      setFeedback({
        type: "success",
        text: `Leave application ${action === "approve" ? "approved" : "rejected"} successfully`
      });
      await loadLeaves();
    } catch (error) {
      setFeedback({
        type: "error",
        text: error.response?.data?.message || "Failed to update leave application"
      });
    } finally {
      setActionLoadingId("");
    }
  };

  return (
    <section className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">HR Panel</p>
        <h2 className="text-2xl font-bold text-brand-900">Leave Applications</h2>
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
          <table className="w-full min-w-190 text-sm">
            <thead className="bg-brand-50">
              <tr className="text-left text-xs uppercase tracking-[0.08em] text-brand-700">
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Date Range</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Loading leave applications...
                  </td>
                </tr>
              ) : leaves.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No leave applications found.
                  </td>
                </tr>
              ) : (
                leaves.map((leave) => (
                  <tr key={leave.id} className="border-b border-brand-50">
                    <td className="px-4 py-3 font-medium text-slate-700">{leave.employeeName || "Unknown"}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(leave.fromDate)} - {formatDate(leave.toDate)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{leave.reason}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full border border-slate-300 bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                        {leave.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {leave.status === "PENDING" ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => reviewLeave(leave.id, "approve")}
                            disabled={Boolean(actionLoadingId)}
                            className="rounded-md border border-emerald-300 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                          >
                            {actionLoadingId === `${leave.id}:approve` ? "..." : "Approve"}
                          </button>
                          <button
                            type="button"
                            onClick={() => reviewLeave(leave.id, "reject")}
                            disabled={Boolean(actionLoadingId)}
                            className="rounded-md border border-rose-300 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                          >
                            {actionLoadingId === `${leave.id}:reject` ? "..." : "Reject"}
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
    </section>
  );
};

export default Leaves;
