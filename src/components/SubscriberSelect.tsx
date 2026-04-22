import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setSelectedSubscriberId } from "@/lib/selectedSubscriber";
import type { Subscriber } from "@/lib/api";

interface Props {
  subscribers: Subscriber[];
  selectedId: number | null;
}

const fmtPhone = (n: string) => (n.startsWith("+") ? n : `+34 ${n}`);

const SubscriberSelect = ({ subscribers, selectedId }: Props) => {
  const current = subscribers.find((s) => s.id === selectedId) ?? subscribers[0];
  if (!current) return null;

  // Single subscriber: just show phone, no dropdown
  if (subscribers.length <= 1) {
    return <p className="text-sm font-medium text-primary">{fmtPhone(current.number)}</p>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-primary outline-none transition-colors hover:opacity-80">
        <span>{fmtPhone(current.number)}</span>
        <ChevronDown className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[220px]">
        {subscribers.map((s) => (
          <DropdownMenuItem
            key={s.id}
            onClick={() => {
              if (s.id !== current.id) {
                setSelectedSubscriberId(s.id);
                // Reload so AccountPage re-evaluates the operator and all pages reload data
                window.location.reload();
              }
            }}
            className={s.id === current.id ? "font-semibold text-primary" : ""}
          >
            <div className="flex flex-col">
              <span>{fmtPhone(s.number)}</span>
              <span className="text-xs text-muted-foreground">
                {s.operator} · {s.paid_plan?.name}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SubscriberSelect;
