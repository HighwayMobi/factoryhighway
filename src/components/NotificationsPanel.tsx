import { useState, useEffect, useCallback } from "react";
import { Bell, Check, CheckCheck, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { type Lang, t } from "@/lib/i18n";
import { formatDistanceToNow } from "date-fns";
import { ru, enUS } from "date-fns/locale";

interface Notification {
  id: number;
  subject: string;
  message: string;
  is_read: string | boolean;
  created_at: string;
}

interface NotificationsPanelProps {
  open: boolean;
  onClose: () => void;
  lang: Lang;
  onUnreadCountChange?: (count: number) => void;
}

const NotificationsPanel = ({ open, onClose, lang, onUnreadCountChange }: NotificationsPanelProps) => {
  const i = t(lang);
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [markingRead, setMarkingRead] = useState<number | null>(null);

  const loadNotifications = useCallback(async (p: number, append = false) => {
    setLoading(true);
    try {
      const res = await apiFetch(`api/notifications?page=${p}`);
      if (res?.success) {
        const newItems: Notification[] = res.data.items || [];
        setItems(prev => append ? [...prev, ...newItems] : newItems);
        setPage(res.data.page ?? p);
        setPageCount(res.data.page_count ?? 1);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadNotifications(1);
    }
  }, [open, loadNotifications]);

  const handleMarkRead = async (id: number) => {
    setMarkingRead(id);
    try {
      const res = await apiFetch("api/readNotification", {
        method: "PUT",
        body: JSON.stringify({ id }),
      });
      if (res?.success) {
        setItems(prev =>
          prev.map(n => n.id === id ? { ...n, is_read: true } : n)
        );
        onUnreadCountChange?.(-1);
      }
    } catch {
      // silent
    } finally {
      setMarkingRead(null);
    }
  };

  const handleLoadMore = () => {
    if (page < pageCount) {
      loadNotifications(page + 1, true);
    }
  };

  const isUnread = (n: Notification) => !n.is_read || n.is_read === "";

  const formatDate = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), {
        addSuffix: true,
        locale: lang === "ru" ? ru : enUS,
      });
    } catch {
      return dateStr;
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed inset-x-2 top-16 z-50 max-h-[480px] rounded-xl border border-border bg-card shadow-xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[360px]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">{i.notif_title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading && items.length === 0 ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-40" />
              <span className="text-sm">{i.notif_empty}</span>
            </div>
          ) : (
            <div>
              {items.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "border-b border-border px-4 py-3 transition-colors",
                    isUnread(n) ? "bg-primary/5" : "bg-transparent"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {isUnread(n) && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                        )}
                        <span className="text-sm font-semibold text-foreground truncate">
                          {n.subject}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {n.message}
                      </p>
                      <span className="mt-1 block text-[11px] text-muted-foreground/70">
                        {formatDate(n.created_at)}
                      </span>
                    </div>
                    {isUnread(n) && (
                      <button
                        disabled={markingRead === n.id}
                        onClick={() => handleMarkRead(n.id)}
                        className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
                        title={i.notif_markRead}
                      >
                        {markingRead === n.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Load more */}
              {page < pageCount && (
                <div className="px-4 py-3 text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin inline" />
                    ) : (
                      i.notif_loadMore
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationsPanel;
