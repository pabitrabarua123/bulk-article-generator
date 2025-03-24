import { WebAppPage } from "@/components/templates/WebAppPage/WebAppPage";
import { Routes } from "@/data/routes";

export const metadata = {
  title: 'Account | Bulk Article Generator',
  description: '',
};

const Account = () => {
  return <WebAppPage currentPage={Routes.account} />;
};

export default Account;
