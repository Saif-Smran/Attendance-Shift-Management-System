import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import AdminLayout from "./layouts/AdminLayout";
import EmployeeLayout from "./layouts/EmployeeLayout";
import HRLayout from "./layouts/HRLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminDepartments from "./pages/admin/Departments";
import AdminEmployees from "./pages/admin/Employees";
import AdminReports from "./pages/admin/Reports";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import MyAttendance from "./pages/employee/MyAttendance";
import MyLeaves from "./pages/employee/MyLeaves";
import MyShift from "./pages/employee/MyShift";
import HRDashboard from "./pages/hr/HRDashboard";
import HRLeaves from "./pages/hr/Leaves";
import HRReports from "./pages/hr/Reports";
import HRRoster from "./pages/hr/Roster";
import HRRegistrations from "./pages/hr/Registrations";
import HRRules from "./pages/hr/Rules";
import HRShifts from "./pages/hr/Shifts";
import Gate from "./pages/Gate";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./routes/ProtectedRoute";
import { useAuthStore } from "./store/authStore";

const UNAUTHORIZED_EVENT = "hm:unauthorized";

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleUnauthorized = () => {
      useAuthStore.getState().logout();

      if (location.pathname !== "/login") {
        navigate("/login", { replace: true });
      }
    };

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);

    return () => {
      window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    };
  }, [location.pathname, navigate]);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/gate" replace />} />
      <Route path="/gate" element={<Gate />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
        <Route path="/dashboard/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="employees" element={<AdminEmployees />} />
          <Route path="departments" element={<AdminDepartments />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="*" element={<Navigate to="/dashboard/admin" replace />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["HR"]} />}>
        <Route path="/dashboard/hr" element={<HRLayout />}>
          <Route index element={<HRDashboard />} />
          <Route path="registrations" element={<HRRegistrations />} />
          <Route path="leaves" element={<HRLeaves />} />
          <Route path="shifts" element={<HRShifts />} />
          <Route path="rules" element={<HRRules />} />
          <Route path="roster" element={<HRRoster />} />
          <Route path="reports" element={<HRReports />} />
          <Route path="*" element={<Navigate to="/dashboard/hr" replace />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["EMPLOYEE", "SECURITY"]} />}>
        <Route path="/dashboard/employee" element={<EmployeeLayout />}>
          <Route index element={<EmployeeDashboard />} />
          <Route path="my-attendance" element={<MyAttendance />} />
          <Route path="my-leaves" element={<MyLeaves />} />
          <Route path="my-shift" element={<MyShift />} />
          <Route path="*" element={<Navigate to="/dashboard/employee" replace />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/gate" replace />} />
    </Routes>
  );
};

export default App;
