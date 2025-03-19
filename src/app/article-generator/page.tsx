import { WebAppPage } from "@/components/templates/WebAppPage/WebAppPage";
import { Routes } from "@/data/routes";

export const metadata = {
  title: 'Generate Articles | Bulk Article Generator',
  description: '',
};

const ArticleGenerator = () => {
  return <WebAppPage currentPage={Routes.articlegenerator} />;
};

export default ArticleGenerator;
