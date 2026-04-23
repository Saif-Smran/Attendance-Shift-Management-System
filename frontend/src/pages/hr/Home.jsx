const HRHome = () => {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      <article className="rounded-xl border border-brand-100 bg-white p-5">
        <h2 className="text-lg font-semibold text-brand-900">People Queue</h2>
        <p className="mt-1 text-sm text-slate-600">Review registration requests and process leave applications.</p>
      </article>
      <article className="rounded-xl border border-brand-100 bg-white p-5">
        <h2 className="text-lg font-semibold text-brand-900">Roster Planner</h2>
        <p className="mt-1 text-sm text-slate-600">Publish 14-day rosters with Ramadan-aware scheduling support.</p>
      </article>
    </section>
  );
};

export default HRHome;
