import { useEffect } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLang } from "@/contexts/LangContext";
import { t } from "@/lib/i18n";
import InternalHeader from "@/components/InternalHeader";

const REDIRECT_DELAY_MS = 2500;

const PaymentSuccessPage = () => {
  const { lang, setLang } = useLang();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const i = t(lang);
  const returnTo = searchParams.get("returnTo");

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(returnTo || "/account?refresh=1");
    }, REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [navigate, returnTo]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <InternalHeader lang={lang} onLangChange={setLang} />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <CheckCircle className="h-16 w-16 text-primary mx-auto animate-in zoom-in-50 duration-300" />
          <h1 className="text-2xl font-bold text-foreground">
            {i.topup_paymentSuccess || "Оплата прошла успешно!"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {lang === "ru"
              ? "Средства будут зачислены в течение нескольких минут."
              : "Funds will be credited within a few minutes."}
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{lang === "ru" ? "Перенаправление..." : "Redirecting..."}</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaymentSuccessPage;
