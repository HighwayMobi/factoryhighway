import { CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLang } from "@/contexts/LangContext";
import { t } from "@/lib/i18n";
import InternalHeader from "@/components/InternalHeader";

const PaymentSuccessPage = () => {
  const { lang, setLang } = useLang();
  const navigate = useNavigate();
  const i = t(lang);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <InternalHeader lang={lang} onLangChange={setLang} />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <CheckCircle className="h-16 w-16 text-primary mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">
            {i.topup_paymentSuccess || "Оплата прошла успешно!"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {lang === "ru"
              ? "Средства будут зачислены в течение нескольких минут."
              : "Funds will be credited within a few minutes."}
          </p>
          <button
            onClick={() => navigate("/account")}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 hover:brightness-110 transition-all"
          >
            {i.back || "← Назад"}
          </button>
        </div>
      </main>
    </div>
  );
};

export default PaymentSuccessPage;
