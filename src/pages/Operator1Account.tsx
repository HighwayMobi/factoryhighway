import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import {
  LogOut, User, Wifi, Phone as PhoneIcon,
  Plus, Clock, Info, Settings, ChevronRight, Signal, FileText, ShieldCheck, ChevronDown, Loader2, RefreshCw,
  ChevronLeft, Download, ShieldOff,
} from "lucide-react";
import { cn, fmtPrice } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { useLang } from "@/contexts/LangContext";
import { useLangNavigate } from "@/hooks/use-lang-navigate";
import InternalHeader from "@/components/InternalHeader";
import { fetchUser, apiFetch, clearAuthToken, getAuthToken, apiUrl, type UserClient, type Subscriber } from "@/lib/api";
import { pickSubscriber, getSubscribersList } from "@/lib/selectedSubscriber";
import { getConfirmedPlanChange, clearPlanChangeConfirmed } from "@/lib/confirmedPlanChange";
import UserAvatar from "@/components/UserAvatar";
import SubscriberSelect from "@/components/SubscriberSelect";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

const COVERAGE_COUNTRIES = "🇩🇪 Germany / Alemania, 🇦🇹 Austria, 🇧🇪 Belgium / Bélgica, 🇧🇬 Bulgaria, 🇨🇾 Cyprus / Chipre, 🇭🇷 Croatia / Croacia, 🇻🇦 Vatican City, 🇩🇰 Denmark / Dinamarca, 🇸🇰 Slovakia / Eslovaquia, 🇸🇮 Slovenia / Eslovenia, 🇪🇪 Estonia, 🇫🇮 Finland / Finlandia, 🇫🇷 France / Francia, 🇬🇮 Gibraltar, 🇬🇷 Greece / Grecia, 🇬🇵 Guadeloupe, 🇬🇫 French Guiana, 🇭🇺 Hungary / Hungría, 🇮🇪 Ireland / Irlanda, 🇮🇸 Iceland / Islandia, 🇮🇹 Italy / Italia, 🇱🇻 Latvia / Letonia, 🇱🇮 Liechtenstein, 🇱🇹 Lithuania / Lituania, 🇱🇺 Luxembourg / Luxemburgo, 🇲🇹 Malta, 🇲🇶 Martinique / Martinica, 🇾🇹 Mayotte, 🇳🇴 Norway / Noruega, 🇳🇱 Netherlands / Países Bajos, 🇵🇱 Poland / Polonia, 🇵🇹 Portugal, 🇨🇿 Czech Republic / República Checa, 🇷🇪 Réunion, 🇷🇴 Romania / Rumanía, 🇲🇫 Saint Martin / San Martín".split(", ");

