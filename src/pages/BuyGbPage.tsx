import { useState, useEffect } from "react";
import { ArrowLeft, Wifi, Loader2, CreditCard, Shield, Pencil } from "lucide-react";
import { useLangNavigate } from "@/hooks/use-lang-navigate";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { useLang } from "@/contexts/LangContext";
import InternalHeader from "@/components/InternalHeader";
import { apiFetch, getAuthToken, type GbPackage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import StripePaymentForm from "@/components/StripePaymentForm";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface DisplayPackage {
  gb: number;
  price: number;
  id: string;
  popular?: boolean;
}

const DEFAULT_PACKAGES: DisplayPackage[] = [
  { gb: 1, price: 3, id: "default-1" },
  { gb: 5, price: 6, id: "default-5" },
  { gb: 20, price: 10, id: "default-20", popular: true },
];

const BuyGbPage = () => {
  const { lang, setLang } = useLang();
  const navigate = useLangNavigate();
  const i = t(lang);
  const [subscriberId, setSubscriberId] = useState<number | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [packages, setPackages] = useState<DisplayPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingGb, setBuyingGb] = useState<number | null>(null);
  const [confirmPkg, setConfirmPkg] = useState<DisplayPackage | null>(null);
  const [isAuthed, setIsAuthed] = useState(true);

  // Payment form state (for unauthenticated users)
  const [selectedPkg, setSelectedPkg] = useState<DisplayPackage | null>(null);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  useEffect(() => {
    apiFetch("api/user")
      .then((res) => {
        const sub = Array.isArray(res?.data?.client?.subscribers)
          ? res.data.client.subscribers[0]
          : res?.data?.client?.subscribers;
        if (sub?.id) setSubscriberId(sub.id);
        setBalance(sub?.balance ?? 0);

        const c = res?.data?.client;
        if (c?.email) setEmail(c.email);
        if (c?.phone) setPhone(c.phone.startsWith("+") ? c.phone : `+${c.phone}`);

        const gbPkgs: GbPackage[] = sub?.paid_plan?.gbPackages || [];
        const mapped: DisplayPackage[] = gbPkgs.map((p, idx) => ({
          gb: p.size,
          price: Number(p.price),
          id: p.id,
          popular: idx === gbPkgs.length - 1 && gbPkgs.length > 1,
        }));
        setPackages(mapped.length > 0 ? mapped : DEFAULT_PACKAGES);
      })
      .catch(() => {
        setIsAuthed(false);
        setPackages(DEFAULT_PACKAGES);
      })
      .finally(() => setLoading(false));
  }, []);

  const rawFetch = async (url: string, method: string, body: object) => {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const raw = await fetch(url, { method, headers, body: JSON.stringify(body) });
    return raw.json();
  };

  const handlePackageClick = (pkg: DisplayPackage) => {
    if (!isAuthed) {
      // For unauthenticated users, show payment form
      setSelectedPkg(pkg);
    } else {
      // For authenticated users, show confirmation dialog
      setConfirmPkg(pkg);
    }
  };

  const handleBuy = async () => {
    if (!confirmPkg || buyingGb !== null || !subscriberId) return;

    setBuyingGb(confirmPkg.gb);
    try {
      if (balance < confirmPkg.price) {
        const shortage = Math.ceil(confirmPkg.price - balance);
        const topUpAmount = Math.max(shortage, 3);
        setConfirmPkg(null);
        toast({
          title: i.buyGb_noFunds,
          description: i.buyGb_noFundsRedirect,
        });
        setTimeout(() => navigate(`/topup?amount=${topUpAmount}&returnTo=/buy-gb`), 1500);
        return;
      }

      const res = await rawFetch(
        "https://sim.highway.mobi/web/api/addGB",
        "PUT",
        { subscriber_id: subscriberId, size: confirmPkg.gb }
      );

      if (res?.success) {
        toast({ title: i.buyGb_success });
        setConfirmPkg(null);
        await new Promise((r) => setTimeout(r, 1500));
        navigate("/account?refresh=1");
      } else {
        toast({ title: i.buyGb_error, variant: "destructive" });
      }
    } catch {
      toast({ title: i.buyGb_error, variant: "destructive" });
    } finally {
      setBuyingGb(null);
    }
  };

  const isPaymentFormValid = phone.length >= 5 && email.length >= 3;

  // Render payment form for unauthenticated user who selected a package
  const renderPaymentForm = () => {
    if (!selectedPkg) return null;

    if (showPaymentForm) {
      return (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-4 rounded-xl bg-secondary/60 px-4 py-3">
            <span className="text-sm text-muted-foreground">{i.buyGb_title}</span>
            <span className="mt-1 block text-sm font-semibold text-foreground">
              {selectedPkg.gb} GB — €{selectedPkg.price}
            </span>
          </div>
          <StripePaymentForm
            amount={selectedPkg.price}
            email={email}
            phone={phone}
            type="gb"
            onCancel={() => setShowPaymentForm(false)}
            secureLabel={i.securePayment}
            cancelLabel={i.topup_back}
            successLabel={i.topup_paymentSuccess}
            backLabel={i.back}
            returnTo="/buy-gb"
          />
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        {/* Selected package */}
        <div className="mb-6 flex items-center justify-between rounded-xl bg-secondary/60 px-4 py-3">
          <div>
            <span className="text-sm text-muted-foreground">{i.buyGb_title}</span>
            <span className="mt-1 block text-sm font-semibold text-foreground">
              {selectedPkg.gb} GB — €{selectedPkg.price}
            </span>
          </div>
          <button
            onClick={() => setSelectedPkg(null)}
            className="text-xs font-medium text-primary hover:underline"
          >
            {i.buyGb_cancel}
          </button>
        </div>

        {/* Phone */}
        <div className="mb-6 rounded-xl bg-secondary/60 px-4 py-3">
          <span className="text-sm text-muted-foreground">{i.phoneLabel}</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={i.phonePlaceholder}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Email */}
        <div className="mb-8 rounded-xl bg-secondary/60 px-4 py-3">
          <span className="text-sm text-muted-foreground">{i.emailReceipt}</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Summary */}
        <div className="mb-6 rounded-xl bg-secondary/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{selectedPkg.gb} GB</span>
            <span className="font-mono text-lg font-bold text-foreground">€{selectedPkg.price.toFixed(2)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{i.commission}</span>
            <span className="text-sm font-semibold text-success">{i.free}</span>
          </div>
          <div className="mt-3 border-t border-border pt-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">{i.total}</span>
            <span className="font-mono text-xl font-bold text-foreground">€{selectedPkg.price.toFixed(2)}</span>
          </div>
        </div>

        {/* Pay Button */}
        <button
          disabled={!isPaymentFormValid}
          onClick={() => setShowPaymentForm(true)}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all",
            isPaymentFormValid
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
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <InternalHeader lang={lang} onLangChange={setLang} />

      <main className="mx-auto w-full max-w-lg px-4 py-8 sm:py-12">
        <button
          onClick={() => {
            if (selectedPkg && !showPaymentForm) {
              setSelectedPkg(null);
            } else if (showPaymentForm) {
              setShowPaymentForm(false);
            } else {
              navigate("/account");
            }
          }}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {i.back}
        </button>

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {i.buyGb_title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {i.buyGb_subtitle}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !isAuthed && selectedPkg ? (
          renderPaymentForm()
        ) : packages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-12">
            {lang === "ru" ? "Дополнительные пакеты недоступны для вашего тарифа" : "No additional packages available for your plan"}
          </p>
        ) : (
          <div className="space-y-3">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={cn(
                  "relative rounded-2xl border bg-card p-5 shadow-sm transition-all",
                  pkg.popular
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-primary/40"
                )}
              >
                {pkg.popular && (
                  <span className="absolute -top-2.5 right-4 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                    {i.buyGb_popular}
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <Wifi className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <span className="text-lg font-bold text-foreground">{pkg.gb} GB</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-primary">€{pkg.price}</span>
                    <button
                      disabled={buyingGb !== null}
                      onClick={() => handlePackageClick(pkg)}
                      className={cn(
                        "rounded-xl px-5 py-2.5 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-60",
                        pkg.popular
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:brightness-110"
                          : "border border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                      )}
                    >
                      {i.buyGb_buy}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Confirmation dialog for authenticated users */}
      <AlertDialog open={!!confirmPkg} onOpenChange={(open) => !open && setConfirmPkg(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{i.buyGb_confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmPkg &&
                i.buyGb_confirmDesc
                  .replace("{gb}", String(confirmPkg.gb))
                  .replace("{price}", String(confirmPkg.price))}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={buyingGb !== null}>
              {i.buyGb_cancel}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleBuy} disabled={buyingGb !== null}>
              {buyingGb !== null ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                i.buyGb_confirm
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <footer className="mt-auto border-t border-border bg-card">
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

export default BuyGbPage;
