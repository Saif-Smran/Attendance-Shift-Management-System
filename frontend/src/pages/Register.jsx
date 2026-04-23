import { useState } from "react";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    requestedRole: "EMPLOYEE",
    departmentId: ""
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="page-shell">
      <div className="surface mx-auto max-w-2xl p-6">
        <h1 className="text-2xl font-bold text-brand-900">Registration Request</h1>
        <p className="mt-1 text-sm text-slate-600">
          Submit your profile for approval. This page will later connect to Registration API endpoints.
        </p>

        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700 md:col-span-1">
            Full Name
            <input
              required
              name="name"
              value={form.name}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-brand-500"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700 md:col-span-1">
            Email
            <input
              required
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-brand-500"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700 md:col-span-1">
            Password
            <input
              required
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-brand-500"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700 md:col-span-1">
            Requested Role
            <select
              name="requestedRole"
              value={form.requestedRole}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-brand-500"
            >
              <option value="EMPLOYEE">EMPLOYEE</option>
              <option value="SECURITY">SECURITY</option>
              <option value="HR">HR</option>
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700 md:col-span-2">
            Department ID (optional)
            <input
              name="departmentId"
              value={form.departmentId}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-brand-500"
            />
          </label>

          <button
            type="submit"
            className="md:col-span-2 rounded-lg bg-brand-700 px-4 py-2.5 font-semibold text-white transition hover:bg-brand-800"
          >
            Submit Request
          </button>
        </form>

        {submitted && (
          <p className="mt-4 rounded-lg border border-brand-200 bg-brand-50 p-3 text-sm text-brand-900">
            Registration request captured in UI state. Connect this form to backend /registration endpoint next.
          </p>
        )}
      </div>
    </div>
  );
};

export default Register;
