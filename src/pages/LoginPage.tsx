import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, Eye, EyeOff, ChevronDown, Globe, Zap, Lock, User } from "lucide-react";
import { cn } from "@/lib/utils";

type AuthTab = "email" | "phone";

const LoginPage = () => {
  const [activeTab, setActiveTab] = useState<AuthTab>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);

  const isValid =
    activeTab === "email"
      ? email.includes("@") && password.length >= 4
      : phone.length >= 6 && password.length >= 4;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              HIGHWAY <span className="font-medium text-muted-foreground">MOBILE</span>
            </span>
          </div>
          <button className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <Globe className="h-4 w-4" />
            RU
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          {/* Login Card */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Вход в личный кабинет
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Управляйте своим аккаунтом и услугами
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            {/* Tabs */}
            <div className="mb-6 flex rounded-xl bg-secondary p-1">
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

            {/* Forgot Password */}
            <div className="mb-6 text-right">
              <a href="#" className="text-sm text-primary hover:underline transition-colors">
                Забыли пароль?
              </a>
            </div>

            {/* Login Button */}
            <button
              disabled={!isValid}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all",
                isValid
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:brightness-110 active:scale-[0.98]"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              Войти
            </button>

            {/* Terms */}
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Нажимая «Войти», вы подтверждаете согласие с{" "}
              <a href="#" className="text-primary hover:underline">
                Условиями предоставляемых услуг
              </a>
            </p>

            {/* Divider */}
            <div className="my-6 border-t border-border" />

            {/* Register */}
            <p className="text-center text-sm text-muted-foreground">
              Если Вы ещё не являетесь абонентом, пожалуйста, пройдите{" "}
              <a href="#" className="font-semibold text-primary hover:underline">
                регистрацию
              </a>
              .
            </p>
          </div>

          {/* Top-up collapsible */}
          <div className="mt-6 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <button
              onClick={() => setTopUpOpen(!topUpOpen)}
              className="flex w-full items-center justify-between px-6 py-4 text-sm font-semibold text-primary transition-colors hover:bg-secondary/50"
            >
              <span className="text-base">Пополнение баланса</span>
              <ChevronDown
                className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  topUpOpen && "rotate-180"
                )}
              />
            </button>
            {topUpOpen && (
              <div className="border-t border-border px-6 py-5">
                <p className="text-sm text-muted-foreground mb-3">
                  Быстрое пополнение без входа в аккаунт
                </p>
                <Link
                  to="/topup"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 hover:brightness-110 transition-all active:scale-[0.98]"
                >
                  <Zap className="h-4 w-4" />
                  Перейти к пополнению
                </Link>
              </div>
            )}
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
