import { useState, useEffect } from "react";
import { ArrowLeft, Wifi, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { useLang } from "@/contexts/LangContext";
import InternalHeader from "@/components/InternalHeader";
import { apiFetch, type PaidPlan } from "@/lib/api";

interface GbPackage {
  id: number;
  gb: number;
  price: number;
  name: string;
}

const BuyGbPage = () => {
  const { lang, setLang } = useLang();
  const navigate = useNavigate();
  const i = t(lang);
  const [packages, setPackages] = useState<GbPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("api/paidPlans/1")
      .then((res) => {
        const plans: PaidPlan[] = Array.isArray(res.data) ? res.data : Object.values(res.data || {});
        const gbPkgs = plans
          .filter((p) => p.gb > 0)
          .map((p) => ({
            id: p.id,
            gb: p.gb,
            price: p.price,
            name: p.local_name?.[lang] || p.name || "",
          }))
          .sort((a, b) => a.gb - b.gb);
        setPackages(gbPkgs);
      })
      .catch((err) => console.error("Failed to fetch plans:", err))
      .finally(() => setLoading(false));
  }, [lang]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <InternalHeader lang={lang} onLangChange={setLang} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

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

        <div className="space-y-3">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="relative rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/40"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Wifi className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <span className="text-lg font-bold text-foreground">{pkg.gb} GB</span>
                    {pkg.name && <p className="text-xs text-muted-foreground">{pkg.name}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-primary">€{pkg.price}</span>
                  <button className="rounded-xl border border-primary px-5 py-2.5 text-sm font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground active:scale-[0.98]">
                    {i.buyGb_buy}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

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
