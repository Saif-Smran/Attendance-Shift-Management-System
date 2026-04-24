const StatCard = ({ label, value, icon = null, hint = null }) => {
  return (
    <article className="rounded-xl border border-brand-100 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">{label}</p>
          <p className="mt-2 text-3xl font-bold text-brand-900">{value}</p>
          {hint && <p className="mt-1 text-sm text-slate-600">{hint}</p>}
        </div>
        {icon && <div className="text-brand-700">{icon}</div>}
      </div>
    </article>
  );
};

export default StatCard;
