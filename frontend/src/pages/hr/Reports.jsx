import { useEffect, useMemo, useState } from "react";

import axiosInstance from "../../api/axiosInstance";
import Badge from "../../components/ui/Badge";
import Table from "../../components/ui/Table";
import { usePageTitle } from "../../hooks/usePageTitle";
import { formatDate } from "../../utils/formatDate";

const REPORT_TABS = [
  { key: "attendance", label: "Attendance Report", endpoint: "/reports/attendance" },
  { key: "ot", label: "OT Report", endpoint: "/reports/ot" },
  { key: "violations", label: "Violations Report", endpoint: "/reports/violations" },
  { key: "ramadan", label: "Ramadan Report", endpoint: "/reports/ramadan" },
  {
    key: "roster-compliance",
    label: "Roster Compliance",
    endpoint: "/reports/roster-compliance"
  }
];

const REPORT_COLUMNS = {
  attendance: [
    { key: "date", label: "Date", sortable: true, render: (row) => formatDate(row.date) },
    { key: "code", label: "Code", sortable: true },
    { key: "name", label: "Name", sortable: true },
    { key: "department", label: "Department", sortable: true },
    { key: "clockIn", label: "Clock In", render: (row) => formatTime(row.clockIn) },
    { key: "clockOut", label: "Clock Out", render: (row) => formatTime(row.clockOut) },
    { key: "status", label: "Status", sortable: true, render: (row) => <Badge value={row.status} /> },
    { key: "lateMinutes", label: "Late Min", sortable: true },
    { key: "otHours", label: "OT Hours", sortable: true, render: (row) => Number(row.otHours || 0).toFixed(2) },
    { key: "missedHours", label: "Missed H", sortable: true, render: (row) => Number(row.missedHours || 0).toFixed(2) }
  ],
  ot: [
    { key: "code", label: "Code", sortable: true },
    { key: "name", label: "Name", sortable: true },
    { key: "department", label: "Department", sortable: true },
    { key: "totalOTHours", label: "Total OT Hours", sortable: true, render: (row) => Number(row.totalOTHours || 0).toFixed(2) }
  ],
  violations: [
    { key: "date", label: "Date", sortable: true, render: (row) => formatDate(row.date) },
    { key: "code", label: "Code", sortable: true },
    { key: "name", label: "Name", sortable: true },
    { key: "department", label: "Department", sortable: true },
    {
      key: "violationType",
      label: "Violation",
      sortable: true,
      render: (row) => <Badge value={row.violationType} />
    },
    { key: "minutes", label: "Minutes", sortable: true },
    { key: "missedHours", label: "Missed H", sortable: true, render: (row) => Number(row.missedHours || 0).toFixed(2) }
  ],
  ramadan: [
    { key: "date", label: "Date", sortable: true, render: (row) => formatDate(row.date) },
    { key: "code", label: "Code", sortable: true },
    { key: "name", label: "Name", sortable: true },
    { key: "department", label: "Department", sortable: true },
    { key: "status", label: "Status", sortable: true, render: (row) => <Badge value={row.status} /> },
    {
      key: "sehriBreakApplied",
      label: "Sehri Break",
      sortable: true,
      render: (row) => (row.sehriBreakApplied ? "Yes" : "No")
    },
    {
      key: "iftarBreakApplied",
      label: "Iftar Break",
      sortable: true,
      render: (row) => (row.iftarBreakApplied ? "Yes" : "No")
    }
  ],
  "roster-compliance": [
    { key: "code", label: "Code", sortable: true },
    { key: "name", label: "Name", sortable: true },
    { key: "department", label: "Department", sortable: true },
    { key: "consecutiveDays", label: "Consecutive Days", sortable: true },
    { key: "status", label: "Status", sortable: true, render: (row) => <Badge value={row.status} /> }
  ]
};

const formatTime = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleTimeString("en-BD", { hour: "2-digit", minute: "2-digit" });
};

const getInitialFilters = () => {
  const today = new Date().toISOString().slice(0, 10);
  return {
    departmentId: "",
    employeeId: "",
    from: today,
    to: today,
    month: today.slice(0, 7)
  };
};

const toExportFileName = (tabKey) => {
  const map = {
    attendance: "AttendanceReport",
    ot: "OTReport",
    violations: "ViolationsReport",
    ramadan: "RamadanReport",
    "roster-compliance": "RosterComplianceReport"
  };

  return map[tabKey] || "Report";
};

