import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import axiosInstance from "../api/axiosInstance";
import { useAuthStore } from "../store/authStore";

const roleRoutes = {
  ADMIN: "/dashboard/admin",
  HR: "/dashboard/hr",
  EMPLOYEE: "/dashboard/employee",
  SECURITY: "/dashboard/employee"
};

const Login = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [form, setForm] = useState({
    identifier: "",
    password: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await axiosInstance.post("/auth/login", {
        identifier: form.identifier,
        password: form.password
      });

      const data = response.data?.data || {};
      const user = data.user;
      const token = data.accessToken;
      const refreshToken = data.refreshToken;

      if (!user || !token) {
        throw new Error("Invalid login response from server");
      }

      login({
        user,
        token,
        refreshToken: refreshToken || null
      });

      navigate(roleRoutes[user.role] || "/dashboard/employee", { replace: true });
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || error.message || "Unable to sign in"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="surface w-full max-w-md p-7 sm:p-8">
        <div className="text-center">
          <p className="text-xs font-bold tracking-[0.22em] text-brand-500">HA-MEEM GROUP</p>
          <h1 className="mt-2 text-2xl font-bold text-brand-900">Attendance & Shift Management</h1>
          <p className="mt-2 text-sm text-slate-600">Sign in with your email or employee ID.</p>
        </div>

        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700">
            Email / Employee ID
            <input
              required
              name="identifier"
              value={form.identifier}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-brand-500"
              placeholder="you@hameem.com or AD-0001"
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
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-brand-500"
              placeholder="Enter password"
            />
          </label>

          {errorMessage && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-brand-700 px-4 py-2.5 font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-brand-400"
          >
            {isSubmitting ? "Signing in..." : "Login"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-600">
          Need approval first?{" "}
          <Link to="/register" className="font-semibold text-brand-700 hover:text-brand-900">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
