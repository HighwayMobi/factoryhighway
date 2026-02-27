import { useState, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { Loader2, Shield } from "lucide-react";
import { apiFetch } from "@/lib/api";

const stripePromise = loadStripe(
  "pk_test_51S7bGLQM5BJ4b1inXCowPXEgmkzDv5FTUew7zeTUEqzz9OSm4erZg8Pw5HUp8X3cfc2O64EIPEA43osR4Q0BjOvS00xLdjkHCZ"
);

interface StripePaymentFormProps {
  amount: number;
  email: string;
  phone: string;
  type: "mobile" | "gb";
  onCancel: () => void;
  secureLabel: string;
  cancelLabel?: string;
}

const StripePaymentForm = ({
  amount,
  email,
  phone,
  type,
  onCancel,
  secureLabel,
  cancelLabel = "← Back",
}: StripePaymentFormProps) => {
  const [error, setError] = useState<string | null>(null);

  const backURL = `${window.location.origin}/account?topup=success`;

  const fetchClientSecret = useCallback(async () => {
    try {
      // Step 1: Create top-up request
      const topUpResult = await apiFetch("api/topUp", {
        method: "POST",
        body: JSON.stringify({ type, amount, phone, email, backURL, replenishment: false }),
      });
      if (!topUpResult.success) {
        throw new Error(topUpResult.message || "Failed to create top-up");
      }

      // Step 2: Init Stripe checkout using data from topUp response
      const { email: resEmail, name, amount: resAmount, product, return_url, metadata } = topUpResult.data;
      const checkoutResult = await apiFetch("api/checkout", {
        method: "POST",
        body: JSON.stringify({
          amount: resAmount,
          email: resEmail,
          name,
          product,
          return_url: backURL,
          metadata,
        }),
      });
      if (!checkoutResult.success) {
        throw new Error(checkoutResult.message || "Failed to init checkout");
      }

      return checkoutResult.data.clientSecret;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      throw err;
    }
  }, [amount, email, phone, type, backURL]);

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
        <button
          onClick={onCancel}
          className="text-sm font-medium text-primary hover:underline"
        >
          {cancelLabel}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={onCancel}
        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        {cancelLabel}
      </button>

      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{ fetchClientSecret }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>

      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Shield className="h-3.5 w-3.5" />
          {secureLabel}
        </div>
        <span>•</span>
        <span>Stripe</span>
        <span>•</span>
        <span>SSL</span>
      </div>
    </div>
  );
};

export default StripePaymentForm;
