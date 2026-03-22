import { Navigate, useSearchParams } from "react-router-dom";
import LoginPage from "@/pages/LoginPage";

const Index = () => {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab");

  if (tab === "gb" || tab === "balance") {
    return <Navigate to={`/topup?${searchParams.toString()}`} replace />;
  }

  return <LoginPage />;
};

export default Index;
