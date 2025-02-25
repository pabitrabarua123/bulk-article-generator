import { KeywordPage } from "@/components/templates/KeywordPage/KeywordPage";

type Props = {
    params: { id: string };
};

const Keyword = ({ params }: Props) => {
  const id = params.id;
  return <KeywordPage currentPage="/articles" id={id} />;
};

export default Keyword;