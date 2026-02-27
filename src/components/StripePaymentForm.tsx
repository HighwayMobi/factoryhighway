import { useState, useCallback, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { Shield, CheckCircle, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { useLang } from "@/contexts/LangContext";

const stripePromise = loadStripe(
  "pk_test_51S7bGLQM5BJ4b1inXCowPXEgmkzDv5FTUew7zeTUEqzz9OSm4erZg8Pw5HUp8X3cfc2O64EIPEA43osR4Q0BjOvS00xLdjkHCZ"
);

const SUCCESS_REDIRECT_PATH = "/payment-success";
const SUCCESS_DELAY_MS = 2500;

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
}: StripePaymentFormProps) => {
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const navigate = useNavigate();
  const { lang } = useLang();

  const handleComplete = useCallback(() => {
    setCompleted(true);
    onSuccess?.();
  }, [onSuccess]);

  // Auto-redirect after success with delay
  useEffect(() => {
    if (!completed) return;
    const timer = setTimeout(() => {
      navigate(SUCCESS_REDIRECT_PATH);
    }, SUCCESS_DELAY_MS);
    return () => clearTimeout(timer);
  }, [completed, navigate]);

  const fetchClientSecret = useCallback(async () => {
    try {
      const successRedirectUrl = `${window.location.origin}${SUCCESS_REDIRECT_PATH}`;

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

  if (completed) {
    return (
      <div className="flex flex-col items-center gap-4 py-10">
        <CheckCircle className="h-14 w-14 text-primary animate-in zoom-in-50 duration-300" />
        <p className="text-lg font-semibold text-foreground">{successLabel}</p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{lang === "ru" ? "Перенаправление..." : "Redirecting..."}</span>
        </div>
      </div>
    );
  }

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