const Reports = () => {
  usePageTitle("HR Reports");

  const [activeTab, setActiveTab] = useState("attendance");
  const [filters, setFilters] = useState(getInitialFilters());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [sortKey, setSortKey] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);

  const tabConfig = REPORT_TABS.find((tab) => tab.key === activeTab) || REPORT_TABS[0];

  const loadFiltersData = async () => {
    try {
      const [departmentResponse, employeeResponse] = await Promise.all([
        axiosInstance.get("/departments"),
        axiosInstance.get("/employees", {
          params: {
            page: 1,
            limit: 100
          }
        })
      ]);

      setDepartments(departmentResponse.data?.data?.items || []);
      setEmployees(employeeResponse.data?.data?.items || []);
    } catch {
      setDepartments([]);
      setEmployees([]);
    }
  };

  useEffect(() => {
    loadFiltersData();
  }, []);

  const buildQueryParams = () => {
    if (activeTab === "ot") {
      return {
        departmentId: filters.departmentId,
        month: filters.month
      };
    }

    if (activeTab === "roster-compliance") {
      return {};
    }

    const params = {
      departmentId: filters.departmentId,
      employeeId: filters.employeeId,
      from: filters.from,
      to: filters.to
    };

    if (activeTab === "ramadan") {
      delete params.departmentId;
      delete params.employeeId;
    }

    return params;
  };

  const loadReport = async () => {
    setLoading(true);

    try {
      const response = await axiosInstance.get(tabConfig.endpoint, {
        params: buildQueryParams()
      });

      setRows(response.data?.data || []);
      setFeedback("");
      setPage(1);
      const defaultSort = activeTab === "ot" ? "totalOTHours" : "date";
      setSortKey(defaultSort in (response.data?.data?.[0] || {}) ? defaultSort : "name");
      setSortOrder("desc");
    } catch (error) {
      setRows([]);
      setFeedback(error.response?.data?.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [activeTab]);

  const sortedRows = useMemo(() => {
    const sorted = [...rows];

    sorted.sort((left, right) => {
      const leftValue = left[sortKey];
      const rightValue = right[sortKey];

      if (sortKey.toLowerCase().includes("date")) {
        const leftDate = new Date(leftValue || 0).getTime();
        const rightDate = new Date(rightValue || 0).getTime();
        return sortOrder === "asc" ? leftDate - rightDate : rightDate - leftDate;
      }

      if (typeof leftValue === "number" || typeof rightValue === "number") {
        return sortOrder === "asc"
          ? Number(leftValue || 0) - Number(rightValue || 0)
          : Number(rightValue || 0) - Number(leftValue || 0);
      }

      const a = String(leftValue ?? "").toLowerCase();
      const b = String(rightValue ?? "").toLowerCase();

      if (a < b) {
        return sortOrder === "asc" ? -1 : 1;
      }

      if (a > b) {
        return sortOrder === "asc" ? 1 : -1;
      }

      return 0;
    });

    return sorted;
  }, [rows, sortKey, sortOrder]);

  const limit = 20;
  const total = sortedRows.length;
  const pages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(page, pages);
  const pagedRows = sortedRows.slice((currentPage - 1) * limit, currentPage * limit);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortOrder("asc");
  };

  const rowClassName = (row) => {
    const status = row.status || row.violationType;

    if (status === "ABSENT" || status === "REJECTED" || status === "EXCEEDED") {
      return "bg-rose-50/70";
    }

    if (status === "LATE" || status === "EXCESSIVE_LATE" || status === "WARNING") {
      return "bg-amber-50/70";
    }

    if (status === "PRESENT" || status === "APPROVED") {
      return "bg-emerald-50/60";
    }

    return "";
  };

  const exportReport = async (format) => {
    try {
      const params = buildQueryParams();
      const response = await axiosInstance.get(`/export/${format}`, {
        params: {
          type: activeTab,
          params: JSON.stringify(params)
        },
        responseType: "blob"
      });

      const blob = new Blob([response.data], {
        type:
          format === "excel"
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            : "application/pdf"
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const ext = format === "excel" ? "xlsx" : "pdf";
      link.download = `HaMeem_${toExportFileName(activeTab)}_${new Date().toISOString().slice(0, 7)}.${ext}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setFeedback(error.response?.data?.message || "Failed to export report");
    }
  };

  return (
    <section className="space-y-5">
      <header className="rounded-xl border border-blue-100 bg-white px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">HR Reports</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">Reporting Console</h2>
      </header>

      <div className="flex flex-wrap gap-2">
        {REPORT_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              activeTab === tab.key
                ? "bg-blue-700 text-white"
                : "border border-blue-200 bg-white text-blue-800 hover:bg-blue-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <article className="rounded-xl border border-blue-100 bg-white p-5">
        <div className="grid gap-3 md:grid-cols-4">
          <label className="grid gap-1 text-sm text-slate-700">
            Department
            <select
              value={filters.departmentId}
              onChange={(e) => setFilters((prev) => ({ ...prev, departmentId: e.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">All Departments</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm text-slate-700">
            Employee
            <select
              value={filters.employeeId}
              onChange={(e) => setFilters((prev) => ({ ...prev, employeeId: e.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2"
              disabled={activeTab === "ot" || activeTab === "ramadan" || activeTab === "roster-compliance"}
            >
              <option value="">All Employees</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.employeeCode} - {employee.name}
                </option>
              ))}
            </select>
          </label>

          {activeTab === "ot" ? (
            <label className="grid gap-1 text-sm text-slate-700">
              Month
              <input
                type="month"
                value={filters.month}
                onChange={(e) => setFilters((prev) => ({ ...prev, month: e.target.value }))}
                className="rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
          ) : (
            <>
              <label className="grid gap-1 text-sm text-slate-700">
                From
                <input
                  type="date"
                  value={filters.from}
                  onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))}
                  className="rounded-lg border border-slate-300 px-3 py-2"
                  disabled={activeTab === "roster-compliance"}
                />
              </label>
              <label className="grid gap-1 text-sm text-slate-700">
                To
                <input
                  type="date"
                  value={filters.to}
                  onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))}
                  className="rounded-lg border border-slate-300 px-3 py-2"
                  disabled={activeTab === "roster-compliance"}
                />
              </label>
            </>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadReport}
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
          >
            Apply Filters
          </button>
          <button
            type="button"
            onClick={() => exportReport("excel")}
            className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-100"
          >
            Export Excel
          </button>
          <button
            type="button"
            onClick={() => exportReport("pdf")}
            className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-100"
          >
            Export PDF
          </button>
        </div>
      </article>

      {feedback && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {feedback}
        </div>
      )}

      <Table
        columns={REPORT_COLUMNS[activeTab]}
        data={pagedRows}
        loading={loading}
        emptyMessage="No report data found"
        sortKey={sortKey}
        sortOrder={sortOrder}
        onSort={handleSort}
        page={currentPage}
        limit={limit}
        total={total}
        onPageChange={setPage}
        rowClassName={rowClassName}
      />
    </section>
  );
};

export default Reports;
