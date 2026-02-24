import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Mail, Phone, Eye, EyeOff, ChevronDown, Globe, Zap, Lock, User,
  Smartphone, CreditCard, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import highwayLogo from "@/assets/highway-logo.png";

type AuthTab = "email" | "phone";
type ActiveSection = "login" | "topup";

const amountPresets = [5, 10, 20, 50];

const LoginPage = () => {
  const [activeSection, setActiveSection] = useState<ActiveSection>("login");
  const [activeTab, setActiveTab] = useState<AuthTab>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Top-up state
  const [topUpPhone, setTopUpPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [topUpEmail, setTopUpEmail] = useState("");

  const isLoginValid =
    activeTab === "email"
      ? email.includes("@") && password.length >= 4
      : phone.length >= 6 && password.length >= 4;

  const displayAmount = amount ? parseFloat(amount) : 0;
  const isTopUpValid = topUpPhone.length >= 6 && displayAmount >= 3 && topUpEmail.includes("@");

  const handlePresetClick = (value: number) => {
    setSelectedPreset(value);
    setAmount(String(value));
  };

  const handleAmountChange = (val: string) => {
    setAmount(val);
    const num = parseFloat(val);
    setSelectedPreset(amountPresets.includes(num) ? num : null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <img src={highwayLogo} alt="Highway Mobile" className="h-9" />
          <button className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <Globe className="h-4 w-4" />
            RU
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md space-y-4">

          {/* ===== LOGIN SECTION ===== */}
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            {/* Login Header (always visible) */}
            <button
              onClick={() => setActiveSection(activeSection === "login" ? "topup" : "login")}
              className="flex w-full items-center justify-between px-6 py-4 transition-colors hover:bg-secondary/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <span className="text-base font-semibold text-foreground">Вход в личный кабинет</span>
              </div>
              <ChevronDown
                className={cn(
                  "h-5 w-5 text-muted-foreground transition-transform duration-200",
                  activeSection === "login" && "rotate-180"
                )}
              />
            </button>

            {/* Login Body */}
            <div
              className={cn(
                "grid transition-all duration-300 ease-in-out",
                activeSection === "login" ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <div className="border-t border-border px-6 pb-6 pt-5 sm:px-8 sm:pb-8">
                  <p className="mb-5 text-sm text-muted-foreground">
                    Управляйте своим аккаунтом и услугами
                  </p>

                  {/* Tabs */}
                  <div className="mb-5 flex rounded-xl bg-secondary p-1">
                    <button
                      onClick={() => setActiveTab("email")}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all",
                        activeTab === "email"
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Mail className="h-4 w-4" />
                      По EMail
                    </button>
                    <button
                      onClick={() => setActiveTab("phone")}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all",
                        activeTab === "phone"
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Phone className="h-4 w-4" />
                      По телефону
                    </button>
                  </div>

                  {/* Email / Phone Input */}
                  <div className="mb-4">
                    {activeTab === "email" ? (
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="email"
                          placeholder="test@test.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                    ) : (
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="tel"
                          placeholder="+34 123 456 789"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                    )}
                  </div>

                  {/* Password */}
                  <div className="mb-4">
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Пароль"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="mb-5 text-right">
                    <a href="#" className="text-sm text-primary hover:underline transition-colors">
                      Забыли пароль?
                    </a>
                  </div>

                  <button
                    disabled={!isLoginValid}
                    className={cn(
                      "flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all",
                      isLoginValid
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:brightness-110 active:scale-[0.98]"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    )}
                  >
                    Войти
                  </button>

                  <p className="mt-4 text-center text-xs text-muted-foreground">
                    Нажимая «Войти», вы подтверждаете согласие с{" "}
                    <a href="#" className="text-primary hover:underline">Условиями предоставляемых услуг</a>
                  </p>

                  <div className="my-5 border-t border-border" />

                  <p className="text-center text-sm text-muted-foreground">
                    Если Вы ещё не являетесь абонентом, пожалуйста, пройдите{" "}
                    <a href="#" className="font-semibold text-primary hover:underline">регистрацию</a>.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ===== TOP-UP SECTION ===== */}
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            {/* Top-up Header (always visible) */}
            <button
              onClick={() => setActiveSection(activeSection === "topup" ? "login" : "topup")}
              className="flex w-full items-center justify-between px-6 py-4 transition-colors hover:bg-secondary/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <CreditCard className="h-4 w-4 text-primary" />
                </div>
                <span className="text-base font-semibold text-foreground">Пополнение баланса</span>
              </div>
              <ChevronDown
                className={cn(
                  "h-5 w-5 text-muted-foreground transition-transform duration-200",
                  activeSection === "topup" && "rotate-180"
                )}
              />
            </button>

            {/* Top-up Body */}
            <div
              className={cn(
                "grid transition-all duration-300 ease-in-out",
                activeSection === "topup" ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <div className="border-t border-border px-6 pb-6 pt-5 sm:px-8 sm:pb-8">
                  <p className="mb-5 text-sm text-muted-foreground">
                    Мгновенное пополнение без комиссии
                  </p>

                  {/* Phone */}
                  <div className="mb-5">
                    <label className="mb-2 block text-sm font-medium text-foreground">Номер телефона</label>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-1 rounded-xl border border-border bg-secondary px-3 py-3 text-sm font-medium text-secondary-foreground">
                        <span>🇪🇸</span>
                        <span>+34</span>
                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <div className="relative flex-1">
                        <Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="tel"
                          placeholder="123 456 789"
                          value={topUpPhone}
                          onChange={(e) => setTopUpPhone(e.target.value)}
                          className="h-full w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="mb-5">
                    <label className="mb-2 block text-sm font-medium text-foreground">Сумма</label>
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
                        placeholder="Другая сумма (мин. 3€)"
                        value={amount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background py-3 pl-8 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium text-foreground">Email для чека</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="email"
                        placeholder="mail@example.com"
                        value={topUpEmail}
                        onChange={(e) => setTopUpEmail(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="mb-5 rounded-xl bg-secondary/60 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Сумма пополнения</span>
                      <span className="font-mono text-lg font-bold text-foreground">€{displayAmount.toFixed(2)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Комиссия</span>
                      <span className="text-sm font-semibold text-emerald-500">Бесплатно</span>
                    </div>
                    <div className="mt-3 border-t border-border pt-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">Итого</span>
                      <span className="font-mono text-xl font-bold text-foreground">€{displayAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Pay Button */}
                  <button
                    disabled={!isTopUpValid}
                    className={cn(
                      "flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all",
                      isTopUpValid
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:brightness-110 active:scale-[0.98]"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    )}
                  >
                    <CreditCard className="h-4 w-4" />
                    Оплатить картой
                  </button>

                  <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Shield className="h-3.5 w-3.5" />
                      Безопасная оплата
                    </div>
                    <span>•</span>
                    <span>Stripe</span>
                    <span>•</span>
                    <span>SSL</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex gap-4 text-xs text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Политика конфиденциальности</a>
              <a href="#" className="hover:text-foreground transition-colors">Пользовательское соглашение</a>
              <a href="#" className="hover:text-foreground transition-colors">Контакты</a>
            </div>
            <p className="text-xs text-muted-foreground">© 2026 highway.mobi</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
