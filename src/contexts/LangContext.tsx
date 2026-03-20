import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { type Lang } from "@/lib/i18n";

interface LangContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const LangContext = createContext<LangContextType | undefined>(undefined);

const getInitialLang = (): Lang => {
  const params = new URLSearchParams(window.location.search);
  const urlLang = params.get("lang");
  if (urlLang === "en" || urlLang === "ru") return urlLang;
  const stored = localStorage.getItem("app_lang");
  return (stored === "en" || stored === "ru") ? stored : "ru";
};

const syncUrlParam = (lang: Lang) => {
  const url = new URL(window.location.href);
  url.searchParams.set("lang", lang);
  window.history.replaceState(null, "", url.toString());
};

export const LangProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(getInitialLang);

  useEffect(() => {
    syncUrlParam(lang);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("app_lang", l);
    syncUrlParam(l);
  };

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
};
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
};
