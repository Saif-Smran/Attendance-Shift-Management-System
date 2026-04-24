import { Navigate, Route, Routes } from "react-router-dom";

import AdminLayout from "./layouts/AdminLayout";
import EmployeeLayout from "./layouts/EmployeeLayout";
import HRLayout from "./layouts/HRLayout";
import AdminEmployees from "./pages/admin/Employees";
import AdminHome from "./pages/admin/Home";
import EmployeeHome from "./pages/employee/Home";
import HRHome from "./pages/hr/Home";
import HRRoster from "./pages/hr/Roster";
import HRRegistrations from "./pages/hr/Registrations";
import HRRules from "./pages/hr/Rules";
import HRShifts from "./pages/hr/Shifts";
import Gate from "./pages/Gate";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./routes/ProtectedRoute";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/gate" replace />} />
      <Route path="/gate" element={<Gate />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
        <Route path="/dashboard/admin" element={<AdminLayout />}>
          <Route index element={<AdminHome />} />
          <Route path="employees" element={<AdminEmployees />} />
          <Route path="*" element={<Navigate to="/dashboard/admin" replace />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["HR"]} />}>
        <Route path="/dashboard/hr" element={<HRLayout />}>
          <Route index element={<HRHome />} />
          <Route path="registrations" element={<HRRegistrations />} />
          <Route path="shifts" element={<HRShifts />} />
          <Route path="rules" element={<HRRules />} />
          <Route path="roster" element={<HRRoster />} />
          <Route path="*" element={<Navigate to="/dashboard/hr" replace />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["EMPLOYEE", "SECURITY"]} />}>
        <Route path="/dashboard/employee" element={<EmployeeLayout />}>
          <Route index element={<EmployeeHome />} />
          <Route path="*" element={<Navigate to="/dashboard/employee" replace />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/gate" replace />} />
    </Routes>
  );
};

export default App;
