import { useEffect, useMemo, useState } from "react";

import axiosInstance from "../../api/axiosInstance";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import StatCard from "../../components/ui/StatCard";
import Table from "../../components/ui/Table";

const ROLE_OPTIONS = ["ADMIN", "HR", "EMPLOYEE", "SECURITY"];
const STATUS_OPTIONS = ["ACTIVE", "INACTIVE"];

const initialCreateForm = {
  name: "",
  email: "",
  role: "EMPLOYEE",
  employeeCategory: "WORKER",
  departmentId: ""
};

const initialEditForm = {
  id: "",
  name: "",
  email: "",
  employeeCategory: "WORKER",
  departmentId: ""
};

const initialRoleForm = {
  id: "",
  role: "EMPLOYEE",
  employeeCategory: "WORKER"
};

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [departments, setDepartments] = useState([]);

  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: "",
    department: "",
    role: "",
    status: ""
  });
  const [sortState, setSortState] = useState({
    key: "createdAt",
    order: "desc"
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

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);

  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [editForm, setEditForm] = useState(initialEditForm);
  const [roleForm, setRoleForm] = useState(initialRoleForm);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const loadDepartments = async () => {
    try {
      const response = await axiosInstance.get("/auth/departments");
      setDepartments(response.data?.data || []);
    } catch {
      setDepartments([]);
    }
  };

  const loadEmployees = async () => {
    setLoading(true);

    try {
      const params = {
        page: filters.page,
        limit: filters.limit,
        sortBy: sortState.key,
        sortOrder: sortState.order
      };

      if (filters.search.trim()) {
        params.search = filters.search.trim();
      }

      if (filters.department) {
        params.department = filters.department;
      }

      if (filters.role) {
        params.role = filters.role;
      }

      if (filters.status) {
        params.status = filters.status;
      }

      const response = await axiosInstance.get("/employees", { params });
      const payload = response.data?.data || {};

      setEmployees(payload.items || []);
      setPagination(
        payload.pagination || {
          page: filters.page,
          limit: filters.limit,
          total: 0,
          pages: 1
        }
      );
    } catch (error) {
      setEmployees([]);
      setPagination({
        page: filters.page,
        limit: filters.limit,
        total: 0,
        pages: 1
      });
      setFeedback({
        type: "error",
        text: error.response?.data?.message || "Failed to load employees"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [filters.page, filters.limit, filters.search, filters.department, filters.role, filters.status, sortState.key, sortState.order]);

  const activeCount = useMemo(
    () => employees.filter((employee) => employee.status === "ACTIVE").length,
    [employees]
  );

  const inactiveCount = useMemo(
    () => employees.filter((employee) => employee.status === "INACTIVE").length,
    [employees]
  );

  const resetFeedback = () => {
    setFeedback({ type: "", text: "" });
  };

  const handleSort = (key) => {
    setSortState((prev) => {
      if (prev.key === key) {
        return {
          key,
          order: prev.order === "asc" ? "desc" : "asc"
        };
      }

      return {
        key,
        order: "asc"
      };
    });
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > pagination.pages) {
      return;
    }

    setFilters((prev) => ({ ...prev, page: nextPage }));
  };

  const handleFilterInputChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 1
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      search: "",
      department: "",
      role: "",
      status: ""
    });
    setSortState({
      key: "createdAt",
      order: "desc"
    });
  };

  const openCreateModal = () => {
    setCreateForm(initialCreateForm);
    resetFeedback();
    setCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setCreateModalOpen(false);
    setCreateForm(initialCreateForm);
  };

  const openEditModal = (employee) => {
    setSelectedEmployee(employee);
    setEditForm({
      id: employee.id,
      name: employee.name || "",
      email: employee.email || "",
      employeeCategory: employee.employeeCategory || "WORKER",
      departmentId: employee.departmentId || ""
    });
    resetFeedback();
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditForm(initialEditForm);
  };

  const openDeleteModal = (employee) => {
    setSelectedEmployee(employee);
    resetFeedback();
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setSelectedEmployee(null);
  };

  const openRoleModal = (employee) => {
    setSelectedEmployee(employee);
    setRoleForm({
      id: employee.id,
      role: employee.role || "EMPLOYEE",
      employeeCategory: employee.employeeCategory || "WORKER"
    });
    resetFeedback();
    setRoleModalOpen(true);
  };

  const closeRoleModal = () => {
    setRoleModalOpen(false);
    setRoleForm(initialRoleForm);
  };

  const handleCreateFormChange = (event) => {
    const { name, value } = event.target;

    if (name === "role") {
      setCreateForm((prev) => ({
        ...prev,
        role: value,
        employeeCategory: value === "EMPLOYEE" ? prev.employeeCategory || "WORKER" : ""
      }));
      return;
    }

    setCreateForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditFormChange = (event) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRoleFormChange = (event) => {
    const { name, value } = event.target;

    if (name === "role") {
      setRoleForm((prev) => ({
        ...prev,
        role: value,
        employeeCategory: value === "EMPLOYEE" ? prev.employeeCategory || "WORKER" : ""
      }));
      return;
    }

    setRoleForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateEmployee = async () => {
    const payload = {
      name: createForm.name.trim(),
      email: createForm.email.trim().toLowerCase(),
      role: createForm.role,
      employeeCategory:
        createForm.role === "EMPLOYEE" ? createForm.employeeCategory : null,
      departmentId: createForm.departmentId || null
    };

    if (!payload.name || !payload.email || !payload.role) {
      setFeedback({
        type: "error",
        text: "Name, email, and role are required"
      });
      return;
    }

    setActionLoading(true);

    try {
      const response = await axiosInstance.post("/employees", payload);
      const created = response.data?.data?.employee;
      const temporaryPassword = response.data?.data?.temporaryPassword;

      setFeedback({
        type: "success",
        text: `Employee ${created?.employeeCode || ""} created. Temporary password: ${temporaryPassword || "N/A"}`
      });

      closeCreateModal();
      await loadEmployees();
    } catch (error) {
      setFeedback({
        type: "error",
        text: error.response?.data?.message || "Failed to create employee"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateEmployee = async () => {
    const payload = {
      name: editForm.name.trim(),
      email: editForm.email.trim().toLowerCase(),
      departmentId: editForm.departmentId || null,
      employeeCategory:
        selectedEmployee?.role === "EMPLOYEE" ? editForm.employeeCategory : undefined
    };

    setActionLoading(true);

    try {
      await axiosInstance.put(`/employees/${editForm.id}`, payload);
      setFeedback({
        type: "success",
        text: "Employee updated successfully"
      });
      closeEditModal();
      await loadEmployees();
    } catch (error) {
      setFeedback({
        type: "error",
        text: error.response?.data?.message || "Failed to update employee"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee?.id) {
      return;
    }

    setActionLoading(true);

    try {
      await axiosInstance.delete(`/employees/${selectedEmployee.id}`);
      setFeedback({
        type: "success",
        text: "Employee deactivated successfully"
      });
      closeDeleteModal();
      await loadEmployees();
    } catch (error) {
      setFeedback({
        type: "error",
        text: error.response?.data?.message || "Failed to deactivate employee"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeRole = async () => {
    if (!roleForm.id) {
      return;
    }

    setActionLoading(true);

    try {
      await axiosInstance.put(`/employees/${roleForm.id}/role`, {
        role: roleForm.role,
        employeeCategory: roleForm.role === "EMPLOYEE" ? roleForm.employeeCategory : null
      });
      setFeedback({
        type: "success",
        text: "Employee role updated successfully"
      });
      closeRoleModal();
      await loadEmployees();
    } catch (error) {
      setFeedback({
        type: "error",
        text: error.response?.data?.message || "Failed to change role"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (employee) => {
    const nextStatus = employee.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    setActionLoading(true);

    try {
      await axiosInstance.put(`/employees/${employee.id}/status`, {
        status: nextStatus
      });
      setFeedback({
        type: "success",
        text: `Employee status changed to ${nextStatus}`
      });
      await loadEmployees();
    } catch (error) {
      setFeedback({
        type: "error",
        text: error.response?.data?.message || "Failed to update employee status"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      key: "employeeCode",
      label: "Employee Code",
      sortable: true
    },
    {
      key: "name",
      label: "Name",
      sortable: true
    },
    {
      key: "department",
      label: "Department",
      render: (row) => row.departmentName || "-"
    },
    {
      key: "role",
      label: "Role",
      render: (row) => <Badge value={row.role} />
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <Badge value={row.status} />
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openEditModal(row)}
            className="rounded-md border border-brand-300 px-2.5 py-1 text-xs font-semibold text-brand-700 transition hover:bg-brand-50"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => openRoleModal(row)}
            className="rounded-md border border-brand-300 px-2.5 py-1 text-xs font-semibold text-brand-700 transition hover:bg-brand-50"
          >
            Change Role
          </button>
          <button
            type="button"
            onClick={() => handleToggleStatus(row)}
            className="rounded-md border border-accent-500 px-2.5 py-1 text-xs font-semibold text-accent-600 transition hover:bg-amber-50"
          >
            {row.status === "ACTIVE" ? "Deactivate" : "Activate"}
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">Admin Panel</p>
          <h2 className="text-2xl font-bold text-brand-900">Employee Management</h2>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
        >
          Add Employee
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total Employees" value={pagination.total} hint="All matching filters" />
        <StatCard label="Active on Page" value={activeCount} />
        <StatCard label="Inactive on Page" value={inactiveCount} />
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
        <div className="grid gap-3 md:grid-cols-5">
          <label className="text-sm font-medium text-slate-700 md:col-span-2">
            Search by name/code
            <input
              name="search"
              value={filters.search}
              onChange={handleFilterInputChange}
              placeholder="Type employee name or code"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-brand-500"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Department
            <select
              name="department"
              value={filters.department}
              onChange={handleFilterInputChange}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-brand-500"
            >
              <option value="">All departments</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Role
            <select
              name="role"
              value={filters.role}
              onChange={handleFilterInputChange}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-brand-500"
            >
              <option value="">All roles</option>
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Status
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterInputChange}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-brand-500"
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={handleClearFilters}
            className="rounded-lg border border-brand-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-brand-700 transition hover:bg-brand-50"
          >
            Clear Filters
          </button>
        </div>
      </article>

      <Table
        columns={columns}
        data={employees}
        loading={loading}
        emptyMessage="No employees found"
        sortKey={sortState.key}
        sortOrder={sortState.order}
        onSort={handleSort}
        page={pagination.page}
        limit={pagination.limit}
        total={pagination.total}
        onPageChange={handlePageChange}
      />

      <Modal
        open={createModalOpen}
        title="Add Employee"
        onClose={closeCreateModal}
        onConfirm={handleCreateEmployee}
        confirmText="Create Employee"
        confirmDisabled={actionLoading}
        busy={actionLoading}
      >
        <div className="grid gap-3">
          <label className="text-sm font-medium text-slate-700">
            Full Name
            <input
              name="name"
              value={createForm.name}
              onChange={handleCreateFormChange}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-brand-500"
              placeholder="Enter employee name"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              name="email"
              value={createForm.email}
              onChange={handleCreateFormChange}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-brand-500"
              placeholder="employee@hameem.com"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Role
            <select
              name="role"
              value={createForm.role}
              onChange={handleCreateFormChange}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-brand-500"
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>

          {createForm.role === "EMPLOYEE" && (
            <label className="text-sm font-medium text-slate-700">
              Employee Category
              <select
                name="employeeCategory"
                value={createForm.employeeCategory}
                onChange={handleCreateFormChange}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-brand-500"
              >
                <option value="WORKER">WORKER</option>
                <option value="STAFF">STAFF</option>
              </select>
            </label>
          )}

          <label className="text-sm font-medium text-slate-700">
            Department
            <select
              name="departmentId"
              value={createForm.departmentId}
              onChange={handleCreateFormChange}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-brand-500"
            >
              <option value="">No department</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Modal>

      <Modal
        open={editModalOpen}
        title="Edit Employee"
        onClose={closeEditModal}
        onConfirm={handleUpdateEmployee}
        confirmText="Save Changes"
        confirmDisabled={actionLoading}
        busy={actionLoading}
      >
        <div className="grid gap-3">
          <label className="text-sm font-medium text-slate-700">
            Full Name
            <input
              name="name"
              value={editForm.name}
              onChange={handleEditFormChange}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-brand-500"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              name="email"
              value={editForm.email}
              onChange={handleEditFormChange}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-brand-500"
            />
          </label>

          {selectedEmployee?.role === "EMPLOYEE" && (
            <label className="text-sm font-medium text-slate-700">
              Employee Category
              <select
                name="employeeCategory"
                value={editForm.employeeCategory}
                onChange={handleEditFormChange}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-brand-500"
              >
                <option value="WORKER">WORKER</option>
                <option value="STAFF">STAFF</option>
              </select>
            </label>
          )}

          <label className="text-sm font-medium text-slate-700">
            Department
            <select
              name="departmentId"
              value={editForm.departmentId}
              onChange={handleEditFormChange}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-brand-500"
            >
              <option value="">No department</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Modal>

      <Modal
        open={roleModalOpen}
        title={`Change Role${selectedEmployee?.name ? `: ${selectedEmployee.name}` : ""}`}
        onClose={closeRoleModal}
        onConfirm={handleChangeRole}
        confirmText="Update Role"
        confirmDisabled={actionLoading}
        busy={actionLoading}
      >
        <div className="grid gap-3">
          <label className="text-sm font-medium text-slate-700">
            New Role
            <select
              name="role"
              value={roleForm.role}
              onChange={handleRoleFormChange}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-brand-500"
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>

          {roleForm.role === "EMPLOYEE" && (
            <label className="text-sm font-medium text-slate-700">
              Employee Category
              <select
                name="employeeCategory"
                value={roleForm.employeeCategory}
                onChange={handleRoleFormChange}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-brand-500"
              >
                <option value="WORKER">WORKER</option>
                <option value="STAFF">STAFF</option>
              </select>
            </label>
          )}
        </div>
      </Modal>

      <Modal
        open={deleteModalOpen}
        title="Deactivate Employee"
        onClose={closeDeleteModal}
        onConfirm={handleDeleteEmployee}
        confirmText="Deactivate"
        confirmVariant="danger"
        confirmDisabled={actionLoading}
        busy={actionLoading}
      >
        <p className="text-sm text-slate-700">
          This will set employee status to INACTIVE. Continue for {selectedEmployee?.name || "this employee"}?
        </p>
      </Modal>
    </section>
  );
};

export default Employees;
