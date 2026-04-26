import { useEffect, useMemo, useState } from "react";

import axiosInstance from "../../api/axiosInstance";
import Badge from "../../components/ui/Badge";
import Table from "../../components/ui/Table";
import { usePageTitle } from "../../hooks/usePageTitle";
import { formatTimeInZone, toDateKeyInZone } from "../../utils/dateTime";
import { formatDate } from "../../utils/formatDate";

const toMonthInput = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const getMonthRange = (monthValue) => {
  const [yearRaw, monthRaw] = String(monthValue || "").split("-");
  const year = Number.parseInt(yearRaw, 10);
  const month = Number.parseInt(monthRaw, 10);

  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));

  return {
    from: toDateKeyInZone(start),
    to: toDateKeyInZone(end)
  };
};

const formatTime = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return formatTimeInZone(date);
};

const MyAttendance = () => {
  usePageTitle("My Attendance");

  const [month, setMonth] = useState(toMonthInput(new Date()));
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [sortKey, setSortKey] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [feedback, setFeedback] = useState("");

  const loadAttendance = async () => {
    setLoading(true);

    try {
      const range = getMonthRange(month);
      const first = await axiosInstance.get("/attendance/me", {
        params: {
          from: range.from,
          to: range.to,
          page: 1,
          limit: 100
        }
      });

      const firstData = first.data?.data || { items: [], pagination: { pages: 1 } };
      let allItems = [...(firstData.items || [])];
      const pages = firstData.pagination?.pages || 1;

      if (pages > 1) {
        const requests = [];

        for (let currentPage = 2; currentPage <= pages; currentPage += 1) {
          requests.push(
            axiosInstance.get("/attendance/me", {
              params: {
                from: range.from,
                to: range.to,
                page: currentPage,
                limit: 100
              }
            })
          );
        }

        const responses = await Promise.all(requests);
        responses.forEach((response) => {
          allItems = allItems.concat(response.data?.data?.items || []);
        });
      }

      setItems(allItems);
      setFeedback("");
      setPage(1);
    } catch (error) {
      setItems([]);
      setFeedback(error.response?.data?.message || "Failed to load attendance records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [month]);

  const sortedItems = useMemo(() => {
    const sorted = [...items];

    sorted.sort((left, right) => {
      const leftValue = left[sortKey];
      const rightValue = right[sortKey];

      if (sortKey === "date") {
        const leftDate = new Date(leftValue || 0).getTime();
        const rightDate = new Date(rightValue || 0).getTime();

        return sortOrder === "asc" ? leftDate - rightDate : rightDate - leftDate;
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
  }, [items, sortKey, sortOrder]);

  const limit = 20;
  const total = sortedItems.length;
  const pages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(page, pages);
  const pagedItems = sortedItems.slice((currentPage - 1) * limit, currentPage * limit);

  const columns = [
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (row) => formatDate(row.date)
    },
    {
      key: "clockIn",
      label: "Clock In",
      render: (row) => formatTime(row.clockIn)
    },
    {
      key: "clockOut",
      label: "Clock Out",
      render: (row) => formatTime(row.clockOut)
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => <Badge value={row.status} />
    },
    {
      key: "lateMinutes",
      label: "Late Min",
      sortable: true
    },
    {
      key: "otHours",
      label: "OT Hours",
      sortable: true,
      render: (row) => Number(row.otHours || 0).toFixed(2)
    },
    {
      key: "flags",
      label: "Flags",
      render: (row) => (row.flagReasons?.length ? row.flagReasons.join(", ") : "-")
    }
  ];

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortOrder("asc");
  };

  const rowClassName = (row) => {
    if (row.status === "ABSENT" || row.flagged) {
      return "bg-rose-50/80";
    }

    if (row.status === "LATE" || row.status === "EXCESSIVE_LATE") {
      return "bg-amber-50/80";
    }

    return "bg-emerald-50/60";
  };

  return (
    <section className="space-y-5">
      <header className="rounded-xl border border-teal-100 bg-white px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-600">Employee Panel</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">My Attendance</h2>
        <div className="mt-3">
          <label className="grid max-w-55 gap-1 text-sm text-slate-700">
            Filter by month
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
        </div>
      </header>

      {feedback && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {feedback}
        </div>
      )}

      <Table
        columns={columns}
        data={pagedItems}
        loading={loading}
        emptyMessage="No attendance records for selected month"
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

export default MyAttendance;
