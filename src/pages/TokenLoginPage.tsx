import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { setAuthToken } from "@/lib/api";
import { Loader2 } from "lucide-react";

const TokenLoginPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      setAuthToken(token);
      sessionStorage.setItem("inapp", "1");
      navigate("/account", { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};

export default TokenLoginPage;
