import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { fetchUser } from "@/lib/api";
import { useLangNavigate } from "@/hooks/use-lang-navigate";
import Operator1Account from "./Operator1Account";
import Operator2Account from "./Operator2Account";

const AccountPage = () => {
  const [operatorId, setOperatorId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useLangNavigate();

  useEffect(() => {
    fetchUser()
      .then(({ data }) => {
        const c = data.client;
        const sub = Array.isArray(c.subscribers) ? c.subscribers[0] : c.subscribers;
        setOperatorId(sub?.operator_id ?? 1);
      })
      .catch((err) => {
        console.error("Failed to detect operator:", err);
        if (err.message?.includes("401")) navigate("/");
        else setOperatorId(1);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return operatorId === 2 ? <Operator2Account /> : <Operator1Account />;
};

export default AccountPage;
