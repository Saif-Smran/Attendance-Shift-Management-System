import { useEffect, useState } from "react";

import axiosInstance from "../api/axiosInstance";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    roleChoice: "WORKER",
    departmentId: ""
  });
  const [departments, setDepartments] = useState([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadDepartments = async () => {
      try {
        const response = await axiosInstance.get("/auth/departments");

        if (mounted) {
          setDepartments(response.data?.data || []);
        }
      } catch {
        if (mounted) {
          setDepartments([]);
        }
      } finally {
        if (mounted) {
          setIsLoadingDepartments(false);
        }
      }
    };

    loadDepartments();

    return () => {
      mounted = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const getRolePayload = () => {
    if (form.roleChoice === "SECURITY") {
      return {
        requestedRole: "SECURITY",
        requestedEmployeeCategory: null
      };
    }

    if (form.roleChoice === "STAFF") {
      return {
        requestedRole: "EMPLOYEE",
        requestedEmployeeCategory: "STAFF"
      };
    }

    return {
      requestedRole: "EMPLOYEE",
      requestedEmployeeCategory: "WORKER"
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (form.password !== form.confirmPassword) {
      setErrorMessage("Password and confirm password do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      const rolePayload = getRolePayload();

      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        departmentId: form.departmentId || null,
        requestedRole: rolePayload.requestedRole,
        requestedEmployeeCategory: rolePayload.requestedEmployeeCategory
      };

      const response = await axiosInstance.post("/auth/register", payload);

      setSuccessMessage(
        response.data?.data?.message ||
          "Your registration has been submitted and is under review. You will be able to log in once approved."
      );

      setForm((prev) => ({
        ...prev,
        password: "",
        confirmPassword: ""
      }));
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || error.message || "Registration failed"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="surface w-full max-w-2xl p-7 sm:p-8">
        <div className="text-center">
          <p className="text-xs font-bold tracking-[0.22em] text-brand-500">HA-MEEM GROUP</p>
          <h1 className="mt-2 text-2xl font-bold text-brand-900">Registration Request</h1>
          <p className="mt-2 text-sm text-slate-600">
            Submit your details for approval before first login.
          </p>
        </div>

        <form className="mt-7 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700 md:col-span-1">
            Full Name
            <input
              required
              name="name"
              value={form.name}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-brand-500"
              placeholder="Enter full name"
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
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-brand-500"
              placeholder="you@hameem.com"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700 md:col-span-1">
            Password
            <input
              required
              minLength={6}
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-brand-500"
              placeholder="Enter password"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700 md:col-span-1">
            Confirm Password
            <input
              required
              minLength={6}
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-brand-500"
              placeholder="Re-enter password"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700 md:col-span-1">
            Department
            <select
              name="departmentId"
              value={form.departmentId}
              onChange={handleChange}
              disabled={isLoadingDepartments}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-brand-500 disabled:bg-slate-100"
            >
              <option value="">
                {isLoadingDepartments ? "Loading departments..." : "Select department"}
              </option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700 md:col-span-1">
            Role
            <select
              name="roleChoice"
              value={form.roleChoice}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-brand-500"
            >
              <option value="WORKER">Worker</option>
              <option value="STAFF">Staff</option>
              <option value="SECURITY">Security</option>
            </select>
          </label>

          {errorMessage && (
            <div className="md:col-span-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="md:col-span-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-900">
              {successMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="md:col-span-2 rounded-lg bg-brand-700 px-4 py-2.5 font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-brand-400"
          >
            {isSubmitting ? "Submitting..." : "Submit Registration"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
