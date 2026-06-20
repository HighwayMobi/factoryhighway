import { Check, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  /** Tailwind text color class for the card icon (defaults to currentColor). */
  className?: string;
  /** Background color of the badge (matches surrounding bg for contrast). Default white. */
  badgeBg?: string;
  title?: string;
}

/**
 * Bank-card icon with a small green check badge in the bottom-right corner.
 * Used as the visual indicator that automatic card charge is enabled.
 */
const CardAutoChargeIcon = ({ className, badgeBg = "bg-white", title }: Props) => (
  <span
    className={cn("relative inline-flex items-center justify-center", className)}
    title={title}
    aria-label={title}
  >
    <CreditCard className="h-4 w-4" />
    <span
      className={cn(
        "absolute -right-1 -bottom-1 flex h-2.5 w-2.5 items-center justify-center rounded-full ring-[1.5px] ring-white",
        badgeBg
      )}
      style={{ backgroundColor: undefined }}
    >
      <Check className="h-2 w-2 text-white" strokeWidth={4} />
    </span>
  </span>
);

export default CardAutoChargeIcon;
