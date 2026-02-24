import { useState } from "react";
import { Smartphone, Mail, CreditCard, Shield, Zap, ChevronDown, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const amountPresets = [5, 10, 20, 50];

const TopUpPage = () => {
  const [phoneCode, setPhoneCode] = useState("+34");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [email, setEmail] = useState("");

  const handlePresetClick = (value: number) => {
    setSelectedPreset(value);
    setAmount(String(value));
  };

  const handleAmountChange = (val: string) => {
    setAmount(val);
    const num = parseFloat(val);
    if (amountPresets.includes(num)) {
      setSelectedPreset(num);
    } else {
      setSelectedPreset(null);
    }
  };

  const displayAmount = amount ? parseFloat(amount) : 0;
  const isValid = phoneNumber.length >= 6 && displayAmount >= 3 && email.includes("@");

  return (
    <div className="min-h-screen bg-background">
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
      <main className="mx-auto max-w-lg px-4 py-8 sm:py-12">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Пополнение баланса
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Мгновенное пополнение без комиссии
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          {/* Phone */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-foreground">
              Номер телефона
            </label>
            <div className="flex gap-2">
              <div className="flex items-center gap-1 rounded-xl border border-border bg-secondary px-3 py-3 text-sm font-medium text-secondary-foreground">
                <span>🇪🇸</span>
                <span>{phoneCode}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="relative flex-1">
                <Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="tel"
                  placeholder="123 456 789"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="h-full w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Amount */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-foreground">
              Сумма
            </label>
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
          <div className="mb-8">
            <label className="mb-2 block text-sm font-medium text-foreground">
              Email для чека
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                placeholder="mail@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          {/* Divider + Summary */}
          <div className="mb-6 rounded-xl bg-secondary/60 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Сумма пополнения</span>
              <span className="font-mono text-lg font-bold text-foreground">
                €{displayAmount.toFixed(2)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Комиссия</span>
              <span className="text-sm font-semibold text-success">Бесплатно</span>
            </div>
            <div className="mt-3 border-t border-border pt-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Итого</span>
              <span className="font-mono text-xl font-bold text-foreground">
                €{displayAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Pay Button */}
          <button
            disabled={!isValid}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all",
              isValid
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:brightness-110 active:scale-[0.98]"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            <CreditCard className="h-4 w-4" />
            Оплатить картой
          </button>

          {/* Trust badges */}
          <div className="mt-5 flex items-center justify-center gap-4 text-xs text-muted-foreground">
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

export default TopUpPage;
