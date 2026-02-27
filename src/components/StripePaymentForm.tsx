import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { CreditCard, Loader2, CheckCircle, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const stripePromise = loadStripe(
  "pk_test_51S7bGLQM5BJ4b1inXCowPXEgmkzDv5FTUew7zeTUEqzz9OSm4erZg8Pw5HUp8X3cfc2O64EIPEA43osR4Q0BjOvS00xLdjkHCZ"
);

interface CheckoutFormProps {
  onSuccess: () => void;
  onError: (msg: string) => void;
  payLabel: string;
  processingLabel: string;
}

const CheckoutForm = ({ onSuccess, onError, payLabel, processingLabel }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [ready, setReady] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || processing) return;

    setProcessing(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/account?topup=success`,
      },
      redirect: "if_required",
    });

    if (error) {
      onError(error.message || "Payment failed");
      setProcessing(false);
    } else {
      onSuccess();
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        onReady={() => setReady(true)}
        options={{
          layout: "tabs",
        }}
      />
      {ready && (
        <button
          type="submit"
          disabled={!stripe || processing}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all",
            stripe && !processing
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:brightness-110 active:scale-[0.98]"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          {processing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CreditCard className="h-4 w-4" />
          )}
          {processing ? processingLabel : payLabel}
        </button>
      )}
    </form>
  );
};

interface StripePaymentFormProps {
  amount: number;
  email: string;
  phone: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
  onCancel: () => void;
  payLabel: string;
  processingLabel: string;
  secureLabel: string;
  cancelLabel?: string;
}

const StripePaymentForm = ({
  amount,
  email,
  phone,
  onSuccess,
  onError,
  onCancel,
  payLabel,
  processingLabel,
  secureLabel,
  cancelLabel = "← Back",
}: StripePaymentFormProps) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createIntent = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({ amount, email, phone }),
          }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create payment");
        setClientSecret(data.clientSecret);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    createIntent();
  }, [amount, email, phone]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{processingLabel}</p>
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

  if (!clientSecret) return null;

  return (
    <div className="space-y-4">
      <button
        onClick={onCancel}
        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        {cancelLabel}
      </button>

      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme: "night",
            variables: {
              colorPrimary: "hsl(24, 95%, 53%)",
              colorBackground: "hsl(220, 25%, 8%)",
              colorText: "hsl(220, 10%, 90%)",
              colorDanger: "hsl(0, 72%, 51%)",
              fontFamily: "Inter, system-ui, sans-serif",
              borderRadius: "12px",
              colorTextSecondary: "hsl(220, 10%, 50%)",
              colorTextPlaceholder: "hsl(220, 10%, 40%)",
            },
            rules: {
              ".Input": {
                backgroundColor: "hsl(220, 20%, 14%)",
                border: "1px solid hsl(220, 15%, 16%)",
                color: "hsl(220, 10%, 90%)",
              },
              ".Input:focus": {
                borderColor: "hsl(24, 95%, 53%)",
                boxShadow: "0 0 0 2px hsla(24, 95%, 53%, 0.2)",
              },
              ".Tab": {
                backgroundColor: "hsl(220, 20%, 14%)",
                border: "1px solid hsl(220, 15%, 16%)",
                color: "hsl(220, 10%, 75%)",
              },
              ".Tab:hover": {
                backgroundColor: "hsl(220, 20%, 18%)",
              },
              ".Tab--selected": {
                backgroundColor: "hsl(220, 25%, 8%)",
                borderColor: "hsl(24, 95%, 53%)",
                color: "hsl(0, 0%, 100%)",
              },
              ".Label": {
                color: "hsl(220, 10%, 75%)",
              },
            },
          },
        }}
      >
        <CheckoutForm
          onSuccess={onSuccess}
          onError={onError}
          payLabel={payLabel}
          processingLabel={processingLabel}
        />
      </Elements>

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
