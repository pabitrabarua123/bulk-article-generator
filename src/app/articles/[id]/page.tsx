import { KeywordPage } from "@/components/templates/KeywordPage/KeywordPage";
import { Routes } from "@/data/routes";

type Props = {
    params: { id: string };
};

const Keyword = ({ params }: Props) => {
  const id = params.id;
  return <KeywordPage currentPage={Routes.articles} id={id} />;
};

export default Keyword;