const Operator1Account = () => {
  const { lang, setLang } = useLang();
  const { toast } = useToast();
  const [financesOpen, setFinancesOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingPlan, setCancellingPlan] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showCoverage, setShowCoverage] = useState(false);
  const [financeMonth, setFinanceMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() }; // 0-indexed
  });
  const [financeLoading, setFinanceLoading] = useState(false);
  const navigate = useLangNavigate();
  const [finance, setFinance] = useState<{ planFee: number; additionalServices: number; prepaidPlanChange: number; topUp: number } | null>(null);
  const [subscribersList, setSubscribersList] = useState<Subscriber[]>([]);
  const [user, setUser] = useState({
    name: "",
    phone: "",
    balance: 1,
    plan: "",
    monthlyFee: 0,
    feeDate: "",
    dataRemaining: 0,
    dataTotal: 0,
    minutesLimit: null as number | null,
    paymentType: "",
    iccid: "",
    activationDate: "",
    contractNumber: "",
    newPlan: "",
    newPlanPrice: null as number | null,
    subscriberId: null as number | null,
    clientId: null as number | null,
    status: "" as string,
    isUpgrade: false,
    confirmedNow: false,
  });

  const loadData = async () => {
    try {
      const { data } = await fetchUser();
      const c = data.client;
      setSubscribersList(getSubscribersList(c));
      const sub = pickSubscriber(c);
      const plan = sub?.paid_plan;

      let remains = sub?.remains;
      if (sub?.number) {
        try {
          const remainsRes = await apiFetch(`api/remains/${sub.number}`);
          if (remainsRes?.success && remainsRes.data) {
            remains = remainsRes.data;
          }
        } catch {}
      }

      const planName = plan?.local_name?.[lang] || plan?.name || "";
      let feeDate = "";
      if (sub?.nextPaymentDate) {
        feeDate = sub.nextPaymentDate.split("-").reverse().join(".");
      } else if (sub?.paymentDay) {
        const payDay = sub.paymentDay;
        const now = new Date();
        const month = now.getDate() > payDay ? now.getMonth() + 2 : now.getMonth() + 1;
        const year = now.getFullYear() + (month > 12 ? 1 : 0);
        const m = ((month - 1) % 12) + 1;
        feeDate = `${String(payDay).padStart(2, "0")}.${String(m).padStart(2, "0")}.${year}`;
      }

      // Show planned plan change banner whenever API reports new_paid_plan_id
      // different from current paid_plan_id. We trust the API as the source of truth.
      const pendingPlanId = Number(sub?.new_paid_plan_id || 0);
      const currentPlanId = Number(sub?.paid_plan_id || 0);
      const hasPlannedChange = pendingPlanId > 0 && pendingPlanId !== currentPlanId;
      // Clear stale local flag if API no longer reflects a pending change
      const confirmedId = sub?.id ? getConfirmedPlanChange(sub.id) : null;
      if (sub?.id && confirmedId && !hasPlannedChange) {
        clearPlanChangeConfirmed(sub.id);
      }
      const isUpgrade = hasPlannedChange && plan
        ? (plan.gb === 0 || (sub.new_paid_plan.price > (plan.price ?? 0)))
        : false;

      setUser((prev) => ({
        ...prev,
        name: `${c.first_name || ""} ${c.second_name || ""}`.trim(),
        phone: c.phone ? (c.phone.startsWith("+") ? c.phone : `+${c.phone}`) : "",
        balance: sub?.balance ?? c.balance ?? 0,
        plan: planName,
        monthlyFee: plan?.price ?? 0,
        feeDate,
        dataTotal: Math.max(remains?.gb_initial ?? plan?.gb ?? 0, remains?.gb ?? 0),
        dataRemaining: remains?.gb ?? 0,
        minutesLimit: plan?.minutes === 0 ? null : (plan?.minutes ?? null),
        paymentType: sub?.payment_type ?? "",
        iccid: sub?.iccid ?? "",
        activationDate: sub?.activation_date ?? "",
        contractNumber: sub?.contract_number ?? "",
        newPlan: hasPlannedChange ? (sub?.new_paid_plan?.local_name?.[lang] || sub?.new_paid_plan?.name || "") : "",
        newPlanPrice: hasPlannedChange ? (sub?.new_paid_plan?.price ?? null) : null,
        subscriberId: sub?.id ?? null,
        clientId: c.id ?? null,
        status: sub?.status ?? c.status ?? "",
        isUpgrade,
      }));

      // Finance is loaded separately via loadFinance

      // Do not override user-selected language with server value here.
    } catch (err: any) {
      console.error("Failed to fetch user:", err);
      if (err.message?.includes("401")) {
        navigate("/");
      }
    }
  };

  const loadFinance = async (year: number, month: number) => {
    if (!user.subscriberId) return;
    setFinanceLoading(true);
    try {
      const dateParam = `${year}-${String(month + 1).padStart(2, "0")}`;
      const finRes = await apiFetch(`api/finance?subscriber_id=${user.subscriberId}&date=${dateParam}`);
      if (finRes?.success !== false && finRes?.data) {
        const d = finRes.data;
        setFinance({
          planFee: d.monthlyFee ?? 0,
          additionalServices: d.withdrawal ?? 0,
          prepaidPlanChange: d.blocked ?? 0,
          topUp: d.deposit ?? 0,
        });
      } else {
        setFinance(null);
      }
    } catch (e) {
      console.error("Failed to fetch finance:", e);
      setFinance(null);
    } finally {
      setFinanceLoading(false);
    }
  };

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [lang]);

  // Auto-refresh after payment redirect
  useEffect(() => {
    if (searchParams.get("refresh") === "1") {
      setSearchParams({}, { replace: true });
      loadData();
    }
  }, [searchParams]);

  useEffect(() => {
    if (user.subscriberId) {
      loadFinance(financeMonth.year, financeMonth.month);
    }
  }, [financeMonth, user.subscriberId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const i = t(lang);

  const handleCancelPlanChange = async () => {
    if (!user.subscriberId) return;
    setCancellingPlan(true);
    try {
      await apiFetch("api/cancelService", {
        method: "POST",
        body: JSON.stringify({ service: '"ChangePaidPlan"', subscriber_id: user.subscriberId }),
      });
      clearPlanChangeConfirmed(user.subscriberId);
      await loadData();
    } catch (err: any) {
      console.error("Failed to cancel plan change:", err);
      if (err?.status === 404) {
        clearPlanChangeConfirmed(user.subscriberId);
        setUser((prev) => ({ ...prev, newPlan: "", newPlanPrice: null, isUpgrade: false }));
        setShowCancelConfirm(false);
      }
    } finally {
      setCancellingPlan(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiFetch("api/logout");
    } catch (_) {
      // ignore — clear token regardless
    }
    clearAuthToken();
    sessionStorage.removeItem("selected_subscriber_id");
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
    <div className="min-h-screen flex flex-col bg-background relative">
      <InternalHeader lang={lang} onLangChange={setLang} />

      {user.status.toLowerCase().replace(/[\s_-]+/g, "") === "notactivated" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-md">
          <div className="flex flex-col items-center gap-5 rounded-2xl border border-border bg-card px-8 py-10 shadow-2xl text-center max-w-sm mx-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Clock className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">{i.acc_notActivated}</h2>
            <p className="text-sm text-muted-foreground">{i.acc_notActivatedDesc}</p>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="mt-2 flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              {refreshing ? (lang === "ru" ? "Обновление..." : "Refreshing...") : (lang === "ru" ? "Обновить" : "Refresh")}
            </button>
          </div>
        </div>
      )}

      {["archived", "deleted", "movednpm", "blocked"].includes(user.status.toLowerCase().replace(/[\s_-]+/g, "")) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-md">
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card px-8 py-10 shadow-2xl text-center max-w-sm mx-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <ShieldOff className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-foreground">{i.acc_blocked}</h2>
            <p className="text-sm text-muted-foreground">{i.acc_blockedDesc}</p>
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col items-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-2xl space-y-4">

          {/* User Header */}
          <div className="flex items-center gap-4 mb-2">
            <UserAvatar userId={user.clientId} />
            <div>
              <h1 className="text-xl font-bold text-foreground">{user.name}</h1>
              <SubscriberSelect subscribers={subscribersList} selectedId={user.subscriberId} />
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="ml-auto p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
              title={lang === "ru" ? "Обновить" : "Refresh"}
            >
              <RefreshCw className={cn("h-5 w-5", refreshing && "animate-spin")} />
            </button>
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
              <button
                onClick={() => navigate(user.subscriberId ? `/change-plan?subscriber_id=${user.subscriberId}` : "/change-plan")}
                disabled={!!user.newPlan}
                className="w-[130px] rounded-xl border border-primary px-4 py-2 text-sm font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground text-center disabled:opacity-40 disabled:pointer-events-none"
              >
                {i.acc_changePlan}
              </button>
            </div>
            <div className="border-t border-border px-6 py-3 flex items-center justify-between">
              <div>
                <span className="text-sm text-muted-foreground">{i.acc_balance}</span>
                <span className="ml-2 text-sm font-bold text-primary">€{fmtPrice(user.balance)}</span>
                <br />
                <span className="text-xs text-muted-foreground">{i.acc_monthlyFee}</span>
                <span className="ml-1 text-xs font-semibold text-primary">€{fmtPrice(user.monthlyFee)}</span>
              </div>
              <button
                onClick={() => navigate("/topup")}
                className="w-[130px] rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:brightness-110 active:scale-[0.98] text-center"
              >
                {i.acc_topUp}
              </button>
            </div>
            {user.balance < 0 ? (
              <div className="bg-destructive px-6 py-2.5 text-center text-xs font-medium text-destructive-foreground">
                {i.acc_negativeBalance}{" "}
                <button
                  onClick={() => navigate("/topup")}
                  className="underline font-semibold hover:opacity-80 transition-opacity"
                >
                  {i.acc_negativeBalanceLink}
                </button>{" "}
                {i.acc_negativeBalanceSuffix}
              </div>
            ) : (
              <div className="bg-primary px-6 py-2.5 text-center text-xs font-medium text-primary-foreground">
                {user.newPlan ? (
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <span>
                      {(() => {
                        const showDate = user.isUpgrade
                          ? (() => { const d = new Date(); d.setDate(d.getDate() + 1); return `${String(d.getDate()).padStart(2,"0")}.${String(d.getMonth()+1).padStart(2,"0")}.${d.getFullYear()}`; })()
                          : user.feeDate;
                        return lang === "ru"
                          ? <>С {showDate} тариф сменится на<br />«{user.newPlan}» — €{fmtPrice(user.newPlanPrice)}/мес</>
                          : <>From {showDate} plan changes to<br />"{user.newPlan}" — €{fmtPrice(user.newPlanPrice)}/mo</>;
                      })()}
                    </span>
                    <button
                      onClick={() => setShowCancelConfirm(true)}
                      disabled={cancellingPlan}
                      className="rounded-lg border border-primary-foreground/40 px-2.5 py-0.5 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary-foreground/20 active:scale-[0.96] disabled:opacity-50"
                    >
                      {cancellingPlan ? "..." : i.acc_cancelPlanChange}
                    </button>
                  </div>
                ) : (
                  <>
                    {i.acc_feeNotice} €{fmtPrice(user.monthlyFee)} {i.acc_feeForCurrentPlan} {i.acc_feeDate} {user.feeDate}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Data Usage */}
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{i.acc_dataAvailable}</span>
              </div>
              <span className="text-sm font-bold text-primary">{user.dataRemaining} Gb {i.acc_of} {user.dataTotal} Gb</span>
            </div>
            <div className="border-t border-border px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{i.acc_minutesAvailable}</span>
              </div>
              <span className="text-sm font-bold text-primary">{user.minutesLimit ?? i.acc_unlimited}</span>
            </div>
            {user.dataRemaining < 1 && (
              <div className="bg-destructive/10 px-6 py-2.5 text-center text-xs font-medium text-destructive">
                {i.acc_noData}{" "}
                <button onClick={() => navigate("/buy-gb")} className="underline font-semibold hover:text-destructive/80">{i.acc_buyHere}</button>
              </div>
            )}
            <div className="border-t border-border px-6 py-3">
              <button
                type="button"
                onClick={() => setShowCoverage(true)}
                className="text-sm font-medium text-primary hover:underline focus:outline-none"
              >
                {lang === "ru" ? "Страны покрытия" : "Coverage countries"}
              </button>
            </div>
          </div>

          <Dialog open={showCoverage} onOpenChange={setShowCoverage}>
            <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{lang === "ru" ? "Страны покрытия" : "Coverage countries"}</DialogTitle>
              </DialogHeader>
              <ul className="grid grid-cols-1 gap-1.5 text-sm text-foreground">
                {COVERAGE_COUNTRIES.map((c) => (
                  <li key={c} className="py-1 border-b border-border/40 last:border-0">{c}</li>
                ))}
              </ul>
            </DialogContent>
          </Dialog>

          {/* Buy GB */}
          <button
            onClick={() => navigate("/buy-gb")}
            className="w-full rounded-2xl border border-border bg-card shadow-sm px-6 py-4 flex items-center justify-between transition-colors hover:bg-secondary/50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Plus className="h-4 w-4 text-primary" />
              </div>
              <span className="text-base font-semibold text-foreground">{i.acc_buyGb}</span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
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
                  {/* Month selector */}
                  <div className="px-6 py-3 flex items-center justify-between border-b border-border">
                    <button
                      onClick={() => {
                        const prev = financeMonth.month === 0
                          ? { year: financeMonth.year - 1, month: 11 }
                          : { year: financeMonth.year, month: financeMonth.month - 1 };
                        setFinanceMonth(prev);
                      }}
                      disabled={(() => {
                        if (!user.activationDate) return false;
                        const act = new Date(user.activationDate);
                        return financeMonth.year === act.getFullYear() && financeMonth.month === act.getMonth();
                      })()}
                      className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-semibold text-foreground">
                      {i.acc_months[financeMonth.month]} {financeMonth.year}
                    </span>
                    <button
                      onClick={() => {
                        const now = new Date();
                        const isCurrentMonth = financeMonth.year === now.getFullYear() && financeMonth.month === now.getMonth();
                        if (isCurrentMonth) return;
                        const next = financeMonth.month === 11
                          ? { year: financeMonth.year + 1, month: 0 }
                          : { year: financeMonth.year, month: financeMonth.month + 1 };
                        setFinanceMonth(next);
                      }}
                      disabled={financeMonth.year === new Date().getFullYear() && financeMonth.month === new Date().getMonth()}
                      className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  {financeLoading ? (
                    <div className="px-6 py-8 flex justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  ) : (
                    <>
                      <div className="px-6 py-3.5 flex items-center justify-between border-b border-border">
                        <span className="text-sm text-foreground">{i.acc_planFee}</span>
                        <span className="text-sm font-semibold text-primary">- {fmtPrice(finance?.planFee ?? user.monthlyFee)}€</span>
                      </div>
                      {(finance?.additionalServices ?? 0) > 0 && (
                        <div className="px-6 py-3.5 flex items-center justify-between border-b border-border">
                          <span className="text-sm text-foreground">{i.acc_additionalServices}</span>
                          <span className="text-sm font-semibold text-primary">- {fmtPrice(finance!.additionalServices)}€</span>
                        </div>
                      )}
                      {(finance?.prepaidPlanChange ?? 0) > 0 && (
                        <div className="px-6 py-3.5 flex items-center justify-between border-b border-border">
                          <span className="text-sm text-foreground">{i.acc_prepaidPlanChange}</span>
                          <span className="text-sm font-semibold text-primary">- {fmtPrice(finance!.prepaidPlanChange)}€</span>
                        </div>
                      )}
                      <div className="px-6 py-3.5 flex items-center justify-between border-b border-border">
                        <span className="text-sm text-foreground">{i.acc_topUpBalance}</span>
                        <span className="text-sm font-semibold text-primary">+ {fmtPrice(finance?.topUp ?? 0)}€</span>
                      </div>
                      {/* Invoice download for past months */}
                      {(() => {
                        const now = new Date();
                        const isCurrentMonth = financeMonth.year === now.getFullYear() && financeMonth.month === now.getMonth();
                        if (!isCurrentMonth && user.subscriberId) {
                          const handleDownloadInvoice = async () => {
                            const dateParam = `${financeMonth.year}-${String(financeMonth.month + 1).padStart(2, "0")}`;
                            const token = getAuthToken();
                            try {
                              const res = await fetch(apiUrl(`/api/invoice?subscriber_id=${user.subscriberId}&date=${dateParam}`), {
                                headers: {
                                  "Authorization": `Bearer ${token}`,
                                  "Accept": "application/json",
                                },
                              });
                              if (!res.ok) throw new Error("Failed");
                              const blob = await res.blob();
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `invoice-${dateParam}.pdf`;
                              a.click();
                              URL.revokeObjectURL(url);
                            } catch {
                              toast({ title: "Error", description: "Failed to download invoice", variant: "destructive" });
                            }
                          };
                          return (
                            <button
                              onClick={handleDownloadInvoice}
                              className="flex items-center gap-2 px-6 py-3.5 border-b border-border text-sm font-semibold text-primary transition-colors hover:bg-secondary/50 w-full text-left"
                            >
                              <Download className="h-4 w-4" />
                              {i.acc_downloadInvoice}
                            </button>
                          );
                        }
                        return null;
                      })()}
                      <div className="flex items-stretch rounded-b-2xl bg-primary text-primary-foreground">
                        <div className="flex-1 px-6 py-3 flex flex-col items-start justify-center">
                          <span className="text-xs font-medium opacity-90">{i.acc_used}</span>
                          <span className="text-lg font-bold">{fmtPrice((finance?.planFee ?? 0) + (finance?.additionalServices ?? 0) + (finance?.prepaidPlanChange ?? 0))}€</span>
                        </div>
                        <div className="w-px bg-primary-foreground/30 my-2" />
                        <div className="flex-1 px-6 py-3 flex flex-col items-end justify-center">
                          <span className="text-xs font-medium opacity-90">{i.acc_topUpBalance}</span>
                          <span className="text-lg font-bold">{fmtPrice(finance?.topUp ?? 0)}€</span>
                        </div>
                      </div>
                    </>
                  )}
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

          {/* Logout — hidden when opened from mobile app via token-login */}
          {!sessionStorage.getItem("inapp") && (
            <button
              onClick={handleLogout}
              className="w-full rounded-2xl border border-destructive/30 bg-card shadow-sm px-6 py-4 flex items-center gap-3 transition-colors hover:bg-destructive/5"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
                <LogOut className="h-4 w-4 text-destructive" />
              </div>
              <span className="text-base font-semibold text-destructive">{i.acc_logout}</span>
            </button>
          )}
        </div>
      </main>

      {/* Cancel Plan Change Confirmation */}
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{i.acc_cancelPlanConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{i.acc_cancelPlanConfirmDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{i.acc_cancelPlanConfirmNo}</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelPlanChange}>{i.acc_cancelPlanConfirmYes}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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

export default Operator1Account;
