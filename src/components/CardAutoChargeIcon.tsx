import { Check, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  /** Wrapper className (sizing, text color of card). */
  className?: string;
  /** Ring color around the green dot — should match the surrounding background. */
  ringClassName?: string;
  title?: string;
}

/**
 * Bank-card icon with a small green check badge in the bottom-right corner.
 * Indicates that automatic card charge (charge_auto) is enabled.
 */
const CardAutoChargeIcon = ({
  className,
  ringClassName = "ring-white",
  title,
}: Props) => (
  <span
    className={cn("relative inline-flex items-center justify-center", className)}
    title={title}
    aria-label={title}
  >
    <CreditCard className="h-4 w-4" />
    <span
      className={cn(
        "absolute -right-1 -bottom-1 flex h-3 w-3 items-center justify-center rounded-full bg-green-500 ring-[1.5px]",
        ringClassName
      )}
    >
      <Check className="h-2 w-2 text-white" strokeWidth={4} />
    </span>
  </span>
);

export default CardAutoChargeIcon;
