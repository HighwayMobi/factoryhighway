import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useLangNavigate } from "@/hooks/use-lang-navigate";
import {
  Mail, Phone, Eye, EyeOff, ChevronDown, Globe, Lock, User,
  Smartphone, CreditCard, Shield, Loader2, Wifi, CheckCircle } from
"lucide-react";
import { cn, fmtPrice } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { useLang } from "@/contexts/LangContext";
import { useToast } from "@/hooks/use-toast";
import highwayLogo from "@/assets/highway-logo.png";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from
"@/components/ui/dialog";
import StripePaymentForm from "@/components/StripePaymentForm";



type AuthTab = "email" | "phone";
type ActiveSection = "login" | "topup";
type TopUpMode = "balance" | "buyGb";

const amountPresets = [5, 10, 20, 50];
const gbPackages = [
{ gb: 1, price: 3, id: "default-1" },
{ gb: 5, price: 6, id: "default-5" },
{ gb: 20, price: 10, popular: true, id: "default-20" }];

const languages: {code: "ru" | "en";label: string;}[] = [
{ code: "ru", label: "RU" },
{ code: "en", label: "EN" }];


const LoginPage = () => {
  const { lang, setLang } = useLang();
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const [searchParams] = useSearchParams();
  const sectionParam = searchParams.get("section");
  const [activeSection, setActiveSection] = useState<ActiveSection>(sectionParam === "topup" ? "topup" : "login");

  useEffect(() => {
    if (sectionParam === "topup") setActiveSection("topup");
    else if (sectionParam === "login") setActiveSection("login");
  }, [sectionParam]);
  const [activeTab, setActiveTab] = useState<AuthTab>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [topUpPhone, setTopUpPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [topUpEmail, setTopUpEmail] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotTab, setForgotTab] = useState<AuthTab>("email");
  const [forgotPhone, setForgotPhone] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState<{type: "ok" | "err";text: string;} | null>(null);
  const [forgotCooldown, setForgotCooldown] = useState(0);
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [topUpMode, setTopUpMode] = useState<TopUpMode>("balance");
  const [selectedGbPkg, setSelectedGbPkg] = useState<typeof gbPackages[0] | null>(null);
  const [paying, setPaying] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const { toast } = useToast();
  const navigate = useLangNavigate();
  const i = t(lang);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const phoneDigits = (val: string) => val.replace(/\D/g, "");

  const isLoginValid =
  activeTab === "email" ?
  email.includes("@") && password.length >= 4 :
  phoneDigits(phone).length === 9 && password.length >= 4;

  const displayAmount = amount ? parseFloat(amount) : 0;
  const isTopUpValid = phoneDigits(topUpPhone).length === 9 && displayAmount >= 3 && topUpEmail.includes("@");
  const isGbValid = phoneDigits(topUpPhone).length === 9 && topUpEmail.includes("@") && selectedGbPkg !== null;

  const handlePresetClick = (value: number) => {
    setSelectedPreset(value);
    setAmount(String(value));
  };

  // Guest payments use the unified <StripePaymentForm /> below, which calls the BO API directly.

  // Format phone: max 9 digits starting with 6 or 7, formatted as XXX XXX XXX
  const formatSpanishPhone = (raw: string): string => {
    const digits = raw.replace(/\D/g, "").slice(0, 9);
    if (digits.length === 0) return "";
    if (digits[0] !== "6" && digits[0] !== "7") return "";
    const parts = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 9)].filter(Boolean);
    return parts.join(" ");
  };

  const handlePhoneChange = (val: string, setter: (v: string) => void) => {
    setter(formatSpanishPhone(val));
  };

  const handleAmountChange = (val: string) => {
    setAmount(val);
    const num = parseFloat(val);
    setSelectedPreset(amountPresets.includes(num) ? num : null);
  };

  const handleLogin = async () => {
    setLoginError("");
    setIsLoggingIn(true);
    try {
      const body: Record<string, string> = {
        password,
        key: "6xARHinsvuC"
      };
      if (activeTab === "email") {
        body.username = email;
      } else {
        body.phone = phoneDigits(phone);
      }

      const res = await fetch("https://sim.highway.mobi/web/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body)
      });

      const data = await res.json().catch(() => ({}));

      const token = data?.data?.token || data?.token;
      if (!res.ok || data?.success === false || !token) {
        setLoginError(i.loginError);
        return;
      }

      const { setAuthToken } = await import("@/lib/api");
      setAuthToken(token);

      navigate("/account");
    } catch (err) {
      setLoginError(i.loginError);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Cooldown timer effect
  useEffect(() => {
    if (forgotCooldown <= 0) return;
    const timer = setInterval(() => {
      setForgotCooldown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [forgotCooldown]);

  const handleForgotPassword = async () => {
    if (forgotCooldown > 0) return;
    setForgotMsg(null);
    setForgotLoading(true);
    try {
      const body: Record<string, string> = forgotTab === "phone" ?
      { phone: phoneDigits(forgotPhone) } :
      { email: forgotEmail };

      const res = await fetch("https://sim.highway.mobi/web/api/forgotPassword", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setForgotMsg({ type: "ok", text: i.passwordSent });
        setForgotCooldown(120);
      } else {
        setForgotMsg({ type: "err", text: forgotTab === "phone" ? i.forgotPasswordError : i.forgotPasswordEmailError });
      }
    } catch {
      setForgotMsg({ type: "err", text: i.networkError });
    } finally {
      setForgotLoading(false);
    }
  };

  const isForgotValid = forgotTab === "phone" ?
  phoneDigits(forgotPhone).length === 9 :
  forgotEmail.includes("@");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <img src={highwayLogo} alt="Highway Mobile" className="h-9" />

          {/* Language Selector */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">

              <Globe className="h-4 w-4" />
              {lang.toUpperCase()}
              <ChevronDown className={cn("h-3 w-3 transition-transform", langOpen && "rotate-180")} />
            </button>
            {langOpen &&
            <div className="absolute right-0 top-full mt-1 z-50 min-w-[80px] rounded-lg border border-border bg-card shadow-lg overflow-hidden">
                {languages.map((l) =>
              <button
                key={l.code}
                onClick={() => {setLang(l.code);setLangOpen(false);}}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-secondary",
                  lang === l.code ? "font-semibold text-primary" : "text-foreground"
                )}>

                    {l.label}
                  </button>
              )}
              </div>
            }
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md space-y-4">

          {/* ===== LOGIN SECTION ===== */}
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <button
              onClick={() => setActiveSection(activeSection === "login" ? "topup" : "login")}
              className="flex w-full items-center justify-between px-6 py-4 transition-colors hover:bg-secondary/50">

              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <span className="text-base font-semibold text-foreground">{i.loginTitle}</span>
              </div>
              <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform duration-200", activeSection === "login" && "rotate-180")} />
            </button>

            <div className={cn("grid transition-all duration-300 ease-in-out", activeSection === "login" ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
              <div className="overflow-hidden">
                <div className="border-t border-border px-6 pb-6 pt-5 sm:px-8 sm:pb-8">
                  <p className="mb-5 text-sm text-muted-foreground">{i.loginSubtitle}</p>

                  {/* Tabs */}
                  <div className="mb-5 flex rounded-xl bg-secondary p-1">
                    <button
                      onClick={() => {setActiveTab("email");setPassword("");setLoginError("");}}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all",
                        activeTab === "email" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}>

                      <Mail className="h-4 w-4" />
                      {i.byEmail}
                    </button>
                    <button
                      onClick={() => {setActiveTab("phone");setPassword("");setLoginError("");}}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all",
                        activeTab === "phone" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}>

                      <Phone className="h-4 w-4" />
                      {i.byPhone}
                    </button>
                  </div>

                  {/* Email / Phone Input */}
                  <div className="mb-4">
                    {activeTab === "email" ?
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                        type="email"
                        placeholder="test@test.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />

                      </div> :

                    <div className="flex gap-2">
                        <div className="flex items-center rounded-xl border border-border bg-secondary px-3 py-3 text-sm font-medium text-secondary-foreground">
                          <span>🇪🇸</span>
                          <span className="ml-1">+34</span>
                        </div>
                        <div className="relative flex-1">
                          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <input
                          type="tel"
                          placeholder={i.phonePlaceholder}
                          value={phone}
                          onChange={(e) => handlePhoneChange(e.target.value, setPhone)}
                          className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />

                        </div>
                      </div>
                    }
                  </div>

                  {/* Password */}
                  <div className="mb-4">
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder={i.password}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">

                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="mb-5 text-right">
                    <button type="button" onClick={() => {setForgotOpen(true);setForgotTab("email");setForgotPhone("");setForgotEmail("");setForgotMsg(null);}} className="text-sm text-primary hover:underline transition-colors">{i.forgotPassword}</button>
                  </div>

                  {loginError &&
                  <div className="mb-4 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                      {loginError}
                    </div>
                  }


                  <button
                    disabled={!isLoginValid || isLoggingIn}
                    onClick={handleLogin}
                    className={cn(
                      "flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all",
                      isLoginValid && !isLoggingIn ?
                      "bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:brightness-110 active:scale-[0.98]" :
                      "bg-muted text-muted-foreground cursor-not-allowed"
                    )}>

                    {isLoggingIn && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isLoggingIn ? i.loggingIn : i.login}
                  </button>

                  <p className="mt-4 text-center text-xs text-muted-foreground">
                    {i.loginDisclaimer}{" "}
                    <a href={`https://highway.mobi/terms?lang=${lang}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{i.termsLink}</a>
                  </p>

                  <div className="my-5 border-t border-border" />

                  <p className="text-center text-sm text-muted-foreground">
                    {i.notSubscriber}{" "}
                    <a className="font-semibold text-primary hover:underline" href="https://signup.highway.mobi/?lang=en">{i.registration}</a>.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ===== TOP-UP SECTION ===== */}
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <button
              onClick={() => setActiveSection(activeSection === "topup" ? "login" : "topup")}
              className="flex w-full items-center justify-between px-6 py-4 transition-colors hover:bg-secondary/50">

              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <CreditCard className="h-4 w-4 text-primary" />
                </div>
                <span className="text-base font-semibold text-foreground">{i.topUpTitle}</span>
              </div>
              <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform duration-200", activeSection === "topup" && "rotate-180")} />
            </button>

            <div className={cn("grid transition-all duration-300 ease-in-out", activeSection === "topup" ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
              <div className="overflow-hidden">
                <div className="border-t border-border px-6 pb-6 pt-5 sm:px-8 sm:pb-8">
                   {/* Sub-tabs: Balance / Buy GB */}
                  <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1">
                    <button
                      onClick={() => setTopUpMode("balance")}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-[13px] sm:text-sm font-semibold transition-all text-center",
                        topUpMode === "balance" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}>
                      <span className="hidden sm:inline-flex"><CreditCard className="h-4 w-4 shrink-0" /></span>
                      {i.topup_tabBalance}
                    </button>
                    <button
                      onClick={() => setTopUpMode("buyGb")}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-[13px] sm:text-sm font-semibold transition-all text-center",
                        topUpMode === "buyGb" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}>
                      <span className="hidden sm:inline-flex"><Wifi className="h-4 w-4 shrink-0" /></span>
                      {i.topup_tabBuyGb}
                    </button>
                  </div>

                  {/* Phone (shared) */}
                  <div className="mb-5">
                    <label className="mb-2 block text-sm font-medium text-foreground">{i.phoneLabel}</label>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-1 rounded-xl border border-border bg-secondary px-3 py-3 text-sm font-medium text-secondary-foreground">
                        <span>🇪🇸</span>
                        <span>+34</span>
                      </div>
                      <div className="relative flex-1">
                        <Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="tel"
                          placeholder={i.phonePlaceholder}
                          value={topUpPhone}
                          onChange={(e) => handlePhoneChange(e.target.value, setTopUpPhone)}
                          className="h-full w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                      </div>
                    </div>
                  </div>

                  {topUpMode === "balance" ?
                  <>
                      {/* Amount */}
                      <div className="mb-5">
                        <label className="mb-2 block text-sm font-medium text-foreground">{i.amountLabel}</label>
                        <div className="mb-3 grid grid-cols-4 gap-2">
                          {amountPresets.map((preset) =>
                        <button
                          key={preset}
                          onClick={() => handlePresetClick(preset)}
                          className={cn(
                            "rounded-xl border py-2.5 text-sm font-semibold transition-all",
                            selectedPreset === preset ?
                            "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25" :
                            "border-border bg-background text-foreground hover:border-primary/40 hover:bg-primary/5"
                          )}>
                              €{preset}
                            </button>
                        )}
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">€</span>
                          <input
                          type="number"
                          min="3"
                          placeholder={i.otherAmount}
                          value={amount}
                          onChange={(e) => handleAmountChange(e.target.value)}
                          className="w-full rounded-xl border border-border bg-background py-3 pl-8 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                        </div>
                      </div>

                      {/* Email */}
                      <div className="mb-6">
                        <label className="mb-2 block text-sm font-medium text-foreground">{i.emailReceipt}</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <input
                          type="email"
                          placeholder="mail@example.com"
                          value={topUpEmail}
                          onChange={(e) => setTopUpEmail(e.target.value)}
                          className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="mb-5 rounded-xl bg-secondary/60 p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{i.topUpAmount}</span>
                          <span className="font-mono text-lg font-bold text-foreground">€{fmtPrice(displayAmount)}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{i.commission}</span>
                          <span className="text-sm font-semibold text-primary">{i.free}</span>
                        </div>
                        <div className="mt-3 border-t border-border pt-3 flex items-center justify-between">
                          <span className="text-sm font-semibold text-foreground">{i.total}</span>
                          <span className="font-mono text-xl font-bold text-foreground">€{fmtPrice(displayAmount)}</span>
                        </div>
                      </div>

                      {/* Pay Button or Embedded Form */}
                      {showPaymentForm && topUpMode === "balance" ?
                    paymentSuccess ?
                    <div className="flex flex-col items-center gap-3 py-6">
                            <CheckCircle className="h-12 w-12 text-primary" />
                            <p className="text-sm font-semibold text-foreground">{i.topup_paymentSuccess}</p>
                          </div> :

                    <StripePaymentForm
                      amount={displayAmount}
                      email={topUpEmail}
                       phone={`34${phoneDigits(topUpPhone)}`}
                      type="mobile"
                      onCancel={() => setShowPaymentForm(false)}
                      secureLabel={i.securePayment}
                      cancelLabel={i.topup_back} /> :


                    topUpMode === "balance" &&
                    <button
                      disabled={!isTopUpValid}
                      onClick={() => {setPaymentAmount(displayAmount);setShowPaymentForm(true);setPaymentSuccess(false);}}
                      className={cn(
                        "flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all",
                        isTopUpValid ?
                        "bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:brightness-110 active:scale-[0.98]" :
                        "bg-muted text-muted-foreground cursor-not-allowed"
                      )}>

                          <CreditCard className="h-4 w-4" />
                          {i.payByCard}
                        </button>
                    }
                    </> :

                  <>
                      {/* GB Packages */}
                      <div className="mb-5 space-y-3">
                        {gbPackages.map((pkg) =>
                      <div
                        key={pkg.gb}
                        onClick={() => setSelectedGbPkg(selectedGbPkg?.gb === pkg.gb ? null : pkg)}
                        className={cn(
                          "relative cursor-pointer rounded-2xl border p-4 transition-all",
                          selectedGbPkg?.gb === pkg.gb ?
                          "border-primary ring-2 ring-primary/20 bg-primary/5" :
                          pkg.popular ?
                          "border-primary/40 bg-card" :
                          "border-border bg-card hover:border-primary/40"
                        )}>

                            {pkg.popular &&
                        <span className="absolute -top-2.5 right-4 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                                {i.buyGb_popular}
                              </span>
                        }
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                                  <Wifi className="h-5 w-5 text-primary" />
                                </div>
                                <span className="text-lg font-bold text-foreground">{pkg.gb} GB</span>
                              </div>
                              <span className="text-lg font-bold text-primary">€{fmtPrice(pkg.price)}</span>
                            </div>
                          </div>
                      )}
                      </div>

                      {/* Email */}
                      <div className="mb-6">
                        <label className="mb-2 block text-sm font-medium text-foreground">{i.emailReceipt}</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <input
                          type="email"
                          placeholder="mail@example.com"
                          value={topUpEmail}
                          onChange={(e) => setTopUpEmail(e.target.value)}
                          className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                        </div>
                      </div>

                      {/* Summary for GB */}
                      {selectedGbPkg &&
                    <div className="mb-5 rounded-xl bg-secondary/60 p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">{selectedGbPkg.gb} GB</span>
                            <span className="font-mono text-lg font-bold text-foreground">€{fmtPrice(selectedGbPkg.price)}</span>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">{i.commission}</span>
                            <span className="text-sm font-semibold text-primary">{i.free}</span>
                          </div>
                          <div className="mt-3 border-t border-border pt-3 flex items-center justify-between">
                            <span className="text-sm font-semibold text-foreground">{i.total}</span>
                            <span className="font-mono text-xl font-bold text-foreground">€{fmtPrice(selectedGbPkg.price)}</span>
                          </div>
                        </div>
                    }

                      {/* Pay Button or Embedded Form */}
                      {showPaymentForm && topUpMode === "buyGb" ?
                    paymentSuccess ?
                    <div className="flex flex-col items-center gap-3 py-6">
                            <CheckCircle className="h-12 w-12 text-primary" />
                            <p className="text-sm font-semibold text-foreground">{i.topup_paymentSuccess}</p>
                          </div> :

                    <StripePaymentForm
                      amount={selectedGbPkg!.price}
                      email={topUpEmail}
                      phone={`34${phoneDigits(topUpPhone)}`}
                      type="gb"
                      size={selectedGbPkg!.gb}
                      packageId={selectedGbPkg!.id}
                      onCancel={() => setShowPaymentForm(false)}
                      secureLabel={i.securePayment}
                      cancelLabel={i.topup_back} /> :


                    topUpMode === "buyGb" &&
                    <button
                      disabled={!isGbValid}
                      onClick={() => {setShowPaymentForm(true);setPaymentSuccess(false);}}
                      className={cn(
                        "flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all",
                        isGbValid ?
                        "bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:brightness-110 active:scale-[0.98]" :
                        "bg-muted text-muted-foreground cursor-not-allowed"
                      )}>

                          <CreditCard className="h-4 w-4" />
                          {i.payByCard}
                        </button>
                    }
                    </>
                  }

                  









                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex gap-4 text-xs text-muted-foreground">
              <a href={`https://highway.mobi/privacy?lang=${lang}`} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">{i.privacy}</a>
              <a href={`https://highway.mobi/terms?lang=${lang}`} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">{i.terms}</a>
              <a href={`https://highway.mobi/?lang=${lang}#distributor`} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">{i.contacts}</a>
            </div>
            <p className="text-xs text-muted-foreground">© 2026 highway.mobi</p>
          </div>
        </div>
      </footer>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{i.forgotPasswordTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Tabs */}
            <div className="flex rounded-xl bg-secondary p-1">
              <button
                onClick={() => {setForgotTab("email");setForgotMsg(null);}}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all",
                  forgotTab === "email" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}>

                <Mail className="h-4 w-4" />
                {i.byEmail}
              </button>
              <button
                onClick={() => {setForgotTab("phone");setForgotMsg(null);}}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all",
                  forgotTab === "phone" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}>

                <Phone className="h-4 w-4" />
                {i.byPhone}
              </button>
            </div>

            <p className="text-sm text-muted-foreground">
              {forgotTab === "email" ? i.forgotPasswordDescEmail : i.forgotPasswordDescPhone}
            </p>

            {forgotTab === "email" ?
            <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                type="email"
                placeholder="mail@example.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />

              </div> :

            <div className="flex gap-2">
                <div className="flex items-center gap-1 rounded-xl border border-border bg-secondary px-3 py-3 text-sm font-medium text-secondary-foreground">
                  <span>🇪🇸</span>
                  <span>+34</span>
                </div>
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                  type="tel"
                  placeholder={i.phonePlaceholder}
                  value={forgotPhone}
                  onChange={(e) => handlePhoneChange(e.target.value, setForgotPhone)}
                  className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />

                </div>
              </div>
            }

            {forgotMsg &&
            <div className={cn(
              "rounded-xl border px-4 py-3 text-sm",
              forgotMsg.type === "ok" ?
              "bg-primary/10 border-primary/20 text-primary" :
              "bg-destructive/10 border-destructive/20 text-destructive"
            )}>
                {forgotMsg.text}
              </div>
            }

            <button
              disabled={!isForgotValid || forgotLoading || forgotCooldown > 0}
              onClick={handleForgotPassword}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all",
                isForgotValid && !forgotLoading && forgotCooldown === 0 ?
                "bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:brightness-110 active:scale-[0.98]" :
                "bg-muted text-muted-foreground cursor-not-allowed"
              )}>

              {forgotLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {forgotLoading ? i.sending : forgotCooldown > 0 ? `${i.sendPassword} (${Math.floor(forgotCooldown / 60)}:${String(forgotCooldown % 60).padStart(2, '0')})` : i.sendPassword}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>);

};

export default LoginPage;