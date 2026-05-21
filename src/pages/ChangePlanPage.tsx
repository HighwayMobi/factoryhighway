import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowLeft, Signal, Loader2, Check, Snowflake, AlertTriangle } from "lucide-react";
import { useLangNavigate } from "@/hooks/use-lang-navigate";
import { cn, fmtPrice } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { useLang } from "@/contexts/LangContext";
import InternalHeader from "@/components/InternalHeader";
import { apiFetch, fetchUser, checkFunds, type PaidPlan } from "@/lib/api";
import { getSubscribersList, pickSubscriber, setSelectedSubscriberId } from "@/lib/selectedSubscriber";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import StripePaymentForm from "@/components/StripePaymentForm";

const ChangePlanPage = () => {
  const { lang, setLang } = useLang();
  const navigate = useLangNavigate();
  const [searchParams] = useSearchParams();
  const requestedSubscriberId = Number(searchParams.get("subscriber_id") || 0) || null;
  const i = t(lang);
  const [plans, setPlans] = useState<PaidPlan[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<number | null>(null);
  const [currentPlanName, setCurrentPlanName] = useState("");
  const [currentPlanPrice, setCurrentPlanPrice] = useState<number | null>(null);
  const [paymentDay, setPaymentDay] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<PaidPlan | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [subscriberId, setSubscriberId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [freezePlan, setFreezePlan] = useState<PaidPlan | null>(null);
  const [nextPaymentDate, setNextPaymentDate] = useState<string>("");
  const [operatorId, setOperatorId] = useState<number>(1);
  const [subPhone, setSubPhone] = useState<string>("");
  const [pendingPlanId, setPendingPlanId] = useState<number | null>(null);
  const [pendingPlanName, setPendingPlanName] = useState<string>("");
  const [cancellingPending, setCancellingPending] = useState(false);
  const [whenChange, setWhenChange] = useState<"now" | "later">("now");
  const [paymentPreset, setPaymentPreset] = useState<any | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [payerEmail, setPayerEmail] = useState<string>("");

  useEffect(() => {
    fetchUser()
      .then(async (userRes) => {
        const subscribers = getSubscribersList(userRes.data.client);
        const sub = (requestedSubscriberId ? subscribers.find((s) => s.id === requestedSubscriberId) : undefined)
          ?? pickSubscriber(userRes.data.client);
        if (!sub) throw new Error("Subscriber not found");
        if (requestedSubscriberId && sub.id === requestedSubscriberId) setSelectedSubscriberId(sub.id);
        setCurrentPlanId(sub.paid_plan_id);
        setCurrentPlanName(sub.paid_plan?.local_name?.[lang] || sub.paid_plan?.name || "");
        setCurrentPlanPrice(sub.paid_plan?.price ?? null);
        setPaymentDay(sub.paymentDay);
        setSubscriberId(sub.id);
        setNextPaymentDate(sub.nextPaymentDate || "");
        const rawPhone = String((sub as any).number || (sub as any).phone || (sub as any).msisdn || "").replace(/\D/g, "");
        const localPhone = rawPhone.startsWith("34") ? rawPhone.slice(2) : rawPhone;
        setSubPhone(localPhone ? `+34 ${localPhone}` : "");

        const operatorId = sub.operator_id ?? 1;
        setOperatorId(operatorId);
        // Note: api/paidPlans/1 returns ALL plans across operators; api/paidPlans/2 returns []
        // So we always fetch from /1 and filter client-side by the subscriber's operator_id.
        const plansRes = await apiFetch(`api/paidPlans/1`);
        const rawPlans: PaidPlan[] = Array.isArray(plansRes.data)
          ? plansRes.data
          : Object.values(plansRes.data || {});
        const allPlans = rawPlans.filter((p: any) => (p.operator_id ?? operatorId) === operatorId);
        // FREEZE существует только у оператора 1 в API. Для оператора 2 синтезируем
        // его на основе FREEZE оператора 1 (id, цена, gb=0), чтобы пользователь
        // мог заказать заморозку и получить такой же баннер на дашборде.
        let freeze = allPlans.find((p) => p.gb === 0);
        if (!freeze && operatorId === 2) {
          const op1Freeze = rawPlans.find((p: any) => p.gb === 0 && (p.operator_id ?? 1) === 1);
          if (op1Freeze) freeze = { ...op1Freeze, operator_id: 2 } as PaidPlan;
        }
        setFreezePlan(freeze && freeze.id !== sub.paid_plan_id ? freeze : null);
        setPlans(allPlans.filter((p) => p.id !== sub.paid_plan_id && p.gb > 0));

        // Detect already-scheduled plan change
        const pendingId = Number((sub as any).new_paid_plan_id || 0);
        if (pendingId && pendingId !== sub.paid_plan_id) {
          setPendingPlanId(pendingId);
          const pp = rawPlans.find((p: any) => p.id === pendingId);
          setPendingPlanName(pp?.local_name?.[lang] || pp?.name || `#${pendingId}`);
        } else {
          setPendingPlanId(null);
          setPendingPlanName("");
        }
      })
      .catch((err) => {
        console.error("Failed to load plans:", err);
        if (err.message?.includes("401")) navigate("/");
      })
      .finally(() => setLoading(false));
  }, [lang, requestedSubscriberId]);

  const getNextFeeDate = () => {
    if (!paymentDay) return "";
    const now = new Date();
    const month = now.getDate() > paymentDay ? now.getMonth() + 2 : now.getMonth() + 1;
    const year = now.getFullYear() + (month > 12 ? 1 : 0);
    const m = ((month - 1) % 12) + 1;
    return `${String(paymentDay).padStart(2, "0")}.${String(m).padStart(2, "0")}.${year}`;
  };

  const handleSelectPlan = (plan: PaidPlan) => {
    if (pendingPlanId) return;
    setSelectedPlan(plan);
    // Default: upgrade -> "now", downgrade/freeze -> "later"
    const isFreeze = plan.gb === 0;
    const isUpgrade = !isFreeze && currentPlanPrice !== null && plan.price > currentPlanPrice;
    setWhenChange(isUpgrade ? "now" : "later");
    setConfirmOpen(true);
  };

  const reloadPlans = async () => {
    setLoading(true);
    try {
      const userRes = await fetchUser();
      const subs = getSubscribersList(userRes.data.client);
      const sub = (requestedSubscriberId ? subs.find((s) => s.id === requestedSubscriberId) : undefined)
        ?? pickSubscriber(userRes.data.client);
      if (!sub) return;
      const pendingId = Number((sub as any).new_paid_plan_id || 0);
      if (pendingId && pendingId !== sub.paid_plan_id) {
        const plansRes = await apiFetch(`api/paidPlans/1`);
        const rawPlans: PaidPlan[] = Array.isArray(plansRes.data) ? plansRes.data : Object.values(plansRes.data || {});
        const pp = rawPlans.find((p: any) => p.id === pendingId);
        setPendingPlanId(pendingId);
        setPendingPlanName(pp?.local_name?.[lang] || pp?.name || `#${pendingId}`);
      } else {
        setPendingPlanId(null);
        setPendingPlanName("");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPending = async () => {
    if (!subscriberId) return;
    setCancellingPending(true);
    try {
      await apiFetch("api/cancelService", {
        method: "POST",
        body: JSON.stringify({ service: '"ChangePaidPlan"', subscriber_id: subscriberId }),
      });
      const { clearPlanChangeConfirmed } = await import("@/lib/confirmedPlanChange");
      clearPlanChangeConfirmed(subscriberId);
      toast({ title: i.cp_successTitle });
      await reloadPlans();
    } catch (err: any) {
      console.error("Failed to cancel scheduled plan change:", err);
      if (err?.status === 404) {
        const { clearPlanChangeConfirmed } = await import("@/lib/confirmedPlanChange");
        clearPlanChangeConfirmed(subscriberId);
        setPendingPlanId(null);
        setPendingPlanName("");
      } else {
        toast({ title: i.cp_errorTitle, description: err?.message || i.cp_errorDesc, variant: "destructive" });
      }
    } finally {
      setCancellingPending(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedPlan || !subscriberId) return;
    const isFreeze = selectedPlan.gb === 0;
    const isUpgrade = !isFreeze && currentPlanPrice !== null && selectedPlan.price > currentPlanPrice;
    // Downgrade & freeze always at end of period; upgrade depends on user choice
    const nowFlag = isUpgrade && whenChange === "now" ? 1 : 0;
    setSubmitting(true);
    try {
      // Always check funds for the new plan price; backend handles actual charging
      {
        const funds = await checkFunds(
          "ChangePaidPlan",
          Number(selectedPlan.price) || 0,
          subscriberId,
          "/change-plan",
          selectedPlan.local_name?.[lang] || selectedPlan.name || "Change plan"
        );

        if (!funds.enough) {
          let deficit = funds.deficit;
          if (!deficit || deficit <= 0) {
            try {
              const userRes = await fetchUser();
              const sub = pickSubscriber(userRes.data.client);
              const bal = Number(sub?.balance) || 0;
              deficit = Math.max(0, Number(selectedPlan.price) - bal);
            } catch {
              deficit = Number(selectedPlan.price);
            }
          }
          const topUpAmount = Math.max(3, Math.ceil(deficit));
          toast({
            title: i.cp_insufficientTitle,
            description: i.cp_insufficientDesc.replace("{amount}", String(topUpAmount)),
          });
          setConfirmOpen(false);
          const params = new URLSearchParams({
            amount: String(topUpAmount),
            returnTo: "/change-plan",
            pay: "card",
          });
          navigate(`/topup?${params.toString()}`);
          return;
        }
      }

      const reqBody = {
        subscriber_id: subscriberId,
        plan_id: selectedPlan.id,
        now: nowFlag,
      };
      console.log("[ChangePlan] PUT api/paidPlan request body:", JSON.stringify(reqBody, null, 2));
      let res: any;
      try {
        res = await apiFetch("api/paidPlan", {
          method: "PUT",
          body: JSON.stringify(reqBody),
        });
        console.log("[ChangePlan] PUT api/paidPlan response:", JSON.stringify(res, null, 2));
      } catch (e: any) {
        console.log("[ChangePlan] PUT api/paidPlan error:", e?.status, e?.message, e?.data ? JSON.stringify(e.data, null, 2) : "");
        throw e;
      }
      const { markPlanChangeConfirmed } = await import("@/lib/confirmedPlanChange");
      markPlanChangeConfirmed(subscriberId, selectedPlan.id);
      toast({ title: i.cp_successTitle, description: i.cp_successDesc });
      setConfirmOpen(false);
      navigate("/account?refresh=1");
    } catch (err: any) {
      console.error("Failed to change plan:", err);
      toast({
        title: i.cp_errorTitle,
        description: err?.message || i.cp_errorDesc,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
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

      <main className="mx-auto w-full max-w-lg px-4 py-8 sm:py-12">
        <button
          onClick={() => navigate("/account")}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {i.back}
        </button>

        <div className="mb-4 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {i.cp_title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {i.cp_subtitle}
          </p>
          {subPhone && (
            <p className="mt-1 text-sm font-semibold text-primary">
              {i.cp_forLine} {subPhone}
            </p>
          )}
        </div>

        {/* Current plan badge */}
        <div className="mb-6 rounded-2xl border border-primary/30 bg-primary/5 px-5 py-3 flex items-center gap-3">
          <Check className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <span className="text-xs text-muted-foreground">{i.cp_currentPlan}</span>
            <p className="text-sm font-bold text-foreground">{currentPlanName}</p>
          </div>
          {currentPlanPrice !== null && (
            <span className="text-lg font-bold text-primary whitespace-nowrap">€{fmtPrice(currentPlanPrice)}<span className="text-xs font-normal text-muted-foreground">{i.cp_perMonth}</span></span>
          )}
        </div>

        {/* Pending plan change banner is shown only on the main account page */}

        <div className="space-y-3">
          {plans.map((plan) => {
            const name = plan.local_name?.[lang] || plan.name;
            return (
              <div
                key={plan.id}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/40"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <Signal className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <span className="text-base font-bold text-foreground">{name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-primary whitespace-nowrap">€{fmtPrice(plan.price)}<span className="text-xs font-normal text-muted-foreground">{i.cp_perMonth}</span></span>
                    <button
                      onClick={() => handleSelectPlan(plan)}
                      disabled={!!pendingPlanId}
                      className="rounded-xl border border-primary px-5 py-2.5 text-sm font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-primary"
                    >
                      {i.cp_select}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {/* FREEZE option */}
        {freezePlan && (
          <div className="mt-8">
            <div className="rounded-2xl border border-orange-300/50 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-500/30 p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/40">
                  <Snowflake className="h-5 w-5 text-orange-500" />
                </div>
                <div className="flex-1">
                  <span className="text-base font-bold text-foreground">{i.cp_freezeTitle}</span>
                  <p className="text-xs text-muted-foreground">€{fmtPrice(freezePlan.price)}{i.cp_perMonth}</p>
                </div>
                <button
                  onClick={() => handleSelectPlan(freezePlan)}
                  disabled={!!pendingPlanId}
                  className="rounded-xl border border-orange-400 px-5 py-2.5 text-sm font-semibold text-orange-600 dark:text-orange-400 transition-all hover:bg-orange-500 hover:text-white active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-orange-600 dark:disabled:hover:text-orange-400"
                >
                  {i.cp_select}
                </button>
              </div>
              <div className="flex items-start gap-2 rounded-xl bg-orange-100/60 dark:bg-orange-900/30 px-3 py-2.5">
                <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                <p className="text-xs text-orange-700 dark:text-orange-300">
                  {i.cp_freezeWarning}
                  {nextPaymentDate && (
                    <> — <strong>{nextPaymentDate.split("-").reverse().join(".")}</strong></>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
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

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{i.cp_confirmTitle}</DialogTitle>
          </DialogHeader>
          {selectedPlan && (() => {
            const isFreeze = selectedPlan.gb === 0;
            const isUpgrade = !isFreeze && currentPlanPrice !== null && selectedPlan.price > currentPlanPrice;
            const feeDate = nextPaymentDate ? nextPaymentDate.split("-").reverse().join(".") : getNextFeeDate();
            const soonDays = operatorId === 2 ? 3 : 1;
            const soonDate = (() => {
              const d = new Date(); d.setDate(d.getDate() + soonDays);
              return `${String(d.getDate()).padStart(2,"0")}.${String(d.getMonth()+1).padStart(2,"0")}.${d.getFullYear()}`;
            })();
            let noteText = "";
            if (isFreeze) {
              noteText = i.cp_freezeNote.replace("{date}", feeDate).replace("{price}", String(selectedPlan.price));
            } else if (isUpgrade) {
              if (whenChange === "now") {
                const tpl = operatorId === 2 ? i.cp_op2Note : i.cp_upgradeNote;
                noteText = tpl.replace("{date}", soonDate).replace("{price}", String(selectedPlan.price));
              } else {
                noteText = i.cp_downgradeNote.replace("{date}", feeDate);
              }
            } else {
              noteText = i.cp_downgradeNote.replace("{date}", feeDate);
            }
            return (
              <div className="space-y-4 py-2">
                <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-2">
                  {subPhone && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{i.cp_forLine}</span>
                      <span className="font-semibold text-primary">{subPhone}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{i.cp_newPlan}</span>
                    <span className="font-semibold text-foreground">
                      {selectedPlan.local_name?.[lang] || selectedPlan.name}
                    </span>
                  </div>
                  {!isFreeze && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{i.cp_data}</span>
                      <span className="font-semibold text-foreground">{selectedPlan.gb} GB</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{i.cp_monthlyFee}</span>
                    <span className="font-bold text-primary">€{fmtPrice(selectedPlan.price)}</span>
                  </div>
                </div>

                {isUpgrade && (
                  <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                    <p className="text-sm font-semibold text-foreground">{i.cp_whenChangeTitle}</p>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="whenChange"
                        value="now"
                        checked={whenChange === "now"}
                        onChange={() => setWhenChange("now")}
                        className="mt-1 accent-primary"
                      />
                      <span className="text-sm text-foreground">
                        {i.cp_whenChangeNow.replace("{date}", soonDate)}
                      </span>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="whenChange"
                        value="later"
                        checked={whenChange === "later"}
                        onChange={() => setWhenChange("later")}
                        className="mt-1 accent-primary"
                      />
                      <span className="text-sm text-foreground">
                        {i.cp_whenChangeLater.replace("{date}", feeDate)}
                      </span>
                    </label>
                  </div>
                )}

                <div className={cn(
                  "rounded-xl border p-4 text-sm text-foreground",
                  isFreeze ? "bg-orange-50/50 border-orange-300/50 dark:bg-orange-950/20 dark:border-orange-500/30" :
                  isUpgrade && whenChange === "now" ? "bg-green-50/50 border-green-300/50 dark:bg-green-950/20 dark:border-green-500/30" :
                  "bg-primary/5 border-primary/20"
                )}>
                  <p>{noteText}</p>
                </div>
              </div>
            );
          })()}
          <DialogFooter className="flex gap-2 sm:gap-2">
            <button
              onClick={() => setConfirmOpen(false)}
              className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              {i.cp_cancel}
            </button>
            <button
              onClick={handleConfirm}
              disabled={submitting}
              className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : i.cp_confirm}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChangePlanPage;
