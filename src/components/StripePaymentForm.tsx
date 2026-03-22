import { useState, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { Shield } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useLangNavigate } from "@/hooks/use-lang-navigate";

const stripePromise = loadStripe(
  "pk_test_51S7bGLQM5BJ4b1inXCowPXEgmkzDv5FTUew7zeTUEqzz9OSm4erZg8Pw5HUp8X3cfc2O64EIPEA43osR4Q0BjOvS00xLdjkHCZ"
);

const SUCCESS_REDIRECT_PATH = "/payment-success";

interface StripePaymentFormProps {
  amount: number;
  email: string;
  phone: string;
  type: "mobile" | "gb";
  onCancel: () => void;
  onSuccess?: () => void;
  secureLabel: string;
  cancelLabel?: string;
  successLabel?: string;
  backLabel?: string;
  returnTo?: string;
}

const StripePaymentForm = ({
  amount,
  email,
  phone,
  type,
  onCancel,
  onSuccess,
  secureLabel,
  cancelLabel = "← Back",
  successLabel = "Payment successful!",
  backLabel = "← Back",
  returnTo,
}: StripePaymentFormProps) => {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const successPath = returnTo
    ? `${SUCCESS_REDIRECT_PATH}?returnTo=${encodeURIComponent(returnTo)}`
    : SUCCESS_REDIRECT_PATH;

  const handleComplete = useCallback(() => {
    onSuccess?.();
    navigate(successPath);
  }, [navigate, onSuccess, successPath]);

  const fetchClientSecret = useCallback(async () => {
    try {
      const successRedirectUrl = `${window.location.origin}${successPath}`;

      // Step 1: Create top-up request
      const topUpResult = await apiFetch("api/topUp", {
        method: "POST",
        body: JSON.stringify({ type, amount, phone, email, backURL: successRedirectUrl, replenishment: false }),
      });
      if (!topUpResult.success) {
        throw new Error(topUpResult.message || "Failed to create top-up");
      }

      // Step 2: Init Stripe checkout — pass data as-is from topUp, no return_url override
      const { email: resEmail, name, amount: resAmount, product, metadata } = topUpResult.data;

      const checkoutResult = await apiFetch("api/checkout", {
        method: "POST",
        body: JSON.stringify({
          amount: resAmount,
          email: resEmail,
          name,
          product,
          metadata,
          return_url: successRedirectUrl,
          backURL: successRedirectUrl,
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
  }, [amount, email, phone, type]);


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
        options={{ fetchClientSecret, onComplete: handleComplete }}
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
