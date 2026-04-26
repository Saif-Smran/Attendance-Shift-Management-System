import { useEffect, useState } from "react";

import axiosInstance from "../../api/axiosInstance";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import Table from "../../components/ui/Table";
import { formatDate } from "../../utils/formatDate";

const STATUS_FILTERS = ["PENDING", "APPROVED", "REJECTED"];

const Registrations = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: "PENDING"
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });

  const [feedback, setFeedback] = useState({
    type: "",
    text: ""
  });

  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const loadRegistrations = async () => {
    setLoading(true);

    try {
      const params = {
        page: filters.page,
        limit: filters.limit,
        status: filters.status
      };

      const response = await axiosInstance.get("/registrations", { params });
      const payload = response.data?.data || {};

      setRegistrations(payload.items || []);
      setPagination(
        payload.pagination || {
          page: filters.page,
          limit: filters.limit,
          total: 0,
          pages: 1
        }
      );
    } catch (error) {
      setRegistrations([]);
      setPagination({
        page: filters.page,
        limit: filters.limit,
        total: 0,
        pages: 1
      });
      setFeedback({
        type: "error",
        text: error.response?.data?.message || "Failed to load registrations"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegistrations();
  }, [filters.page, filters.limit, filters.status]);

  const handleFilterStatusChange = (status) => {
    setFilters((prev) => ({
      ...prev,
      status,
      page: 1
    }));
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > pagination.pages) {
      return;
    }

    setFilters((prev) => ({
      ...prev,
      page: nextPage
    }));
  };

  const openApproveModal = (registration) => {
    setSelectedRegistration(registration);
    setApproveModalOpen(true);
  };

  const closeApproveModal = () => {
    setApproveModalOpen(false);
    setSelectedRegistration(null);
  };

  const openRejectModal = (registration) => {
    setSelectedRegistration(registration);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const closeRejectModal = () => {
    setRejectModalOpen(false);
    setSelectedRegistration(null);
    setRejectReason("");
  };

  const handleApprove = async () => {
    if (!selectedRegistration?.id) {
      return;
    }

    setActionLoading(true);

    try {
      const response = await axiosInstance.put(
        `/registrations/${selectedRegistration.id}/approve`
      );
      const employeeCode = response.data?.data?.employee?.employeeCode || "N/A";

      setFeedback({
        type: "success",
        text: `Registration approved. Generated Employee ID: ${employeeCode}`
      });
      closeApproveModal();
      await loadRegistrations();
    } catch (error) {
      setFeedback({
        type: "error",
        text: error.response?.data?.message || "Failed to approve registration"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRegistration?.id) {
      return;
    }

    if (!rejectReason.trim()) {
      setFeedback({
        type: "error",
        text: "Rejection reason is required"
      });
      return;
    }

    setActionLoading(true);

    try {
      await axiosInstance.put(`/registrations/${selectedRegistration.id}/reject`, {
        reason: rejectReason.trim()
      });

      setFeedback({
        type: "success",
        text: "Registration rejected successfully"
      });
      closeRejectModal();
      await loadRegistrations();
    } catch (error) {
      setFeedback({
        type: "error",
        text: error.response?.data?.message || "Failed to reject registration"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      key: "name",
      label: "Name"
    },
    {
      key: "email",
      label: "Email"
    },
    {
      key: "requestedRole",
      label: "Requested Role",
      render: (row) => (
        <div>
          <Badge value={row.requestedRole} />
          {row.requestedRole === "EMPLOYEE" && row.requestedEmployeeCategory && (
            <p className="mt-1 text-xs text-slate-500">{row.requestedEmployeeCategory}</p>
          )}
        </div>
      )
    },
    {
      key: "department",
      label: "Department",
      render: (row) => row.departmentName || "Not specified"
    },
    {
      key: "createdAt",
      label: "Date",
      render: (row) => formatDate(row.createdAt)
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <Badge value={row.status} />
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => {
        if (row.status !== "PENDING") {
          return <span className="text-xs text-slate-500">No actions</span>;
        }

        return (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => openApproveModal(row)}
              className="rounded-md border border-emerald-300 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => openRejectModal(row)}
              className="rounded-md border border-rose-300 px-2.5 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
            >
              Reject
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <section className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">HR Panel</p>
        <h2 className="text-2xl font-bold text-brand-900">Registration Review Queue</h2>
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
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => handleFilterStatusChange(status)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition ${
                filters.status === status
                  ? "bg-brand-700 text-white"
                  : "border border-brand-300 text-brand-700 hover:bg-brand-50"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </article>

      <Table
        columns={columns}
        data={registrations}
        loading={loading}
        emptyMessage="No registrations found"
        page={pagination.page}
        limit={pagination.limit}
        total={pagination.total}
        onPageChange={handlePageChange}
      />

      <Modal
        open={approveModalOpen}
        title="Approve Registration"
        onClose={closeApproveModal}
        onConfirm={handleApprove}
        confirmText="Approve"
        confirmDisabled={actionLoading}
        busy={actionLoading}
      >
        <p className="text-sm text-slate-700">
          Approve registration for {selectedRegistration?.name || "this applicant"}? This will create an active employee account.
        </p>
      </Modal>

      <Modal
        open={rejectModalOpen}
        title="Reject Registration"
        onClose={closeRejectModal}
        onConfirm={handleReject}
        confirmText="Reject"
        confirmVariant="danger"
        confirmDisabled={actionLoading}
        busy={actionLoading}
      >
        <div className="grid gap-2">
          <p className="text-sm text-slate-700">
            Provide a reason for rejecting {selectedRegistration?.name || "this registration"}.
          </p>
          <textarea
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            rows={4}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            placeholder="Write rejection reason"
          />
        </div>
      </Modal>
    </section>
  );
};

export default Registrations;
