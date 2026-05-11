import { usePageTitle } from "../../hooks/usePageTitle";
import Reports from "../../components/reports/Reports";

const AdminReportsPage = () => {
  usePageTitle("Admin Reports");
  return <Reports headerLabel="Admin Reports" headerTitle="Reporting Console" />;
};

export default AdminReportsPage;
