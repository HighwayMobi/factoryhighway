import { useState, useEffect } from "react";
import { ArrowLeft, CreditCard, Shield, Pencil } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { useLang } from "@/contexts/LangContext";
import InternalHeader from "@/components/InternalHeader";
import { fetchUser } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import StripePaymentForm from "@/components/StripePaymentForm";

const amountPresets = [5, 10, 20, 50];

const TopUpPage = () => {
  const [searchParams] = useSearchParams();
  const initialAmount = searchParams.get("amount") || "";
  const returnTo = searchParams.get("returnTo") || undefined;
  const initialNum = parseFloat(initialAmount);
  const [amount, setAmount] = useState(initialAmount);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(
    amountPresets.includes(initialNum) ? initialNum : null
  );
  const [email, setEmail] = useState("");
  const [editingEmail, setEditingEmail] = useState(false);
  const [phone, setPhone] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const { lang, setLang } = useLang();
  const navigate = useNavigate();
  const i = t(lang);

  useEffect(() => {
    fetchUser()
      .then(({ data }) => {
        const c = data.client;
        setEmail(c.email || "");
        setPhone(c.phone ? (c.phone.startsWith("+") ? c.phone : `+${c.phone}`) : "");
      })
      .catch(() => {});
  }, []);

  const handlePresetClick = (value: number) => {
    setSelectedPreset(value);
    setAmount(String(value));
  };

  const handleAmountChange = (val: string) => {
    setAmount(val);
    const num = parseFloat(val);
    if (amountPresets.includes(num)) {
      setSelectedPreset(num);
    } else {
      setSelectedPreset(null);
    }
  };

  const displayAmount = amount ? parseFloat(amount) : 0;
  const isValid = displayAmount >= 3;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <InternalHeader lang={lang} onLangChange={setLang} />

      <main className="mx-auto w-full max-w-lg px-4 py-8 sm:py-12">
        <button
          onClick={() => navigate("/account")}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {i.back}
        </button>
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {i.topUpTitle}
          </h1>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          {showPaymentForm ? (
              <StripePaymentForm
                amount={displayAmount}
                email={email}
                phone={phone}
                type="mobile"
                onCancel={() => setShowPaymentForm(false)}
                secureLabel={i.securePayment}
                cancelLabel={i.topup_back}
                successLabel={i.topup_paymentSuccess}
                backLabel={i.back}
              />
          ) : (
            <>
              {/* Phone (read-only) */}
              <div className="mb-6 flex items-center justify-between rounded-xl bg-secondary/60 px-4 py-3">
                <span className="text-sm text-muted-foreground">{i.phoneLabel}</span>
                <span className="text-sm font-semibold text-foreground">{phone}</span>
              </div>

              {/* Amount */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-foreground">
                  {i.amountLabel}
                </label>
                <div className="mb-3 grid grid-cols-4 gap-2">
                  {amountPresets.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => handlePresetClick(preset)}
                      className={cn(
                        "rounded-xl border py-2.5 text-sm font-semibold transition-all",
                        selectedPreset === preset
                          ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25"
                          : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-primary/5"
                      )}
                    >
                      €{preset}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">€</span>
                  <input
                    type="number"
                    min="3"
                    placeholder={i.otherAmount}
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background py-3 pl-8 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              {/* Email (editable) */}
              <div className="mb-8 rounded-xl bg-secondary/60 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{i.emailReceipt}</span>
                  {editingEmail ? (
                    <button onClick={() => setEditingEmail(false)} className="text-xs font-medium text-primary hover:underline">OK</button>
                  ) : (
                    <button onClick={() => setEditingEmail(true)} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                      <Pencil className="h-3 w-3" />
                    </button>
                  )}
                </div>
                {editingEmail ? (
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                ) : (
                  <span className="mt-1 block text-sm font-semibold text-foreground">{email}</span>
                )}
              </div>

              {/* Summary */}
              <div className="mb-6 rounded-xl bg-secondary/60 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{i.topUpAmount}</span>
                  <span className="font-mono text-lg font-bold text-foreground">€{displayAmount.toFixed(2)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{i.commission}</span>
                  <span className="text-sm font-semibold text-success">{i.free}</span>
                </div>
                <div className="mt-3 border-t border-border pt-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">{i.total}</span>
                  <span className="font-mono text-xl font-bold text-foreground">€{displayAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Pay Button */}
              <button
                disabled={!isValid}
                onClick={() => setShowPaymentForm(true)}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all",
                  isValid
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:brightness-110 active:scale-[0.98]"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                <CreditCard className="h-4 w-4" />
                {i.payByCard}
              </button>

              {/* Trust badges */}
              <div className="mt-5 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5" />
                  {i.securePayment}
                </div>
                <span>•</span>
                <span>Stripe</span>
                <span>•</span>
                <span>SSL</span>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex gap-4 text-xs text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">{i.privacy}</a>
              <a href="#" className="hover:text-foreground transition-colors">{i.terms}</a>
              <a href="#" className="hover:text-foreground transition-colors">{i.contacts}</a>
            </div>
            <p className="text-xs text-muted-foreground">© 2026 highway.mobi</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TopUpPage;
