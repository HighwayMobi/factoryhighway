import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useLangNavigate } from "@/hooks/use-lang-navigate";

/** Redirects /buy-gb to /topup?tab=gb, preserving all query params */
const BuyGbPage = () => {
  const navigate = useLangNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", "gb");
    navigate(`/topup?${params.toString()}`);
  }, []);

  return null;
};

export default BuyGbPage;
