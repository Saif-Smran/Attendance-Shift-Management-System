const AdminHome = () => {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      <article className="rounded-xl border border-brand-100 bg-white p-5">
        <h2 className="text-lg font-semibold text-brand-900">System Snapshot</h2>
        <p className="mt-1 text-sm text-slate-600">Manage global attendance rules, shift policies, and approval governance.</p>
      </article>
      <article className="rounded-xl border border-brand-100 bg-white p-5">
        <h2 className="text-lg font-semibold text-brand-900">Quick Actions</h2>
        <p className="mt-1 text-sm text-slate-600">Configure departments, define shifts, and audit attendance anomalies.</p>
      </article>
    </section>
  );
};

export default AdminHome;
