import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Globe, ChevronDown, Bell, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Lang } from "@/lib/i18n";
import highwayLogo from "@/assets/highway-logo.png";

const languages: { code: Lang; label: string }[] = [
  { code: "ru", label: "RU" },
  { code: "en", label: "EN" },
];

interface InternalHeaderProps {
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  showBack?: boolean;
}

const InternalHeader = ({ lang, onLangChange, showBack }: InternalHeaderProps) => {
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isAccountPage = location.pathname === "/account";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          {!isAccountPage && (
            <button
              onClick={() => navigate("/account")}
              className="flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <img
            src={highwayLogo}
            alt="Highway Mobile"
            className="h-9 cursor-pointer"
            onClick={() => navigate("/account")}
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <Bell className="h-5 w-5" />
          </button>
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Globe className="h-4 w-4" />
              {lang.toUpperCase()}
              <ChevronDown className={cn("h-3 w-3 transition-transform", langOpen && "rotate-180")} />
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 min-w-[80px] rounded-lg border border-border bg-card shadow-lg overflow-hidden">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => { onLangChange(l.code); setLangOpen(false); }}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-secondary",
                      lang === l.code ? "font-semibold text-primary" : "text-foreground"
                    )}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default InternalHeader;
