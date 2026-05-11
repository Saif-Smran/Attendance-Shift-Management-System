import { usePageTitle } from "../../hooks/usePageTitle";
import Reports from "../../components/reports/Reports";

const HRReportsPage = () => {
  usePageTitle("HR Reports");
  return <Reports headerLabel="HR Reports" headerTitle="Reporting Console" />;
};

export default HRReportsPage;
