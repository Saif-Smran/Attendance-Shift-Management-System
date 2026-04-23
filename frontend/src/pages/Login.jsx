import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuthStore } from "../store/authStore";

const roleRoutes = {
  ADMIN: "/dashboard/admin",
  HR: "/dashboard/hr",
  EMPLOYEE: "/dashboard/employee",
  SECURITY: "/dashboard/employee"
};

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);

  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "EMPLOYEE"
  });

  const redirectPath = useMemo(() => {
    const fromState = location.state?.from?.pathname;
    return fromState || roleRoutes[form.role] || "/gate";
  }, [form.role, location.state]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    login({
      user: {
        name: form.email.split("@")[0] || "User",
        email: form.email,
        role: form.role
      },
      token: `demo-access-token-${Date.now()}`,
      refreshToken: `demo-refresh-token-${Date.now()}`
    });

    navigate(redirectPath, { replace: true });
  };

  return (
    <div className="page-shell">
      <div className="surface mx-auto max-w-xl p-6">
        <h1 className="text-2xl font-bold text-brand-900">Sign In</h1>
        <p className="mt-1 text-sm text-slate-600">
          This scaffold uses demo login state. Replace with backend auth integration next.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              required
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-brand-500"
              placeholder="you@hameem.com"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Password
            <input
              required
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-brand-500"
              placeholder="••••••••"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Role
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-brand-500"
            >
              <option value="ADMIN">ADMIN</option>
              <option value="HR">HR</option>
              <option value="EMPLOYEE">EMPLOYEE</option>
              <option value="SECURITY">SECURITY</option>
            </select>
          </label>

          <button
            type="submit"
            className="w-full rounded-lg bg-brand-700 px-4 py-2.5 font-semibold text-white transition hover:bg-brand-800"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
