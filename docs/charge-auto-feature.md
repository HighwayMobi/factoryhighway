# Charge Auto (Save Card / Auto-payment) — Integration Guide

Feature lets a subscriber:
- See a card+green-check icon in the account when `charge_auto = true`.
- Tick "Remember card for auto-payment" on the top-up page when it's `false` (flag is sent to the API right after a successful Stripe payment).
- Click "Unbind card" (with confirm dialog) on the top-up page when it's `true`.

---

## 1. Backend / API

Highway endpoint:

```
POST /api/chargeAuto
Headers: X-API-KEY, Authorization: Bearer <user_token>, Content-Type: application/json, Accept: application/json
Body: { "subscriber_id": <int>, "charge_auto": <bool> }
404 → {"success": false, "message": "Subscriber not found"}
```

`api/user` response now includes `charge_auto: boolean` on each subscriber.

### Edge proxy (`supabase/functions/highway-proxy/index.ts`)

Add `"chargeAuto"` to `ALLOWED_PATH_SEGMENTS`:

```ts
const ALLOWED_PATH_SEGMENTS = new Set<string>([
  ...,
  "chargeAuto",
  ...
]);
```

## 2. Types & API client (`src/lib/api.ts`)

```ts
export interface Subscriber {
  // ...existing fields
  charge_auto?: boolean;
}

export const setChargeAuto = (subscriberId: number, chargeAuto: boolean) =>
  apiFetch("api/chargeAuto", {
    method: "POST",
    body: JSON.stringify({ subscriber_id: subscriberId, charge_auto: chargeAuto }),
  });
```

## 3. Visual indicator component (`src/components/CardAutoChargeIcon.tsx`)

```tsx
import { Check, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  ringClassName?: string; // ring color = surrounding bg (e.g. "ring-card")
  title?: string;
}

const CardAutoChargeIcon = ({ className, ringClassName = "ring-white", title }: Props) => (
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
```

## 4. i18n keys (`src/lib/i18n.ts`)

```ts
// RU
acc_chargeAutoActive: "Автоплатёж картой активен",
topup_rememberCard:   "Запомнить карту для автоплатежа",
topup_unbindCard:     "Отвязать карту",
topup_unbindConfirmTitle: "Отвязать карту?",
topup_unbindConfirmDesc:  "Автоплатёж будет отключён, карта будет удалена.",
topup_unbindConfirmYes:   "Да, отвязать",
topup_unbindConfirmNo:    "Отмена",
topup_cardSaved:   "Карта сохранена для автоплатежа",
topup_cardUnbound: "Карта отвязана",
common_error:      "Ошибка",

// EN
acc_chargeAutoActive: "Card auto-payment active",
topup_rememberCard:   "Remember card for auto-payment",
topup_unbindCard:     "Unbind card",
topup_unbindConfirmTitle: "Unbind card?",
topup_unbindConfirmDesc:  "Auto-payment will be disabled and the card will be removed.",
topup_unbindConfirmYes:   "Yes, unbind",
topup_unbindConfirmNo:    "Cancel",
topup_cardSaved:   "Card saved for auto-payment",
topup_cardUnbound: "Card unbound",
common_error:      "Error",
```

(Add equivalents for any other languages.)

## 5. Account page — show icon when active

In each operator account page (e.g. `Operator1Account.tsx`, `Operator2Account.tsx`),
extract `charge_auto` from the selected subscriber:

```ts
const user = {
  // ...
  chargeAuto: !!(sub as any)?.charge_auto,
};
```

Render near the subscription-fee block:

```tsx
{user.chargeAuto && (
  <CardAutoChargeIcon
    ringClassName="ring-card"          // match surrounding bg
    className="text-foreground"
    title={i.acc_chargeAutoActive}
  />
)}
```

## 6. Top-up page — checkbox + unbind button

State:

```ts
const [chargeAuto, setChargeAutoState] = useState(false);
const [rememberCard, setRememberCard] = useState(false);
const [unbinding, setUnbinding] = useState(false);
const [showUnbindConfirm, setShowUnbindConfirm] = useState(false);
```

Initialize from current subscriber:

```ts
setChargeAutoState(!!(sub as any).charge_auto);
```

After a successful Stripe payment (in the existing success handler):

```ts
const handlePaymentSuccess = async () => {
  if (!rememberCard || subscriberId == null || chargeAuto) return;
  try {
    await setChargeAuto(subscriberId, true);
    setChargeAutoState(true);
    toast({ title: i.topup_cardSaved });
  } catch (e) {
    console.error("setChargeAuto failed", e);
    // non-fatal — payment already succeeded
  }
};
```

Unbind handler with confirm dialog:

```ts
const handleUnbindCard = async () => {
  if (subscriberId == null) return;
  setUnbinding(true);
  try {
    await setChargeAuto(subscriberId, false);
    setChargeAutoState(false);
    setRememberCard(false);
    toast({ title: i.topup_cardUnbound });
  } catch (e: any) {
    toast({ title: i.common_error, description: e?.message, variant: "destructive" });
  } finally {
    setUnbinding(false);
    setShowUnbindConfirm(false);
  }
};
```

Render directly under the "Pay by card" button:

```tsx
{!chargeAuto ? (
  <label className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground">
    <Checkbox
      checked={rememberCard}
      onCheckedChange={(v) => setRememberCard(v === true)}
    />
    <span>{i.topup_rememberCard}</span>
  </label>
) : (
  <button
    type="button"
    onClick={() => setShowUnbindConfirm(true)}
    className="mt-3 flex w-full items-center justify-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
  >
    <CardAutoChargeIcon ringClassName="ring-card" className="text-foreground" />
    <span className="underline-offset-2 hover:underline">{i.topup_unbindCard}</span>
  </button>
)}
```

Confirm dialog (Radix AlertDialog):

```tsx
<AlertDialog open={showUnbindConfirm} onOpenChange={setShowUnbindConfirm}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>{i.topup_unbindConfirmTitle}</AlertDialogTitle>
      <AlertDialogDescription>{i.topup_unbindConfirmDesc}</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel disabled={unbinding}>{i.topup_unbindConfirmNo}</AlertDialogCancel>
      <AlertDialogAction
        onClick={(e) => { e.preventDefault(); handleUnbindCard(); }}
        disabled={unbinding}
      >
        {unbinding ? "..." : i.topup_unbindConfirmYes}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## Files touched in this project

- `supabase/functions/highway-proxy/index.ts` — whitelist `chargeAuto`
- `src/lib/api.ts` — `Subscriber.charge_auto`, `setChargeAuto()`
- `src/lib/i18n.ts` — translation keys (RU/EN)
- `src/components/CardAutoChargeIcon.tsx` — NEW
- `src/pages/Operator1Account.tsx`, `src/pages/Operator2Account.tsx` — show icon
- `src/pages/TopUpPage.tsx` — checkbox + unbind button + dialog

## Stripe note

The card is actually saved by Stripe through your existing PaymentIntent / SetupIntent flow on the backend. The `charge_auto` flag is just a server-side opt-in toggle; Stripe `setup_future_usage` / `off_session` charging itself must be wired in your Stripe integration as usual.
