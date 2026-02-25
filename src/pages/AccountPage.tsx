import { useState } from "react";
import {
  Globe, ChevronDown, Bell, LogOut, User, Wifi, Phone as PhoneIcon,
  CreditCard, Plus, Clock, Info, Settings, ChevronRight, Signal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { t, type Lang } from "@/lib/i18n";
import highwayLogo from "@/assets/highway-logo.png";
import { useNavigate } from "react-router-dom";

const languages: { code: Lang; label: string }[] = [
  { code: "ru", label: "RU" },
  { code: "en", label: "EN" },
];

// Mock data — will come from API later
const mockUser = {
  name: "Sergei Karpushin",
  phone: "+34 681 999 090",
  plan: "EURO 12 Гб",
  balance: 9,
  monthlyFee: 8,
  feeDate: "15.03.2026",
  dataUsed: 0,
  dataTotal: 0,
  minutesLimit: null as string | null, // null = unlimited
  financePlanFee: 0,
  financeAdditional: 0,
  financeTopUp: 9,
  financeUsed: 0,
  financeRemaining: 9,
};

const AccountPage = () => {
  const [lang, setLang] = useState<Lang>("ru");
  const [langOpen, setLangOpen] = useState(false);
  const [financesOpen, setFinancesOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const navigate = useNavigate();
  const i = t(lang);

  const user = mockUser;

  const handleLogout = () => {
    document.cookie = "auth_token=; path=/; max-age=0";
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <img src={highwayLogo} alt="Highway Mobile" className="h-9" />
          <div className="flex items-center gap-3">
            <button className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              <Bell className="h-5 w-5" />
            </button>
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <Globe className="h-4 w-4" />
                {lang.toUpperCase()}
                <ChevronDown className={cn("h-3 w-3 transition-transform", langOpen && "rotate-180")} />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 min-w-[80px] rounded-lg border border-border bg-card shadow-lg overflow-hidden">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => { setLang(l.code); setLangOpen(false); }}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-secondary",
                        lang === l.code ? "font-semibold text-primary" : "text-foreground"
                      )}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

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
              <button className="rounded-xl border border-primary px-4 py-2 text-sm font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground">
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
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:brightness-110 active:scale-[0.98]"
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
            onClick={() => setProfileOpen(!profileOpen)}
            className="w-full rounded-2xl border border-border bg-card shadow-sm px-6 py-4 flex items-center justify-between transition-colors hover:bg-secondary/50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Settings className="h-4 w-4 text-primary" />
              </div>
              <span className="text-base font-semibold text-foreground">{i.acc_profile}</span>
            </div>
            <ChevronRight className={cn("h-5 w-5 text-muted-foreground transition-transform duration-200", profileOpen && "rotate-90")} />
          </button>

          {/* Information */}
          <button
            onClick={() => setInfoOpen(!infoOpen)}
            className="w-full rounded-2xl border border-border bg-card shadow-sm px-6 py-4 flex items-center justify-between transition-colors hover:bg-secondary/50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Info className="h-4 w-4 text-primary" />
              </div>
              <span className="text-base font-semibold text-foreground">{i.acc_info}</span>
            </div>
            <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform duration-200", infoOpen && "rotate-180")} />
          </button>

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
