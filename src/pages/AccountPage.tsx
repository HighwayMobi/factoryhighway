import { useState, useEffect } from "react";
import {
  LogOut, User, Wifi, Phone as PhoneIcon,
  Plus, Clock, Info, Settings, ChevronRight, Signal, FileText, ShieldCheck, ChevronDown, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { useLang } from "@/contexts/LangContext";
import { useNavigate } from "react-router-dom";
import InternalHeader from "@/components/InternalHeader";
import { fetchUser, apiFetch, clearAuthToken, type UserClient } from "@/lib/api";

const AccountPage = () => {
  const { lang, setLang } = useLang();
  const [financesOpen, setFinancesOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const i = t(lang);

  const [user, setUser] = useState({
    name: "",
    phone: "",
    plan: "",
    balance: 0,
    monthlyFee: 0,
    feeDate: "",
    dataUsed: 0,
    dataTotal: 0,
    minutesLimit: null as number | null,
    financePlanFee: 0,
    financeAdditional: 0,
    financeTopUp: 0,
    financeUsed: 0,
    financeRemaining: 0,
  });

  useEffect(() => {
    fetchUser()
      .then(({ data }) => {
        const c = data.client;
        const sub = c.subscribers;
        const plan = sub?.paid_plan;
        const remains = sub?.remains;

        const planName = plan?.local_name?.[lang] || plan?.name || "";
        const payDay = sub?.paymentDay;
        const now = new Date();
        let feeDate = "";
        if (payDay) {
          const month = now.getDate() > payDay ? now.getMonth() + 2 : now.getMonth() + 1;
          const year = now.getFullYear() + (month > 12 ? 1 : 0);
          const m = ((month - 1) % 12) + 1;
          feeDate = `${String(payDay).padStart(2, "0")}.${String(m).padStart(2, "0")}.${year}`;
        }

        setUser((prev) => ({
          ...prev,
          name: `${c.first_name || ""} ${c.second_name || ""}`.trim(),
          phone: c.phone ? (c.phone.startsWith("+") ? c.phone : `+${c.phone}`) : "",
          balance: sub?.balance ?? c.balance ?? 0,
          plan: planName,
          monthlyFee: plan?.price ?? 0,
          feeDate,
          dataTotal: plan?.gb ?? 0,
          dataUsed: remains?.gb ?? 0,
          minutesLimit: plan?.minutes === 0 ? null : (plan?.minutes ?? null),
          financeTopUp: sub?.balance ?? 0,
          financeRemaining: sub?.balance ?? 0,
          financePlanFee: plan?.price ?? 0,
        }));
        if (c.lang === "en" || c.lang === "ru") {
          setLang(c.lang);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch user:", err);
        if (err.message?.includes("401")) {
          navigate("/");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    try {
      await apiFetch("api/logout");
    } catch (_) {
      // ignore — clear token regardless
    }
    clearAuthToken();
    navigate("/");
  };

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

      <main className="flex-1 flex flex-col items-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-2xl space-y-4">

          {/* User Header */}
          <div className="flex items-center gap-4 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{user.name}</h1>
              <p className="text-sm font-medium text-primary">{user.phone}</p>
            </div>
          </div>

          {/* Plan Card */}
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Signal className="h-4 w-4 text-primary" />
                </div>
                <span className="text-base font-semibold text-foreground">{user.plan}</span>
              </div>
              <button className="w-[130px] rounded-xl border border-primary px-4 py-2 text-sm font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground text-center">
                {i.acc_changePlan}
              </button>
            </div>
            <div className="border-t border-border px-6 py-3 flex items-center justify-between">
              <div>
                <span className="text-sm text-muted-foreground">{i.acc_balance}</span>
                <span className="ml-2 text-sm font-bold text-primary">€{user.balance}</span>
                <br />
                <span className="text-xs text-muted-foreground">{i.acc_monthlyFee}</span>
                <span className="ml-1 text-xs font-semibold text-primary">€{user.monthlyFee}</span>
              </div>
              <button
                onClick={() => navigate("/topup")}
                className="w-[130px] rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:brightness-110 active:scale-[0.98] text-center"
              >
                {i.acc_topUp}
              </button>
            </div>
            <div className="bg-primary px-6 py-2.5 text-center text-xs font-medium text-primary-foreground">
              {i.acc_feeNotice} €{user.monthlyFee} {i.acc_feeDate} {user.feeDate}
            </div>
          </div>

          {/* Data Usage */}
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{i.acc_dataAvailable}</span>
              </div>
              <span className="text-sm font-bold text-primary">{user.dataUsed} Gb {i.acc_of} {user.dataTotal} Gb</span>
            </div>
            <div className="border-t border-border px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{i.acc_minutesAvailable}</span>
              </div>
              <span className="text-sm font-bold text-primary">{user.minutesLimit ?? i.acc_unlimited}</span>
            </div>
            {user.dataTotal === 0 && (
              <div className="bg-primary/10 px-6 py-2.5 text-center text-xs font-medium text-primary">
                {i.acc_noData}{" "}
                <button className="underline font-semibold hover:text-primary/80">{i.acc_buyHere}</button>
              </div>
            )}
          </div>

          {/* Buy GB */}
          <button className="w-full rounded-2xl border border-border bg-card shadow-sm px-6 py-4 flex items-center gap-3 transition-colors hover:bg-secondary/50">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Plus className="h-4 w-4 text-primary" />
            </div>
            <span className="text-base font-semibold text-foreground">{i.acc_buyGb}</span>
          </button>

          {/* Finances Accordion */}
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <button
              onClick={() => setFinancesOpen(!financesOpen)}
              className="flex w-full items-center justify-between px-6 py-4 transition-colors hover:bg-secondary/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <span className="text-base font-semibold text-foreground">{i.acc_finances}</span>
              </div>
              <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform duration-200", financesOpen && "rotate-180")} />
            </button>
            <div className={cn("grid transition-all duration-300 ease-in-out", financesOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
              <div className="overflow-hidden">
                <div className="border-t border-border">
                  <div className="px-6 py-3 flex items-center justify-between border-b border-border">
                    <span className="text-sm text-foreground">{i.acc_planFee}</span>
                    <span className="text-sm font-semibold text-primary">- {user.financePlanFee}€</span>
                  </div>
                  <div className="px-6 py-3 flex items-center justify-between border-b border-border">
                    <span className="text-sm text-foreground">{i.acc_additionalServices}</span>
                    <span className="text-sm font-semibold text-primary">- {user.financeAdditional}€</span>
                  </div>
                  <div className="px-6 py-3 flex items-center justify-between">
                    <span className="text-sm text-foreground">{i.acc_topUpBalance}</span>
                    <span className="text-sm font-semibold text-primary">+ {user.financeTopUp}€</span>
                  </div>
                  <div className="flex bg-primary text-primary-foreground">
                    <div className="flex-1 px-6 py-3 text-center border-r border-primary-foreground/20">
                      <div className="text-xs font-medium opacity-80">{i.acc_used}</div>
                      <div className="text-lg font-bold">{user.financeUsed}€</div>
                    </div>
                    <div className="flex-1 px-6 py-3 text-center">
                      <div className="text-xs font-medium opacity-80">{i.acc_remaining}</div>
                      <div className="text-lg font-bold">{user.financeRemaining}€</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile */}
          <button
            onClick={() => navigate("/profile")}
            className="w-full rounded-2xl border border-border bg-card shadow-sm px-6 py-4 flex items-center justify-between transition-colors hover:bg-secondary/50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Settings className="h-4 w-4 text-primary" />
              </div>
              <span className="text-base font-semibold text-foreground">{i.acc_profile}</span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>

          {/* Information */}
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <button
              onClick={() => setInfoOpen(!infoOpen)}
              className="flex w-full items-center justify-between px-6 py-4 transition-colors hover:bg-secondary/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Info className="h-4 w-4 text-primary" />
                </div>
                <span className="text-base font-semibold text-foreground">{i.acc_info}</span>
              </div>
              <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform duration-200", infoOpen && "rotate-180")} />
            </button>
            <div className={cn("grid transition-all duration-300 ease-in-out", infoOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
              <div className="overflow-hidden">
                <div className="border-t border-border">
                  <a href="#" className="flex items-center gap-3 px-6 py-3.5 text-sm text-foreground transition-colors hover:bg-secondary/50 border-b border-border">
                    <FileText className="h-4 w-4 text-primary" />
                    {i.acc_termsConditions}
                  </a>
                  <a href="#" className="flex items-center gap-3 px-6 py-3.5 text-sm text-foreground transition-colors hover:bg-secondary/50">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    {i.acc_privacyPolicy}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full rounded-2xl border border-destructive/30 bg-card shadow-sm px-6 py-4 flex items-center gap-3 transition-colors hover:bg-destructive/5"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
              <LogOut className="h-4 w-4 text-destructive" />
            </div>
            <span className="text-base font-semibold text-destructive">{i.acc_logout}</span>
          </button>
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

export default AccountPage;
