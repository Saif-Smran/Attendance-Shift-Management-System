import { useEffect, useMemo, useState } from "react";

import axiosInstance from "../../api/axiosInstance";
import Badge from "../../components/ui/Badge";
import Table from "../../components/ui/Table";
import { usePageTitle } from "../../hooks/usePageTitle";
import { formatDate } from "../../utils/formatDate";

const MyLeaves = () => {
  usePageTitle("My Leaves");

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [sortKey, setSortKey] = useState("fromDate");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);

  const loadLeaves = async () => {
    setLoading(true);

    try {
      const first = await axiosInstance.get("/leaves/me", {
        params: {
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
            axiosInstance.get("/leaves/me", {
              params: {
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
      setFeedback(error.response?.data?.message || "Failed to load leave applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, []);

  const sortedItems = useMemo(() => {
    const sorted = [...items];

    sorted.sort((left, right) => {
      if (sortKey === "fromDate" || sortKey === "toDate" || sortKey === "reviewedAt") {
        const leftDate = new Date(left[sortKey] || 0).getTime();
        const rightDate = new Date(right[sortKey] || 0).getTime();
        return sortOrder === "asc" ? leftDate - rightDate : rightDate - leftDate;
      }

      const a = String(left[sortKey] ?? "").toLowerCase();
      const b = String(right[sortKey] ?? "").toLowerCase();

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
      key: "fromDate",
      label: "From",
      sortable: true,
      render: (row) => formatDate(row.fromDate)
    },
    {
      key: "toDate",
      label: "To",
      sortable: true,
      render: (row) => formatDate(row.toDate)
    },
    {
      key: "reason",
      label: "Reason"
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => <Badge value={row.status} />
    },
    {
      key: "reviewedAt",
      label: "Reviewed Date",
      sortable: true,
      render: (row) => formatDate(row.reviewedAt)
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

  return (
    <section className="space-y-5">
      <header className="rounded-xl border border-teal-100 bg-white px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-600">Employee Panel</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">My Leave Applications</h2>
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
        emptyMessage="No leave applications found"
        sortKey={sortKey}
        sortOrder={sortOrder}
        onSort={handleSort}
        page={currentPage}
        limit={limit}
        total={total}
        onPageChange={setPage}
      />
    </section>
  );
};

export default MyLeaves;
