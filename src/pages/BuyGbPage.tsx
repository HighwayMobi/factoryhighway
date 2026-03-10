import { useState, useEffect } from "react";
import { ArrowLeft, Wifi, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { useLang } from "@/contexts/LangContext";
import InternalHeader from "@/components/InternalHeader";
import { apiFetch, type GbPackage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
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

const BuyGbPage = () => {
  const { lang, setLang } = useLang();
  const navigate = useNavigate();
  const i = t(lang);
  const [subscriberId, setSubscriberId] = useState<number | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [packages, setPackages] = useState<DisplayPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingGb, setBuyingGb] = useState<number | null>(null);
  const [confirmPkg, setConfirmPkg] = useState<DisplayPackage | null>(null);

  useEffect(() => {
    apiFetch("api/user").then((res) => {
      const sub = Array.isArray(res?.data?.client?.subscribers)
        ? res.data.client.subscribers[0]
        : res?.data?.client?.subscribers;
      if (sub?.id) setSubscriberId(sub.id);
      setBalance(sub?.balance ?? 0);

      const gbPkgs: GbPackage[] = sub?.paid_plan?.gbPackages || [];
      const mapped: DisplayPackage[] = gbPkgs.map((p, idx) => ({
        gb: p.size,
        price: Number(p.price),
        id: p.id,
        popular: idx === gbPkgs.length - 1 && gbPkgs.length > 1,
      }));
      setPackages(mapped);
    }).finally(() => setLoading(false));
  }, []);

  const handleBuy = async () => {
    if (!subscriberId || !confirmPkg || buyingGb !== null) return;
    setBuyingGb(confirmPkg.gb);
    try {
      const token = (await import("@/lib/api")).getAuthToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const raw = await fetch(`https://sim.highway.mobi/web/api/addGB`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          subscriber_id: subscriberId,
          size: confirmPkg.gb,
        }),
      });
      const res = await raw.json();

      if (res?.success) {
        toast({ title: i.buyGb_success });
        setConfirmPkg(null);
        await new Promise((r) => setTimeout(r, 1500));
        navigate("/account?refresh=1");
      } else if (res?.message?.includes("Not enough funds") || res?.message?.includes("Insufficient")) {
        const shortage = Math.ceil(confirmPkg.price - balance);
        const topUpAmount = Math.max(shortage, 3);
        setConfirmPkg(null);
        toast({
          title: i.buyGb_noFunds,
          description: i.buyGb_noFundsRedirect,
        });
        setTimeout(() => navigate(`/topup?amount=${topUpAmount}`), 1500);
      } else {
        toast({
          title: i.buyGb_error,
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: i.buyGb_error, variant: "destructive" });
    } finally {
      setBuyingGb(null);
    }
  };

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
                      onClick={() => setConfirmPkg(pkg)}
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
