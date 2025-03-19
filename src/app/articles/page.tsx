import { WebAppPage } from "@/components/templates/WebAppPage/WebAppPage";
import { Routes } from "@/data/routes";

export const metadata = {
  title: 'List of Articles | Bulk Article Generator',
  description: '',
};

const Articles = () => {
  return <WebAppPage currentPage={Routes.articles} />;
};

export default Articles;
