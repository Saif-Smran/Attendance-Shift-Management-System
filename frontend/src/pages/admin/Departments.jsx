import { useEffect, useMemo, useState } from "react";

import axiosInstance from "../../api/axiosInstance";
import Modal from "../../components/ui/Modal";
import Table from "../../components/ui/Table";
import { formatDate } from "../../utils/formatDate";

const initialForm = {
  id: "",
  name: ""
};

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [form, setForm] = useState(initialForm);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  const loadDepartments = async () => {
    setLoading(true);

    try {
      const response = await axiosInstance.get("/departments");
      setDepartments(response.data?.data?.items || []);
      setFeedback({ type: "", text: "" });
    } catch (error) {
      setDepartments([]);
      setFeedback({
        type: "error",
        text: error.response?.data?.message || "Failed to load departments"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const totalEmployees = useMemo(
    () => departments.reduce((sum, department) => sum + (department.employeeCount || 0), 0),
    [departments]
  );

  const openAddModal = () => {
    setForm(initialForm);
    setAddModalOpen(true);
  };

  const openEditModal = (department) => {
    setSelectedDepartment(department);
    setForm({
      id: department.id,
      name: department.name
    });
    setEditModalOpen(true);
  };

  const openDeleteModal = (department) => {
    setSelectedDepartment(department);
    setDeleteModalOpen(true);
  };

  const closeModals = () => {
    setAddModalOpen(false);
    setEditModalOpen(false);
    setDeleteModalOpen(false);
    setSelectedDepartment(null);
    setForm(initialForm);
  };

  const createDepartment = async () => {
    const name = form.name.trim();

    if (!name) {
      setFeedback({ type: "error", text: "Department name is required" });
      return;
    }

    setActionLoading(true);

    try {
      await axiosInstance.post("/departments", { name });
      setFeedback({ type: "success", text: "Department added successfully" });
      closeModals();
      await loadDepartments();
    } catch (error) {
      setFeedback({
        type: "error",
        text: error.response?.data?.message || "Failed to create department"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const updateDepartment = async () => {
    const name = form.name.trim();

    if (!name) {
      setFeedback({ type: "error", text: "Department name is required" });
      return;
    }

    setActionLoading(true);

    try {
      await axiosInstance.put(`/departments/${form.id}`, { name });
      setFeedback({ type: "success", text: "Department updated successfully" });
      closeModals();
      await loadDepartments();
    } catch (error) {
      setFeedback({
        type: "error",
        text: error.response?.data?.message || "Failed to update department"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const deleteDepartment = async () => {
    if (!selectedDepartment?.id) {
      return;
    }

    setActionLoading(true);

    try {
      await axiosInstance.delete(`/departments/${selectedDepartment.id}`);
      setFeedback({ type: "success", text: "Department deleted successfully" });
      closeModals();
      await loadDepartments();
    } catch (error) {
      setFeedback({
        type: "error",
        text:
          error.response?.data?.message ||
          "Failed to delete department. Check if employees are assigned."
      });
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      key: "name",
      label: "Department"
    },
    {
      key: "employeeCount",
      label: "Employees",
      render: (row) => row.employeeCount || 0
    },
    {
      key: "createdAt",
      label: "Created",
      render: (row) => formatDate(row.createdAt)
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => openEditModal(row)}
            className="rounded-md border border-brand-300 px-2.5 py-1 text-xs font-semibold text-brand-700 transition hover:bg-brand-50"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => openDeleteModal(row)}
            className="rounded-md border border-rose-300 px-2.5 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
          >
            Delete
          </button>
        </div>
      )
    }
  ];

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">Admin Panel</p>
          <h2 className="text-2xl font-bold text-brand-900">Department Management</h2>
          <p className="mt-1 text-sm text-slate-600">
            Total departments: {departments.length} | Employees mapped: {totalEmployees}
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800"
        >
          Add Department
        </button>
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

      <Table
        columns={columns}
        data={departments}
        loading={loading}
        emptyMessage="No departments found"
        page={1}
        limit={departments.length || 1}
        total={departments.length}
      />

      <Modal
        open={addModalOpen}
        title="Add Department"
        onClose={closeModals}
        onConfirm={createDepartment}
        confirmText="Add"
        confirmDisabled={actionLoading}
        busy={actionLoading}
      >
        <div className="grid gap-2">
          <label htmlFor="add-department-name" className="text-sm font-medium text-slate-700">
            Department Name
          </label>
          <input
            id="add-department-name"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
            placeholder="e.g. Cutting"
          />
        </div>
      </Modal>

      <Modal
        open={editModalOpen}
        title="Edit Department"
        onClose={closeModals}
        onConfirm={updateDepartment}
        confirmText="Update"
        confirmDisabled={actionLoading}
        busy={actionLoading}
      >
        <div className="grid gap-2">
          <label htmlFor="edit-department-name" className="text-sm font-medium text-slate-700">
            Department Name
          </label>
          <input
            id="edit-department-name"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </div>
      </Modal>

      <Modal
        open={deleteModalOpen}
        title="Delete Department"
        onClose={closeModals}
        onConfirm={deleteDepartment}
        confirmText="Delete"
        confirmVariant="danger"
        confirmDisabled={actionLoading}
        busy={actionLoading}
      >
        <div className="space-y-3 text-sm text-slate-700">
          <p>
            Delete department <strong>{selectedDepartment?.name || ""}</strong>?
          </p>
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
            Deletion is blocked when employees are assigned. Reassign employees first if this action fails.
          </p>
        </div>
      </Modal>
    </section>
  );
};

export default Departments;
