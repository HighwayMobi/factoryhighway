import { useState, useEffect } from "react";
import { ArrowLeft, Signal, Loader2, Check, Snowflake, AlertTriangle } from "lucide-react";
import { useLangNavigate } from "@/hooks/use-lang-navigate";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { useLang } from "@/contexts/LangContext";
import InternalHeader from "@/components/InternalHeader";
import { apiFetch, fetchUser, type PaidPlan } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const ChangePlanPage = () => {
  const { lang, setLang } = useLang();
  const navigate = useNavigate();
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

  useEffect(() => {
    Promise.all([
      fetchUser(),
      apiFetch("api/paidPlans/1"),
    ])
      .then(([userRes, plansRes]) => {
        const sub = Array.isArray(userRes.data.client.subscribers) ? userRes.data.client.subscribers[0] : userRes.data.client.subscribers;
        setCurrentPlanId(sub.paid_plan_id);
        setCurrentPlanName(sub.paid_plan?.local_name?.[lang] || sub.paid_plan?.name || "");
        setCurrentPlanPrice(sub.paid_plan?.price ?? null);
        setPaymentDay(sub.paymentDay);
        setSubscriberId(sub.id);
        setNextPaymentDate(sub.nextPaymentDate || "");

        const allPlans: PaidPlan[] = Array.isArray(plansRes.data)
          ? plansRes.data
          : Object.values(plansRes.data || {});
        const freeze = allPlans.find((p) => p.gb === 0);
        setFreezePlan(freeze && freeze.id !== sub.paid_plan_id ? freeze : null);
        setPlans(allPlans.filter((p) => p.id !== sub.paid_plan_id && p.gb > 0));
      })
      .catch((err) => {
        console.error("Failed to load plans:", err);
        if (err.message?.includes("401")) navigate("/");
      })
      .finally(() => setLoading(false));
  }, [lang]);

  const getNextFeeDate = () => {
    if (!paymentDay) return "";
    const now = new Date();
    const month = now.getDate() > paymentDay ? now.getMonth() + 2 : now.getMonth() + 1;
    const year = now.getFullYear() + (month > 12 ? 1 : 0);
    const m = ((month - 1) % 12) + 1;
    return `${String(paymentDay).padStart(2, "0")}.${String(m).padStart(2, "0")}.${year}`;
  };

  const handleSelectPlan = (plan: PaidPlan) => {
    setSelectedPlan(plan);
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!selectedPlan || !subscriberId) return;
    setSubmitting(true);
    try {
      await apiFetch("api/paidPlan", {
        method: "PUT",
        body: JSON.stringify({
          subscriber_id: subscriberId,
          plan_id: selectedPlan.id,
        }),
      });
      setConfirmOpen(false);
      navigate("/account?refresh=1");
    } catch (err) {
      console.error("Failed to change plan:", err);
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
        </div>

        {/* Current plan badge */}
        <div className="mb-6 rounded-2xl border border-primary/30 bg-primary/5 px-5 py-3 flex items-center gap-3">
          <Check className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <span className="text-xs text-muted-foreground">{i.cp_currentPlan}</span>
            <p className="text-sm font-bold text-foreground">{currentPlanName}</p>
          </div>
          {currentPlanPrice !== null && (
            <span className="text-lg font-bold text-primary whitespace-nowrap">€{currentPlanPrice}<span className="text-xs font-normal text-muted-foreground">{i.cp_perMonth}</span></span>
          )}
        </div>

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
                    <span className="text-lg font-bold text-primary whitespace-nowrap">€{plan.price}<span className="text-xs font-normal text-muted-foreground">{i.cp_perMonth}</span></span>
                    <button
                      onClick={() => handleSelectPlan(plan)}
                      className="rounded-xl border border-primary px-5 py-2.5 text-sm font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground active:scale-[0.98]"
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
                  <p className="text-xs text-muted-foreground">€{freezePlan.price}{i.cp_perMonth}</p>
                </div>
                <button
                  onClick={() => handleSelectPlan(freezePlan)}
                  className="rounded-xl border border-orange-400 px-5 py-2.5 text-sm font-semibold text-orange-600 dark:text-orange-400 transition-all hover:bg-orange-500 hover:text-white active:scale-[0.98]"
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
            const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return `${String(d.getDate()).padStart(2,"0")}.${String(d.getMonth()+1).padStart(2,"0")}.${d.getFullYear()}`; })();
            let noteText = "";
            if (isFreeze) {
              noteText = i.cp_freezeNote.replace("{date}", feeDate).replace("{price}", String(selectedPlan.price));
            } else if (isUpgrade) {
              noteText = i.cp_upgradeNote.replace("{date}", tomorrow).replace("{price}", String(selectedPlan.price));
            } else {
              noteText = i.cp_downgradeNote.replace("{date}", feeDate);
            }
            return (
              <div className="space-y-4 py-2">
                <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-2">
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
                    <span className="font-bold text-primary">€{selectedPlan.price}</span>
                  </div>
                </div>
                <div className={cn(
                  "rounded-xl border p-4 text-sm text-foreground",
                  isFreeze ? "bg-orange-50/50 border-orange-300/50 dark:bg-orange-950/20 dark:border-orange-500/30" :
                  isUpgrade ? "bg-green-50/50 border-green-300/50 dark:bg-green-950/20 dark:border-green-500/30" :
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
