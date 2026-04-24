const STATUS_CLASSNAME = {
  PENDING: "border-amber-300 bg-amber-100 text-amber-700",
  APPROVED: "border-emerald-300 bg-emerald-100 text-emerald-700",
  ACTIVE: "border-emerald-300 bg-emerald-100 text-emerald-700",
  REJECTED: "border-rose-300 bg-rose-100 text-rose-700",
  INACTIVE: "border-rose-300 bg-rose-100 text-rose-700",
  LATE: "border-orange-300 bg-orange-100 text-orange-700"
};

const Badge = ({ value, label, className = "" }) => {
  const text = String(label || value || "-")
    .trim()
    .toUpperCase();
  const palette = STATUS_CLASSNAME[text] || "border-slate-300 bg-slate-100 text-slate-700";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold tracking-[0.04em] ${palette} ${className}`}
    >
      {text}
    </span>
  );
};

export default Badge;
