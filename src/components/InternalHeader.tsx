import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Globe, ChevronDown, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Lang, t } from "@/lib/i18n";
import highwayLogo from "@/assets/highway-logo.png";
import { apiFetch } from "@/lib/api";
import NotificationsPanel from "@/components/NotificationsPanel";

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
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const langRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const i = t(lang);

  // Fetch unread count on mount
  useEffect(() => {
    apiFetch("api/checkNotifications")
      .then((res) => {
        if (res?.success) {
          setUnreadCount(res.data.count ?? 0);
        }
      })
      .catch(() => {});
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleUnreadChange = useCallback((delta: number) => {
    setUnreadCount((prev) => Math.max(0, prev + delta));
  }, []);

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <img
          src={highwayLogo}
          alt="Highway Mobile"
          className="h-9 cursor-pointer"
          onClick={() => navigate("/account")}
        />
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
            <NotificationsPanel
              open={notifOpen}
              onClose={() => setNotifOpen(false)}
              lang={lang}
              onUnreadCountChange={handleUnreadChange}
            />
          </div>

          {/* Language */}
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
