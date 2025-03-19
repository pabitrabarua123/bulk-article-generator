import { WebAppPage } from "@/components/templates/WebAppPage/WebAppPage";
import { Routes } from "@/data/routes";

export const metadata = {
  title: 'Dashboard | Bulk Article Generator',
  description: '',
};

const Dashboard = () => {
  return <WebAppPage currentPage={Routes.dashboard} />;
};

export default Dashboard;
