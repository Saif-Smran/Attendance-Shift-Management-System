import { useEffect, useMemo, useState } from "react";

import axiosInstance from "../api/axiosInstance";

const Gate = () => {
  const [form, setForm] = useState({
    employeeCode: "",
    password: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [screenState, setScreenState] = useState({
    mode: "entry",
    message: "",
    employeeName: "",
    action: "",
    timestamp: null
  });

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  useEffect(() => {
    if (screenState.mode === "entry") {
      return undefined;
    }

    const delay = screenState.mode === "success" ? 5000 : 3000;

    const timerId = window.setTimeout(() => {
      setScreenState({
        mode: "entry",
        message: "",
        employeeName: "",
        action: "",
        timestamp: null
      });
      setForm({ employeeCode: "", password: "" });
    }, delay);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [screenState]);

  const timeText = useMemo(() => {
    return currentTime.toLocaleTimeString("en-BD", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });
  }, [currentTime]);

  const dateText = useMemo(() => {
    return currentTime.toLocaleDateString("en-BD", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }, [currentTime]);

  const formatTimestamp = (value) => {
    if (!value) {
      return "";
    }

    return new Date(value).toLocaleString("en-BD", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const showError = (message) => {
    setScreenState({
      mode: "error",
      message,
      employeeName: "",
      action: "",
      timestamp: null
    });
  };

  const showSuccess = ({ employeeName, action, timestamp }) => {
    setScreenState({
      mode: "success",
      message: "",
      employeeName,
      action,
      timestamp
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    const payload = {
      employeeCode: form.employeeCode.trim().toUpperCase(),
      password: form.password
    };

    try {
      const clockInResponse = await axiosInstance.post("/gate/clockin", payload);
      const clockInData = clockInResponse.data?.data || {};
      const clockInMessage = String(
        clockInData.message || clockInResponse.data?.message || ""
      ).toLowerCase();

      const shouldClockOut =
        Boolean(clockInData.alreadyClockedIn) ||
        clockInMessage.includes("already clocked in");

      if (shouldClockOut) {
        const clockOutResponse = await axiosInstance.post("/gate/clockout", payload);
        const clockOutData = clockOutResponse.data?.data || {};

        if (clockOutData.missingClockIn) {
          showError(clockOutData.message || "No clock-in found");
          return;
        }

        if (clockOutData.alreadyCompleted) {
          showError(clockOutData.message || "Already completed today");
          return;
        }

        showSuccess({
          employeeName: clockOutData.employeeName,
          action: clockOutData.action || "Clocked Out",
          timestamp: clockOutData.timestamp
        });

        return;
      }

      showSuccess({
        employeeName: clockInData.employeeName,
        action: clockInData.action || "Clocked In",
        timestamp: clockInData.timestamp
      });
    } catch (error) {
      showError(error.response?.data?.message || "Unable to process attendance");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (screenState.mode === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-emerald-700 px-4 text-white">
        <div className="text-center">
          <p className="text-xs font-semibold tracking-[0.26em]">HA-MEEM GROUP</p>
          <h1 className="mt-3 text-5xl font-bold">SUCCESS</h1>
          <p className="mt-4 text-2xl font-semibold">{screenState.action}</p>
          <p className="mt-2 text-xl">{screenState.employeeName}</p>
          <p className="mt-2 text-lg opacity-90">{formatTimestamp(screenState.timestamp)}</p>
        </div>
      </div>
    );
  }

  if (screenState.mode === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-rose-700 px-4 text-white">
        <div className="max-w-2xl text-center">
          <p className="text-xs font-semibold tracking-[0.26em]">HA-MEEM GROUP</p>
          <h1 className="mt-3 text-5xl font-bold">ERROR</h1>
          <p className="mt-4 text-2xl font-medium">{screenState.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-10">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold tracking-[0.28em] text-brand-300">HA-MEEM GROUP</p>
          <h1 className="mt-2 text-4xl font-bold text-brand-100 md:text-5xl">
            Attendance Gate Terminal
          </h1>
          <p className="mt-3 text-sm text-slate-400">Employee clock-in and clock-out kiosk</p>
        </div>

        <div className="mb-10 text-center">
          <p className="text-5xl font-bold text-white md:text-7xl">{timeText}</p>
          <p className="mt-3 text-lg text-slate-300 md:text-xl">{dateText}</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl backdrop-blur md:p-8"
        >
          <div className="grid gap-5">
            <label className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">
              Employee ID
              <input
                required
                autoComplete="off"
                autoFocus
                name="employeeCode"
                value={form.employeeCode}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-4 text-2xl text-white outline-none transition focus:border-brand-300"
                placeholder="AD-0001"
              />
            </label>

            <label className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">
              Password
              <input
                required
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-4 text-2xl text-white outline-none transition focus:border-brand-300"
                placeholder="Enter password"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 rounded-xl bg-brand-600 px-4 py-4 text-2xl font-bold text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-slate-600"
            >
              {isSubmitting ? "Processing..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Gate;
