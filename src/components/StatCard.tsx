import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  accent?: boolean;
}

const StatCard = ({ title, value, subtitle, accent }: StatCardProps) => (
  <div
    className={cn(
      "rounded-xl border p-5 transition-shadow hover:shadow-md",
      accent
        ? "bg-primary text-primary-foreground border-primary"
        : "bg-card text-card-foreground border-border"
    )}
  >
    <p className={cn("text-xs font-medium uppercase tracking-wider", accent ? "text-primary-foreground/70" : "text-muted-foreground")}>
      {title}
    </p>
    <p className="mt-2 font-display text-3xl">{value}</p>
    <p className={cn("mt-1 text-sm", accent ? "text-primary-foreground/70" : "text-muted-foreground")}>
      {subtitle}
    </p>
  </div>
);

export default StatCard;
