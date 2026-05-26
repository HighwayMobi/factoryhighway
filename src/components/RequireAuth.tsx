import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useLangNavigate } from "@/hooks/use-lang-navigate";
import { getAuthToken } from "@/lib/api";

/**
 * Route guard: blocks rendering of protected pages until we confirm a user
 * token exists. Without this, a brief flash of the protected UI is visible
 * before the page-level 401 redirect kicks in.
 */
const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const navigate = useLangNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!getAuthToken()) {
      navigate("/", { replace: true });
    } else {
      setChecked(true);
    }
  }, [navigate]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  return <>{children}</>;
};

export default RequireAuth;
