import { useSearchParams } from "react-router-dom";
import LoginPage from "@/pages/LoginPage";
import TopUpPage from "@/pages/TopUpPage";

const Index = () => {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab");

  if (tab === "gb" || tab === "balance") {
    return <TopUpPage />;
  }

  return <LoginPage />;
};

export default Index;
