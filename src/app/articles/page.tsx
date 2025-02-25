import { WebAppPage } from "@/components/templates/WebAppPage/WebAppPage";
import { Routes } from "@/data/routes";

const Articles = () => {
  return <WebAppPage currentPage={Routes.articles} />;
};

export default Articles;
