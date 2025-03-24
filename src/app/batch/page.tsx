import { WebAppPage } from "@/components/templates/WebAppPage/WebAppPage";
import { Routes } from "@/data/routes";

export const metadata = {
  title: 'List of Articles | Bulk Article Generator',
  description: '',
};

const Batch = () => {
  return <WebAppPage currentPage={Routes.batch} />;
};

export default Batch;
