const EmployeeHome = () => {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      <article className="rounded-xl border border-brand-100 bg-white p-5">
        <h2 className="text-lg font-semibold text-brand-900">Today</h2>
        <p className="mt-1 text-sm text-slate-600">Clock in/out, review shift timings, and monitor late or early-exit flags.</p>
      </article>
      <article className="rounded-xl border border-brand-100 bg-white p-5">
        <h2 className="text-lg font-semibold text-brand-900">Leave & History</h2>
        <p className="mt-1 text-sm text-slate-600">Track attendance records, leave status, and overtime eligibility.</p>
      </article>
    </section>
  );
};

export default EmployeeHome;
