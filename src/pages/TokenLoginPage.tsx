import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useLangNavigate } from "@/hooks/use-lang-navigate";
import { setAuthToken } from "@/lib/api";
import { Loader2 } from "lucide-react";

const TokenLoginPage = () => {
  const { token: pathToken } = useParams();
  const navigate = useLangNavigate();

  useEffect(() => {
    // Prefer token from URL fragment (#token=...) — fragments are NOT sent to
    // servers, NOT written to access logs, and NOT included in Referer headers.
    // Fall back to path param for backwards compatibility with existing
    // deep links that webviews may still generate.
    let token: string | null = null;
    if (typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;
      const params = new URLSearchParams(hash);
      token = params.get("token");
    }
    if (!token && pathToken) token = pathToken;

    if (token) {
      setAuthToken(token);
      sessionStorage.setItem("inapp", "1");
      // replace: true removes the token-bearing URL from browser history.
      navigate("/account", { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  }, [pathToken, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};

export default TokenLoginPage;
