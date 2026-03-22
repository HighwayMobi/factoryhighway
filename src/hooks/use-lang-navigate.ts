import { useNavigate, type NavigateOptions } from "react-router-dom";
import { useLang } from "@/contexts/LangContext";
import { useCallback } from "react";

/**
 * A wrapper around useNavigate that preserves the ?lang= query parameter.
 */
export const useLangNavigate = () => {
  const navigate = useNavigate();
  const { lang } = useLang();

  return useCallback(
    (to: string, options?: NavigateOptions) => {
      const url = new URL(to, window.location.origin);
      if (!url.searchParams.has("lang")) {
        url.searchParams.set("lang", lang);
      }
      navigate(url.pathname + url.search, options);
    },
    [navigate, lang]
  );
};
