const getSortLabel = (sortOrder) => {
  if (sortOrder === "asc") {
    return "▲";
  }

  if (sortOrder === "desc") {
    return "▼";
  }

  return "↕";
};

const Table = ({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = "No data found",
  sortKey,
  sortOrder,
  onSort,
  page = 1,
  limit = 10,
  total = 0,
  onPageChange
}) => {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(limit, 1)));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const startItem = total === 0 ? 0 : (safePage - 1) * limit + 1;
  const endItem = total === 0 ? 0 : Math.min(safePage * limit, total);

  const renderCellContent = (column, row, rowIndex) => {
    if (typeof column.render === "function") {
      return column.render(row, rowIndex);
    }

    return row[column.key] ?? "-";
  };

  return (
    <div className="overflow-hidden rounded-xl border border-brand-100 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead className="bg-brand-50">
            <tr>
              {columns.map((column) => {
                const isActiveSort = sortKey === column.key;

                return (
                  <th
                    key={column.key}
                    className="border-b border-brand-100 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-brand-700"
                  >
                    {column.sortable ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 text-left text-xs font-semibold uppercase tracking-[0.08em] text-brand-700"
                        onClick={() => onSort?.(column.key)}
                      >
                        <span>{column.label}</span>
                        <span className="text-[10px] text-brand-600">
                          {isActiveSort ? getSortLabel(sortOrder) : "↕"}
                        </span>
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-sm text-slate-500"
                >
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-sm text-slate-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr key={row.id || `${rowIndex}-${row.employeeCode || "row"}`} className="border-b border-brand-50 hover:bg-brand-50/50">
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 align-top text-slate-700">
                      {renderCellContent(column, row, rowIndex)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-brand-100 px-4 py-3 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
        <p>
          Showing {startItem}-{endItem} of {total}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange?.(safePage - 1)}
            disabled={safePage <= 1 || loading}
            className="rounded-lg border border-brand-300 px-3 py-1.5 text-xs font-medium text-brand-700 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Previous
          </button>
          <span className="min-w-20 text-center text-xs font-semibold text-brand-700">
            Page {safePage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange?.(safePage + 1)}
            disabled={safePage >= totalPages || loading}
            className="rounded-lg border border-brand-300 px-3 py-1.5 text-xs font-medium text-brand-700 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default Table;
